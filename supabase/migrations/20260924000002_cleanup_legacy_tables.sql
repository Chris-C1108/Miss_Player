-- =====================================================================
-- 清理旧的单行表与冗余外键 (全面升级为方案 1 video_comments_bundle)
-- =====================================================================
DROP TABLE IF EXISTS public.timestamps CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.videos CASCADE;
