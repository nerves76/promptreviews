-- Add offer fields to prompt_pages for per-page featured offer
ALTER TABLE public.prompt_pages
ADD COLUMN IF NOT EXISTS offer_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS offer_title TEXT DEFAULT 'Review Rewards',
ADD COLUMN IF NOT EXISTS offer_body TEXT;

-- Add comments for new columns
COMMENT ON COLUMN public.prompt_pages.offer_enabled IS 'Whether the featured offer is enabled for this prompt page';
COMMENT ON COLUMN public.prompt_pages.offer_title IS 'Title of the featured offer for this prompt page';
COMMENT ON COLUMN public.prompt_pages.offer_body IS 'Body/description of the featured offer for this prompt page'; 