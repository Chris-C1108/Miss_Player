-- ============================================================================
-- 迁移并归一历史变体番号 (如 MIAA-490-UNCENSORED-LEAK -> MIAA-490) 与清理空 DM 壳行
-- ============================================================================
-- 背景：
--   旧版部分入口未统一经 cleanAvCode() 归一化或受 /dmXX/cn/ 路由解析缺陷影响，
--   在 video_comments_bundle / video_crowd_heatmap / comment_reports 中写入了带版本后缀
--   (-UNCENSORED-LEAK, -CH, -C 等) 或未规范化的 avcode，以及空的 DM-XX 壳行。
--
-- 修复策略（幂等，可重复执行）：
--   1. 提取规范化 avcode（剔除 -UNCENSORED/-LEAK/-CH/-C/-4K/-HD/-SUB 等后缀并大写）；
--   2. 对 video_comments_bundle：将变体行评论 JSONB 合并去重至规范 avcode 行后删除变体行，
--      并清理 total_count = 0 的空 DM-XX 误建壳行；
--   3. 对 video_crowd_heatmap：将变体行 120 字节热度按字节饱和合并至规范 avcode 行后删除变体行；
--   4. 对 comment_reports：将变体 avcode 更新为规范 avcode。
-- ============================================================================

create or replace function public.canonicalize_avcode_key(raw text)
returns text as $$
declare
    v text;
begin
    v := upper(trim(coalesce(raw, '')));
    if v = '' then
        return '';
    end if;
    -- 剥离常见版本与清晰度后缀（与客户端 videoCode.js sanitizeInput 保持一致）
    v := regexp_replace(
        v,
        '(?:[-_ ](?:C|CH|UC|HD|FHD|4K|LEAKED|LEAK|UNCENSORED|CHINESE|WUMA|YOUMA|SUBTITLE|SUB|REDUCED[-_]MOSAIC))+$',
        '',
        'gi'
    );
    return trim(v);
end;
$$ language plpgsql immutable;

create or replace function public.normalize_historical_avcode_rows()
returns jsonb as $$
declare
    r record;
    v_target text;
    v_existing jsonb;
    v_merged jsonb;
    v_total int;
    v_ts int;
    v_bundle_count int := 0;
    v_heatmap_count int := 0;
    v_report_count int := 0;
    v_deleted_empty_dm int := 0;
    v_target_hm bytea;
    v_merged_hm bytea;
    v_target_samples int;
    v_target_dur int;
    i int;
    b_src int;
    b_dst int;
begin
    -- 1. video_comments_bundle 变体行合并归位
    for r in
        select avcode, comments, last_source
        from public.video_comments_bundle
        where avcode <> public.canonicalize_avcode_key(avcode)
          and public.canonicalize_avcode_key(avcode) <> ''
    loop
        v_target := public.canonicalize_avcode_key(r.avcode);

        select comments into v_existing
        from public.video_comments_bundle
        where avcode = v_target
        for update;

        with combined as (
            select value from jsonb_array_elements(coalesce(v_existing, '[]'::jsonb))
            union all
            select value from jsonb_array_elements(coalesce(r.comments, '[]'::jsonb))
        ),
        deduped as (
            select distinct on (
                coalesce(
                    nullif(value->>'site_comment_id', ''),
                    nullif(value->>'hash_fingerprint', ''),
                    nullif(value->>'content_raw', ''),
                    value->>'text'
                )
            ) value
            from combined
            order by coalesce(
                nullif(value->>'site_comment_id', ''),
                nullif(value->>'hash_fingerprint', ''),
                nullif(value->>'content_raw', ''),
                value->>'text'
            )
        )
        select
            coalesce(jsonb_agg(value), '[]'::jsonb),
            count(*),
            coalesce(count(*) filter (where (value->>'has_timestamps') = 'true'), 0)
        into v_merged, v_total, v_ts
        from deduped;

        insert into public.video_comments_bundle (avcode, comments, total_count, has_timestamps_count, last_source, updated_at)
        values (v_target, coalesce(v_merged, '[]'::jsonb), coalesce(v_total, 0), coalesce(v_ts, 0), r.last_source, now())
        on conflict (avcode) do update set
            comments = excluded.comments,
            total_count = excluded.total_count,
            has_timestamps_count = excluded.has_timestamps_count,
            updated_at = now();

        delete from public.video_comments_bundle where avcode = r.avcode;
        v_bundle_count := v_bundle_count + 1;
    end loop;

    -- 清理 total_count = 0 的空 DM-XX 误建壳行
    delete from public.video_comments_bundle
    where avcode ~ '^DM-[0-9]+$'
      and coalesce(total_count, 0) = 0
      and jsonb_array_length(coalesce(comments, '[]'::jsonb)) = 0;
    get diagnostics v_deleted_empty_dm = row_count;

    -- 2. video_crowd_heatmap 变体行 120 字节合并归位
    for r in
        select avcode, heatmap, total_samples, duration_seconds
        from public.video_crowd_heatmap
        where avcode <> public.canonicalize_avcode_key(avcode)
          and public.canonicalize_avcode_key(avcode) <> ''
    loop
        v_target := public.canonicalize_avcode_key(r.avcode);

        select heatmap, total_samples, duration_seconds
        into v_target_hm, v_target_samples, v_target_dur
        from public.video_crowd_heatmap
        where avcode = v_target
        for update;

        if not found or v_target_hm is null or octet_length(v_target_hm) <> 120 then
            insert into public.video_crowd_heatmap (avcode, heatmap, total_samples, duration_seconds, updated_at)
            values (v_target, r.heatmap, greatest(1, coalesce(r.total_samples, 1)), coalesce(r.duration_seconds, 0), now())
            on conflict (avcode) do update set
                heatmap = excluded.heatmap,
                total_samples = excluded.total_samples,
                duration_seconds = greatest(video_crowd_heatmap.duration_seconds, excluded.duration_seconds),
                updated_at = now();
        elsif r.heatmap is not null and octet_length(r.heatmap) = 120 then
            v_merged_hm := v_target_hm;
            for i in 0..119 loop
                b_src := get_byte(r.heatmap, i);
                b_dst := get_byte(v_target_hm, i);
                if b_src > 0 then
                    v_merged_hm := set_byte(v_merged_hm, i, least(255, b_dst + b_src));
                end if;
            end loop;
            update public.video_crowd_heatmap
            set heatmap = v_merged_hm,
                total_samples = coalesce(v_target_samples, 1) + coalesce(r.total_samples, 1),
                duration_seconds = greatest(coalesce(v_target_dur, 0), coalesce(r.duration_seconds, 0)),
                updated_at = now()
            where avcode = v_target;
        end if;

        delete from public.video_crowd_heatmap where avcode = r.avcode;
        v_heatmap_count := v_heatmap_count + 1;
    end loop;

    -- 3. comment_reports 变体番号归一
    update public.comment_reports
    set avcode = public.canonicalize_avcode_key(avcode)
    where avcode <> public.canonicalize_avcode_key(avcode)
      and public.canonicalize_avcode_key(avcode) <> '';
    get diagnostics v_report_count = row_count;

    return jsonb_build_object(
        'bundles_merged', v_bundle_count,
        'empty_dm_deleted', v_deleted_empty_dm,
        'heatmaps_merged', v_heatmap_count,
        'reports_normalized', v_report_count
    );
end;
$$ language plpgsql security definer;

revoke all on function public.normalize_historical_avcode_rows() from public;
grant execute on function public.normalize_historical_avcode_rows() to service_role;

do $$
declare
    v_res jsonb;
begin
    v_res := public.normalize_historical_avcode_rows();
    raise notice 'historical avcode rows normalized: %', v_res;
end;
$$;
