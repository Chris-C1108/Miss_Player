-- =====================================================================
-- 方案：社区高能播放热度图 (video_crowd_heatmap)
-- 120 字节定长量化 + 服务端原子对数增量饱和合并 (Log-Saturated Increment CRDT)
-- 零服务器成本 (500MB 免费额度可存 100万+ 番号，单片仅 120 字节)
-- =====================================================================

create table if not exists public.video_crowd_heatmap (
    avcode text primary key,                        -- 归一化大写番号
    heatmap bytea not null,                         -- 固定 120 字节定长二进制 (每个字节 0~255)
    total_samples integer default 1,                -- 累计众包贡献次数
    duration_seconds integer default 0,             -- 视频基准物理时长 (秒)
    updated_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

-- 开启行级安全策略 (RLS)
alter table public.video_crowd_heatmap enable row level security;

-- 允许匿名读取
drop policy if exists "Allow anon read video_crowd_heatmap" on public.video_crowd_heatmap;
create policy "Allow anon read video_crowd_heatmap" 
    on public.video_crowd_heatmap for select to anon using (true);

-- 聚合与原子增量合并 RPC 函数
create or replace function public.upsert_crowd_heatmap(
    p_avcode text,
    p_delta_base64 text,
    p_duration_seconds integer default 0
) returns jsonb as $$
declare
    v_norm_code text := upper(trim(p_avcode));
    v_delta bytea;
    v_existing bytea;
    v_result bytea;
    v_samples int := 1;
    v_old_dur int := 0;
    v_final_dur int := coalesce(p_duration_seconds, 0);
    v_len int;
    i int;
    d_byte int;
    e_byte int;
    v_incr int;
    v_merged_byte int;
begin
    if v_norm_code = '' or p_delta_base64 is null or length(p_delta_base64) = 0 then
        return jsonb_build_object('success', false, 'error', 'Invalid arguments');
    end if;

    -- 解码客户端上报的增量 Base64 字节串
    begin
        v_delta := decode(p_delta_base64, 'base64');
    exception when others then
        return jsonb_build_object('success', false, 'error', 'Invalid Base64 payload');
    end if;

    v_len := length(v_delta);
    if v_len <> 120 then
        return jsonb_build_object('success', false, 'error', 'Payload length must be exactly 120 bytes');
    end if;

    -- 查找已有记录
    select heatmap, total_samples, coalesce(duration_seconds, 0)
    into v_existing, v_samples, v_old_dur
    from public.video_crowd_heatmap
    where avcode = v_norm_code;

    if v_final_dur <= 0 then
        v_final_dur := v_old_dur;
    end if;

    if not found or v_existing is null or length(v_existing) <> 120 then
        -- 首次入库：直接保存 120 字节并设置样本数为 1
        insert into public.video_crowd_heatmap (avcode, heatmap, total_samples, duration_seconds, updated_at)
        values (v_norm_code, v_delta, 1, v_final_dur, now())
        on conflict (avcode) do update set
            heatmap = excluded.heatmap,
            total_samples = 1,
            duration_seconds = case when excluded.duration_seconds > 0 then excluded.duration_seconds else video_crowd_heatmap.duration_seconds end,
            updated_at = now();

        return jsonb_build_object('success', true, 'avcode', v_norm_code, 'samples', 1, 'is_new', true);
    end if;

    -- 已存在：执行 120 字节对数饱和合并 (Log-Saturated Merge)
    v_result := v_existing;
    for i in 0..119 loop
        d_byte := get_byte(v_delta, i);
        e_byte := get_byte(v_existing, i);

        if d_byte > 0 then
            -- 单次会话对数衰减贡献，最多单次 +3 点 (满分 255)，防刷量与指数爆炸
            v_incr := least(3, greatest(1, ceil(ln(1 + d_byte))));
            v_merged_byte := least(255, e_byte + v_incr);
            v_result := set_byte(v_result, i, v_merged_byte);
        end if;
    end loop;

    v_samples := v_samples + 1;

    update public.video_crowd_heatmap
    set heatmap = v_result,
        total_samples = v_samples,
        duration_seconds = case when v_final_dur > 0 then v_final_dur else duration_seconds end,
        updated_at = now()
    where avcode = v_norm_code;

    return jsonb_build_object(
        'success', true,
        'avcode', v_norm_code,
        'samples', v_samples,
        'is_new', false
    );
end;
$$ language plpgsql security definer;

grant execute on function public.upsert_crowd_heatmap(text, text, integer) to anon;
