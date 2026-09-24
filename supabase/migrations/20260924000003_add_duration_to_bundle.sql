-- =====================================================================
-- 为 video_comments_bundle 增加视频总时长字段 duration_seconds
-- 用于辅助时间戳分析、倒数时间纠正与真假阳性边界判定
-- =====================================================================

alter table public.video_comments_bundle 
    add column if not exists duration_seconds integer default 0;

-- 升级 upsert_comment_bundle RPC 函数，支持写入并保留视频总时长
create or replace function public.upsert_comment_bundle(
    p_avcode text,
    p_new_comments jsonb,
    p_source text default 'unknown',
    p_duration_seconds integer default 0
) returns jsonb as $$
declare
    v_existing_comments jsonb := '[]'::jsonb;
    v_existing_duration int := 0;
    v_merged jsonb := '[]'::jsonb;
    v_total int := 0;
    v_ts_count int := 0;
    v_final_duration int := coalesce(p_duration_seconds, 0);
begin
    -- 1. 查找现有记录
    select comments, coalesce(duration_seconds, 0)
    into v_existing_comments, v_existing_duration
    from public.video_comments_bundle
    where avcode = p_avcode;

    if not found then
        v_existing_comments := '[]'::jsonb;
        v_existing_duration := 0;
    end if;

    -- 取较大的有效时长
    if v_final_duration <= 0 or v_final_duration = 10800 then
        v_final_duration := v_existing_duration;
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

    -- 3. 原子更新入库 (含 duration_seconds)
    insert into public.video_comments_bundle (avcode, comments, total_count, has_timestamps_count, duration_seconds, last_source, updated_at)
    values (p_avcode, v_merged, v_total, v_ts_count, v_final_duration, p_source, now())
    on conflict (avcode) do update set
        comments = excluded.comments,
        total_count = excluded.total_count,
        has_timestamps_count = excluded.has_timestamps_count,
        duration_seconds = case when excluded.duration_seconds > 0 then excluded.duration_seconds else video_comments_bundle.duration_seconds end,
        last_source = excluded.last_source,
        updated_at = now();

    return jsonb_build_object('success', true, 'avcode', p_avcode, 'total_count', v_total, 'has_timestamps_count', v_ts_count, 'duration_seconds', v_final_duration);
end;
$$ language plpgsql security definer;

grant execute on function public.upsert_comment_bundle(text, jsonb, text, integer) to anon;
