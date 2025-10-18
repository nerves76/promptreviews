-- Extend google_business_scheduled_post_results to support multi-platform posting results
-- This allows tracking success/failure for each platform (Google, Bluesky, etc.)

-- Add platform column to track which platform this result is for
ALTER TABLE public.google_business_scheduled_post_results
  ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'google';

-- Comment to document platform values
COMMENT ON COLUMN public.google_business_scheduled_post_results.platform IS 'Platform for this result: "google", "bluesky", "twitter", "slack"';

-- Drop existing unique constraint on location_id (if exists) since we now have multiple results per location (one per platform)
-- Note: There may not be a unique constraint, so we use DROP IF EXISTS
DO $$
BEGIN
  -- Drop constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'google_business_scheduled_post_results_location_id_key'
  ) THEN
    ALTER TABLE public.google_business_scheduled_post_results
      DROP CONSTRAINT google_business_scheduled_post_results_location_id_key;
  END IF;
END $$;

-- Create composite index for querying by scheduled_post_id, location_id, and platform
CREATE INDEX IF NOT EXISTS idx_google_business_scheduled_post_results_composite
  ON public.google_business_scheduled_post_results (scheduled_post_id, location_id, platform);

-- Backfill existing results to mark them as 'google' platform
UPDATE public.google_business_scheduled_post_results
SET platform = 'google'
WHERE platform IS NULL OR platform = '';
