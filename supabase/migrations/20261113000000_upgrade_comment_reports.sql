-- =====================================================================
-- 升级 comment_reports 表结构与 submit_comment_report RPC
-- 补充结构化诊断快照字段 (reason_code, script_version, source_site,
-- video_duration, parser_snapshot, expected_hint, status, fixed_in_version)
-- 完全向后兼容旧版 6 参数调用方
-- =====================================================================

alter table public.comment_reports
    add column if not exists reason_code text,
    add column if not exists script_version text,
    add column if not exists source_site text,
    add column if not exists video_duration integer,
    add column if not exists parser_snapshot jsonb,
    add column if not exists expected_hint text,
    add column if not exists status text not null default 'open',
    add column if not exists fixed_in_version text;

create index if not exists idx_comment_reports_status_reported
    on public.comment_reports (status, reported_at desc);

create index if not exists idx_comment_reports_reason_code
    on public.comment_reports (reason_code);

drop function if exists public.submit_comment_report(text, text, text, text, text, text);

create or replace function public.submit_comment_report(
    p_avcode text,
    p_comment_id text,
    p_user_name text,
    p_comment_text text,
    p_reason text,
    p_user_note text default null,
    p_reason_code text default null,
    p_script_version text default null,
    p_source_site text default null,
    p_video_duration integer default null,
    p_parser_snapshot jsonb default null,
    p_expected_hint text default null
) returns jsonb as $$
declare
    v_id uuid;
begin
    insert into public.comment_reports (
        avcode,
        comment_id,
        user_name,
        comment_text,
        reason,
        user_note,
        reason_code,
        script_version,
        source_site,
        video_duration,
        parser_snapshot,
        expected_hint,
        reported_at
    )
    values (
        upper(coalesce(p_avcode, '')),
        coalesce(p_comment_id, ''),
        coalesce(nullif(trim(p_user_name), ''), '匿名'),
        coalesce(p_comment_text, ''),
        coalesce(p_reason, 'other'),
        nullif(trim(coalesce(p_user_note, '')), ''),
        nullif(trim(coalesce(p_reason_code, '')), ''),
        nullif(trim(coalesce(p_script_version, '')), ''),
        nullif(trim(coalesce(p_source_site, '')), ''),
        case when p_video_duration is not null and p_video_duration > 0 then p_video_duration else null end,
        p_parser_snapshot,
        nullif(trim(coalesce(p_expected_hint, '')), ''),
        now()
    )
    returning id into v_id;

    return jsonb_build_object('success', true, 'id', v_id, 'avcode', upper(coalesce(p_avcode, '')));
end;
$$ language plpgsql security definer;

grant execute on function public.submit_comment_report(
    text, text, text, text, text, text,
    text, text, text, integer, jsonb, text
) to anon;
