-- =====================================================================
-- 方案 1：番号聚合 JSONB 高密度仓储表 (video_comments_bundle)
-- 500 MB 免费额度下支撑 500万+ 条评论的高性能架构
-- =====================================================================

create table if not exists public.video_comments_bundle (
    avcode text primary key,                     -- 归一化大写番号 (全表仅 1 个主键索引)
    comments jsonb not null default '[]'::jsonb, -- 包含所有抓取评论对象的 JSONB 数组 (自动触发 TOAST LZ4/PGLZ 压缩)
    total_count integer default 0,               -- 累计抓取评论数
    has_timestamps_count integer default 0,       -- 含有时间戳的有效评论数
    last_source text,                            -- 最近抓取更新站点
    updated_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

-- 开启行级安全策略 (RLS)
alter table public.video_comments_bundle enable row level security;

-- 匿名角色 (anon) 权限策略
create policy "Allow anon read video_comments_bundle" 
    on public.video_comments_bundle for select to anon using (true);

create policy "Allow anon insert video_comments_bundle" 
    on public.video_comments_bundle for insert to anon with check (true);

create policy "Allow anon update video_comments_bundle" 
    on public.video_comments_bundle for update to anon using (true) with check (true);

-- 高性能 RPC 函数：支持服务端原子增量去重合并与统计 (避免并发写覆盖与多次网络往返)
create or replace function public.upsert_comment_bundle(
    p_avcode text,
    p_new_comments jsonb,
    p_source text default 'unknown'
) returns jsonb as $$
declare
    v_existing_comments jsonb := '[]'::jsonb;
    v_merged jsonb := '[]'::jsonb;
    v_total int := 0;
    v_ts_count int := 0;
begin
    -- 1. 查找现有评论数组
    select comments into v_existing_comments
    from public.video_comments_bundle
    where avcode = p_avcode;

    if not found then
        v_existing_comments := '[]'::jsonb;
    end if;

    -- 2. 合并去重 (基于 hash_fingerprint 或 site_comment_id)
    with combined as (
        select value from jsonb_array_elements(coalesce(v_existing_comments, '[]'::jsonb))
        union all
        select value from jsonb_array_elements(coalesce(p_new_comments, '[]'::jsonb))
    ),
    deduped as (
        select distinct on (coalesce(value->>'hash_fingerprint', value->>'site_comment_id', value->>'content_raw', value->>'text')) value
        from combined
        order by coalesce(value->>'hash_fingerprint', value->>'site_comment_id', value->>'content_raw', value->>'text')
    )
    select jsonb_agg(value), count(*), count(*) filter (where (value->'has_timestamps')::boolean = true or (value->>'has_timestamps') = 'true')
    into v_merged, v_total, v_ts_count
    from deduped;

    if v_merged is null then
        v_merged := '[]'::jsonb;
    end if;

    -- 3. 原子更新入库
    insert into public.video_comments_bundle (avcode, comments, total_count, has_timestamps_count, last_source, updated_at)
    values (p_avcode, v_merged, v_total, v_ts_count, p_source, now())
    on conflict (avcode) do update set
        comments = excluded.comments,
        total_count = excluded.total_count,
        has_timestamps_count = excluded.has_timestamps_count,
        last_source = excluded.last_source,
        updated_at = now();

    return jsonb_build_object('success', true, 'avcode', p_avcode, 'total_count', v_total, 'has_timestamps_count', v_ts_count);
end;
$$ language plpgsql security definer;

grant execute on function public.upsert_comment_bundle(text, jsonb, text) to anon;
