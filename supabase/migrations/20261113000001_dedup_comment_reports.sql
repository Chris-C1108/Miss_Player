-- =====================================================================
-- 评论上报指纹去重与频次计数升级 (Stage C-2)
-- 1. 增加 report_fingerprint / report_count / last_reported_at
-- 2. 清理历史完全重复上报（保留最早记录并累加 report_count）
-- 3. 升级 submit_comment_report RPC：同指纹碰撞自动合并并 +1 计数
-- =====================================================================

alter table public.comment_reports
    add column if not exists report_fingerprint text,
    add column if not exists report_count integer not null default 1,
    add column if not exists last_reported_at timestamptz;

update public.comment_reports
set
    report_fingerprint = md5(
        upper(coalesce(avcode, '')) || '|' ||
        md5(coalesce(comment_text, '')) || '|' ||
        coalesce(nullif(trim(reason_code), ''), nullif(trim(reason), ''), 'other')
    ),
    last_reported_at = coalesce(last_reported_at, reported_at, now())
where report_fingerprint is null;

-- 合并历史同指纹重复行（保留最早 id，累加 report_count）
with grouped as (
    select
        report_fingerprint,
        (array_agg(id order by reported_at asc nulls last, id asc))[1] as keep_id,
        sum(coalesce(report_count, 1))::integer as total_count,
        max(coalesce(last_reported_at, reported_at, now())) as latest_at
    from public.comment_reports
    where report_fingerprint is not null
    group by report_fingerprint
    having count(*) > 1
),
updated as (
    update public.comment_reports cr
    set
        report_count = g.total_count,
        last_reported_at = g.latest_at
    from grouped g
    where cr.id = g.keep_id
    returning cr.id
)
delete from public.comment_reports cr
using grouped g
where cr.report_fingerprint = g.report_fingerprint
  and cr.id <> g.keep_id;

create unique index if not exists idx_comment_reports_fingerprint_unique
    on public.comment_reports (report_fingerprint)
    where report_fingerprint is not null;

create index if not exists idx_comment_reports_count_desc
    on public.comment_reports (status, report_count desc, last_reported_at desc);

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
    v_count integer;
    v_avcode text := upper(coalesce(p_avcode, ''));
    v_fingerprint text := md5(
        upper(coalesce(p_avcode, '')) || '|' ||
        md5(coalesce(p_comment_text, '')) || '|' ||
        coalesce(nullif(trim(p_reason_code), ''), nullif(trim(p_reason), ''), 'other')
    );
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
        report_fingerprint,
        report_count,
        reported_at,
        last_reported_at
    )
    values (
        v_avcode,
        coalesce(p_comment_id, 'unknown'),
        coalesce(p_user_name, '匿名'),
        coalesce(p_comment_text, ''),
        coalesce(p_reason, '未指定'),
        p_user_note,
        p_reason_code,
        p_script_version,
        p_source_site,
        p_video_duration,
        p_parser_snapshot,
        p_expected_hint,
        v_fingerprint,
        1,
        now(),
        now()
    )
    on conflict (report_fingerprint) where report_fingerprint is not null
    do update set
        report_count = public.comment_reports.report_count + 1,
        last_reported_at = now(),
        user_note = coalesce(excluded.user_note, public.comment_reports.user_note),
        expected_hint = coalesce(excluded.expected_hint, public.comment_reports.expected_hint),
        parser_snapshot = coalesce(excluded.parser_snapshot, public.comment_reports.parser_snapshot),
        video_duration = coalesce(excluded.video_duration, public.comment_reports.video_duration),
        script_version = coalesce(excluded.script_version, public.comment_reports.script_version)
    returning id, report_count into v_id, v_count;

    return jsonb_build_object(
        'success', true,
        'id', v_id,
        'avcode', v_avcode,
        'report_count', v_count,
        'deduplicated', v_count > 1
    );
end;
$$ language plpgsql security definer;

grant execute on function public.submit_comment_report(text, text, text, text, text, text, text, text, text, integer, jsonb, text) to anon, authenticated;
