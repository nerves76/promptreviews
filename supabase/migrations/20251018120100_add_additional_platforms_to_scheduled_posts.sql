-- Add additional_platforms column to google_business_scheduled_posts
-- This allows optional cross-posting to Bluesky (and future platforms) when scheduling Google Business posts

-- Add the column
ALTER TABLE public.google_business_scheduled_posts
  ADD COLUMN IF NOT EXISTS additional_platforms JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Comment to document the structure
COMMENT ON COLUMN public.google_business_scheduled_posts.additional_platforms IS 'Optional platforms for cross-posting. Structure: {"bluesky": {"enabled": true, "connection_id": "uuid"}, "twitter": {...}, "slack": {...}}';

-- Backfill existing rows with empty object
UPDATE public.google_business_scheduled_posts
SET additional_platforms = '{}'::jsonb
WHERE additional_platforms IS NULL;

-- Create index for querying posts with specific platforms enabled
CREATE INDEX IF NOT EXISTS idx_google_business_scheduled_posts_additional_platforms
  ON public.google_business_scheduled_posts USING GIN (additional_platforms);
