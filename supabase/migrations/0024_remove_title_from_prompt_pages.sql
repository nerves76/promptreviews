-- Remove the title column from prompt_pages
ALTER TABLE public.prompt_pages
  DROP COLUMN IF EXISTS title;

-- Remove comment if it exists (safe to run even if already gone)
-- COMMENT ON COLUMN public.prompt_pages.title IS NULL; 