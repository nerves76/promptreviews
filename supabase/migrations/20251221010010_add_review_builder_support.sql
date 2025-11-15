-- Review Builder support: store builder configuration per prompt page
ALTER TABLE public.prompt_pages
  ADD COLUMN IF NOT EXISTS builder_questions jsonb DEFAULT '[]'::jsonb;

-- Persist reviewer answers/keywords captured through Review Builder runs
ALTER TABLE public.review_submissions
  ADD COLUMN IF NOT EXISTS builder_answers jsonb,
  ADD COLUMN IF NOT EXISTS builder_keywords text[] DEFAULT ARRAY[]::text[];
