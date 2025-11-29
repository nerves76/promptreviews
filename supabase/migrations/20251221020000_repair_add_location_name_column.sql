-- Repair migration: Add location_name column to review_submissions if it doesn't exist
-- This repairs the 20251127123344 migration that was tracked as applied but the column is missing

-- Add the column if it doesn't exist
ALTER TABLE public.review_submissions
  ADD COLUMN IF NOT EXISTS location_name text;

-- Create index if it doesn't exist  
CREATE INDEX IF NOT EXISTS idx_review_submissions_location_name
  ON public.review_submissions(location_name);

-- Backfill from google_location_name for GBP imports
UPDATE public.review_submissions
SET location_name = google_location_name
WHERE google_location_name IS NOT NULL
  AND location_name IS NULL;

-- Backfill from business_locations via prompt_pages for Prompt Page reviews
UPDATE public.review_submissions rs
SET location_name = CONCAT_WS(', ',
  bl.address_city,
  CONCAT(bl.address_state, ' ', bl.address_zip)
)
FROM prompt_pages pp
JOIN business_locations bl ON pp.business_location_id = bl.id
WHERE rs.prompt_page_id = pp.id
  AND rs.location_name IS NULL
  AND bl.address_city IS NOT NULL;
