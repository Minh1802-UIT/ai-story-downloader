-- =====================================================
-- AI Story Downloader - Database Schema Migration
-- Chạy file này trong Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. BẢNG profiles (Quản lý Người dùng & Tín dụng)
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text         NOT NULL UNIQUE,
  credits    integer      NOT NULL DEFAULT 100,
  created_at timestamptz  NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.profiles IS 'Quản lý tài khoản người dùng và credits sử dụng dịch vụ AI.';
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


-- 2. BẢNG stories (Danh mục Truyện - Caching metadata)
CREATE TABLE IF NOT EXISTS public.stories (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text         NOT NULL UNIQUE,
  source_url  text         NOT NULL,
  title       text         NOT NULL,
  created_at  timestamptz  NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.stories IS 'Lưu metadata của truyện để tránh scrape lại nhiều lần.';
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Index để tìm kiếm nhanh theo slug
CREATE INDEX IF NOT EXISTS stories_slug_idx ON public.stories (slug);


-- 3. BẢNG chapters (Kho nội dung - Cơ chế Cache tiết kiệm API)
CREATE TABLE IF NOT EXISTS public.chapters (
  id                    uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id              uuid         REFERENCES public.stories (id) ON DELETE CASCADE,
  chapter_number        integer      NOT NULL,
  title                 text,
  raw_content           text,
  ai_rewritten_content  text,
  audio_url             text,
  created_at            timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (story_id, chapter_number)  -- Một truyện không có 2 chương cùng số
);
COMMENT ON TABLE public.chapters IS 'Lưu nội dung thô (raw) và kết quả AI (rewritten) để tái sử dụng.';
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

-- Index để query chương nhanh
CREATE INDEX IF NOT EXISTS chapters_story_id_idx ON public.chapters (story_id);
CREATE INDEX IF NOT EXISTS chapters_number_idx ON public.chapters (story_id, chapter_number);


-- 4. BẢNG jobs (Hàng đợi xử lý ngầm - Background Task Queue)
CREATE TABLE IF NOT EXISTS public.jobs (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid         REFERENCES public.profiles (id) ON DELETE SET NULL,
  type         text         NOT NULL CHECK (type IN ('BATCH_DOWNLOAD', 'AI_REWRITE', 'TTS_GENERATE')),
  status       text         NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED')),
  progress     integer      NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  result_data  jsonb,
  created_at   timestamptz  NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.jobs IS 'Quản lý vòng đời của các tác vụ nặng chạy nền (Batch Download, AI Rewrite, TTS).';
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Index status để Worker query nhanh
CREATE INDEX IF NOT EXISTS jobs_status_idx ON public.jobs (status);


-- =====================================================
-- RLS Policies (Tạm thời mở wide-open cho development)
-- QUAN TRỌNG: Khi production phải thay bằng policy per-user
-- =====================================================
CREATE POLICY "Allow all for development" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON public.stories FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON public.chapters FOR ALL USING (true);
CREATE POLICY "Allow all for development" ON public.jobs FOR ALL USING (true);
