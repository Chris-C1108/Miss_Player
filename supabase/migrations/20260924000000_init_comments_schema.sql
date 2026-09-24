-- =====================================================================
-- 0. 扩展与公共基础函数
-- =====================================================================
create extension if not exists "uuid-ossp";

-- =====================================================================
-- 1. 影片信息主表 (videos)
-- =====================================================================
create table if not exists public.videos (
    id uuid primary key default uuid_generate_v4(),
    avcode text not null unique,               -- 归一化大写番号 (如 MIAA-598)
    title text,                                 -- 影片标题
    cover_url text,                             -- 封面图链接
    duration_seconds integer,                   -- 影片总秒数
    total_comments integer default 0,           -- 累计抓取评论数
    last_scraped_at timestamptz,                -- 最近一次抓取更新时间
    created_at timestamptz not null default now()
);

-- 索引：按番号查询是最高频入口
create index if not exists idx_videos_avcode on public.videos (avcode);

-- =====================================================================
-- 2. 评论数据明细表 (comments)
-- =====================================================================
create table if not exists public.comments (
    id uuid primary key default uuid_generate_v4(),
    video_id uuid references public.videos(id) on delete cascade,
    avcode text not null,                       -- 冗余番号，避免高频 JOIN
    source_site text not null,                  -- 抓取源：'jable' | 'javdb' | 'javlibrary'
    site_comment_id text,                       -- 站点原生的评论 ID (用于增量防重)
    user_name text,                             -- 评论者昵称
    user_url text,                              -- 评论者主页链接
    content_raw text not null,                  -- 原始评论内容
    score text,                                 -- 站点评分 (若有)
    is_spam boolean default false,              -- 是否被识别为灌水/广告
    spam_reason text,                           -- 识别为灌水的理由
    has_timestamps boolean default false,       -- 是否成功解析出时间戳/时间区间
    hash_fingerprint text not null unique,      -- 内容指纹 (md5(source+site_id+content)) 保证幂等 UPSERT
    published_at text,                          -- 原站展示时间
    created_at timestamptz not null default now()
);

-- 索引：番号与抓取时间复合索引、唯一指纹索引
create index if not exists idx_comments_avcode_created on public.comments (avcode, created_at desc);
create index if not exists idx_comments_source_id on public.comments (source_site, site_comment_id);

-- =====================================================================
-- 3. 结构化时间戳与胶囊片段表 (timestamps)
-- =====================================================================
create table if not exists public.timestamps (
    id uuid primary key default uuid_generate_v4(),
    comment_id uuid references public.comments(id) on delete cascade,
    avcode text not null,
    type text not null check (type in ('highlight', 'interval')), -- 单点高光还是 AB 区间
    start_seconds numeric(8, 2) not null,       -- 起始秒数 (支持小数位)
    end_seconds numeric(8, 2),                  -- 结束秒数 (单点时为 null)
    label text,                                 -- 片段描述或备注
    tags text[],                                -- 多维标签 (如 ['#仰面深喉', '#剧情神回'])
    created_at timestamptz not null default now()
);

create index if not exists idx_timestamps_avcode on public.timestamps (avcode);
create index if not exists idx_timestamps_start_seconds on public.timestamps (avcode, start_seconds);

-- =====================================================================
-- 4. 评论问题上报记录表 (comment_reports)
-- =====================================================================
create table if not exists public.comment_reports (
    id uuid primary key default uuid_generate_v4(),
    avcode text not null,
    comment_id text,
    user_name text,
    comment_text text,
    reason text not null,                       -- 上报原因 (时间解析错误、倒序需过滤等)
    user_note text,                             -- 用户补充的描述
    reported_at timestamptz not null default now()
);

create index if not exists idx_reports_avcode on public.comment_reports (avcode);

-- =====================================================================
-- 5. 行级安全策略 (Row-Level Security - RLS)
-- =====================================================================
-- 启用全表 RLS
alter table public.videos enable row level security;
alter table public.comments enable row level security;
alter table public.timestamps enable row level security;
alter table public.comment_reports enable row level security;

-- 允许匿名用户 (anon) 读取公开视频与评论、时间戳
create policy "Allow anon read videos" on public.videos for select to anon using (true);
create policy "Allow anon read comments" on public.comments for select to anon using (true);
create policy "Allow anon read timestamps" on public.timestamps for select to anon using (true);

-- 允许匿名用户 (anon) 写入采集到的新数据与问题上报 (单手播放器本地采集回传)
create policy "Allow anon insert videos" on public.videos for insert to anon with check (true);
create policy "Allow anon insert comments" on public.comments for insert to anon with check (true);
create policy "Allow anon update videos" on public.videos for update to anon using (true) with check (true);
create policy "Allow anon insert timestamps" on public.timestamps for insert to anon with check (true);
create policy "Allow anon insert reports" on public.comment_reports for insert to anon with check (true);
