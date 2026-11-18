-- ============================================================================
-- 手动修复脚本：评论多站点跨站串源（source_site 错标 + 重复行）
-- 用途：无需等待 main 分支自动部署，可直接整段粘贴到 Supabase Dashboard → SQL Editor 执行
-- 版本：v5.7.118-beta.055 配套
-- 幂等：可重复执行多次，结果收敛一致
-- ============================================================================

-- ---------- 0. 修复前体检（可选，先跑这一段看数据规模） ----------
-- 错标总数（ID 指向 JavDB 却标成 jable 的评论条数）
select count(*) as mislabeled_javdb_as_jable
from public.video_comments_bundle b,
     jsonb_array_elements(coalesce(b.comments, '[]'::jsonb)) c
where lower(coalesce(c->>'site_comment_id', '')) like 'javdb%'
  and coalesce(c->>'source_site', '') <> 'javdb';

-- 各 bundle 的评论总数与时间戳命中数（修复后应下降）
select sum(total_count) as total_comments,
       sum(has_timestamps_count) as total_ts
from public.video_comments_bundle;


-- ---------- 1. 创建修复函数（幂等，create or replace） ----------
create or replace function public.normalize_bundle_comment_sources()
returns jsonb as $$
declare
    r record;
    v_merged jsonb;
    v_ts int := 0;
    v_processed_bundles int := 0;
    v_processed_comments int := 0;
begin
    for r in
        select avcode, comments from public.video_comments_bundle
    loop
        with relabeled as (
            select
                case
                    when lower(coalesce(value->>'site_comment_id', '')) like 'javdb%'
                        then jsonb_set(value, '{source_site}', '"javdb"'::jsonb, true)
                    when lower(coalesce(value->>'site_comment_id', '')) like 'javlib%'
                        then jsonb_set(value, '{source_site}', '"javlib"'::jsonb, true)
                    when coalesce(value->>'site_comment_id', '') ~ '^[0-9]+$'
                        then jsonb_set(value, '{source_site}', '"jable"'::jsonb, true)
                    else value
                end as v
            from jsonb_array_elements(coalesce(r.comments, '[]'::jsonb))
        ),
        deduped as (
            select distinct on (
                coalesce(
                    nullif(v->>'site_comment_id', ''),
                    nullif(v->>'hash_fingerprint', ''),
                    nullif(v->>'content_raw', ''),
                    v->>'text'
                )
            ) v
            from relabeled
            order by coalesce(
                nullif(v->>'site_comment_id', ''),
                nullif(v->>'hash_fingerprint', ''),
                nullif(v->>'content_raw', ''),
                v->>'text'
            )
        )
        select
            coalesce(jsonb_agg(v), '[]'::jsonb),
            coalesce(count(*) filter (where (v->>'has_timestamps') = 'true'), 0)
        into v_merged, v_ts
        from deduped;

        if v_merged is not null then
            update public.video_comments_bundle
               set comments = v_merged,
                   total_count = jsonb_array_length(v_merged),
                   has_timestamps_count = v_ts,
                   updated_at = now()
             where avcode = r.avcode;

            v_processed_bundles := v_processed_bundles + 1;
            v_processed_comments := v_processed_comments + jsonb_array_length(v_merged);
        end if;
    end loop;

    return jsonb_build_object(
        'bundles', v_processed_bundles,
        'comments', v_processed_comments
    );
end;
$$ language plpgsql security definer;

comment on function public.normalize_bundle_comment_sources() is
    '修复历史评论 source_site 错标与重复行 (按 site_comment_id 前缀归一 + 去重)';

revoke all on function public.normalize_bundle_comment_sources() from public;
grant execute on function public.normalize_bundle_comment_sources() to service_role;


-- ---------- 2. 执行修复（返回处理的 bundle 数与最终评论数） ----------
select public.normalize_bundle_comment_sources();


-- ---------- 3. 修复后验证 ----------
-- 错标应归零
select count(*) as remaining_mislabeled
from public.video_comments_bundle b,
     jsonb_array_elements(coalesce(b.comments, '[]'::jsonb)) c
where lower(coalesce(c->>'site_comment_id', '')) like 'javdb%'
  and coalesce(c->>'source_site', '') <> 'javdb';

-- 站点分布（jable 应为纯数字 ID，javdb 应为 javdb-*，javlib 应为 javlib-*）
select case
           when lower(coalesce(c->>'site_comment_id', '')) like 'javdb%' then 'javdb(按ID)'
           when lower(coalesce(c->>'site_comment_id', '')) like 'javlib%' then 'javlib(按ID)'
           when coalesce(c->>'site_comment_id', '') ~ '^[0-9]+$' then 'jable(按ID)'
           else 'unknown'
       end as id_namespace,
       coalesce(c->>'source_site', '(null)') as labeled_source,
       count(*) as n
from public.video_comments_bundle b,
     jsonb_array_elements(coalesce(b.comments, '[]'::jsonb)) c
group by 1, 2
order by n desc;
