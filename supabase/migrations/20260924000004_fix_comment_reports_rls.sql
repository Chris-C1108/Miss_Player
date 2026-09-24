-- =====================================================================
-- 修复并升级 comment_reports 表的 RLS 行级安全策略与 RPC
-- 允许 anon 匿名用户安全上报评论问题与标注样本
-- =====================================================================

alter table public.comment_reports enable row level security;

drop policy if exists "Allow anon insert reports" on public.comment_reports;
create policy "Allow anon insert reports" 
    on public.comment_reports 
    for insert to anon 
    with check (true);

drop policy if exists "Allow anon read reports" on public.comment_reports;
create policy "Allow anon read reports" 
    on public.comment_reports 
    for select to anon 
    using (true);

-- 建立服务端 RPC 函数以方便安全调用与拓展字段
create or replace function public.submit_comment_report(
    p_avcode text,
    p_comment_id text,
    p_user_name text,
    p_comment_text text,
    p_reason text,
    p_user_note text default null
) returns jsonb as $$
declare
    v_id uuid;
begin
    insert into public.comment_reports (avcode, comment_id, user_name, comment_text, reason, user_note, reported_at)
    values (upper(p_avcode), p_comment_id, coalesce(p_user_name, '匿名'), p_comment_text, p_reason, p_user_note, now())
    returning id into v_id;

    return jsonb_build_object('success', true, 'id', v_id, 'avcode', p_avcode);
end;
$$ language plpgsql security definer;

grant execute on function public.submit_comment_report(text, text, text, text, text, text) to anon;
