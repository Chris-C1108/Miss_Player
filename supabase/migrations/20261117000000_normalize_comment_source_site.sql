-- ============================================================================
-- 修复历史「跨站点串源」脏数据 (comment source_site 错标)
-- ============================================================================
-- 背景：
--   旧版 CommentDebugCollector 只读 `c.source`，而各 Provider 写入的是 `c.site`，
--   导致全部 JavDB / JAVLibrary 评论被标成 `source_site = 'jable'` 写入 WebDAV 与
--   Supabase。用户侧表现为「不同站点 section 内评论完全相同」。
--   由于 hash_fingerprint = md5(source + id + content)，同一条评论还产生了两个指纹
--   并存（实测 1,464 个 bundle 中 5,288 条 JavDB 短评被以 jable 身份双写）。
--
-- 修复策略（幂等，可重复执行）：
--   1. 站点归属以 site_comment_id 前缀为唯一权威（javdb* -> javdb、javlib* -> javlib、
--      纯数字 -> jable），仅对无法判定者保留原值；
--   2. 以 (site_comment_id) 或 (hash_fingerprint) 或 (content_raw/text) 为键去重；
--   3. 回写 comments / total_count / has_timestamps_count / updated_at。
-- ============================================================================

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
    '一次性修复历史评论 source_site 错标与重复行 (按 site_comment_id 前缀归一 + 去重)';

-- 允许匿名只读执行计划外无需授权：此修复函数仅由管理员在迁移后手动执行一次
revoke all on function public.normalize_bundle_comment_sources() from public;
grant execute on function public.normalize_bundle_comment_sources() to service_role;

-- 迁移部署时立即执行一次修复（幂等），使 main 分支自动部署即可完成数据自愈，无需人工介入
do $$
declare
    v_result jsonb;
begin
    v_result := public.normalize_bundle_comment_sources();
    raise notice 'comment source_site normalized: %', v_result;
end;
$$;
