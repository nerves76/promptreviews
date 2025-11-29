-- Add business_location_id to review_submissions for location-based filtering
-- This links reviews to business_locations (separate from google_business_location_id which links to GBP locations)

ALTER TABLE public.review_submissions
ADD COLUMN IF NOT EXISTS business_location_id uuid REFERENCES public.business_locations(id) ON DELETE SET NULL;

-- Index for filtering reviews by location
CREATE INDEX IF NOT EXISTS idx_review_submissions_business_location
ON public.review_submissions(business_location_id);

-- Backfill: Try to match existing reviews to business_locations based on location_name
-- This matches on location name or city name
UPDATE public.review_submissions rs
SET business_location_id = bl.id
FROM public.business_locations bl
WHERE rs.business_location_id IS NULL
  AND rs.account_id = bl.account_id
  AND rs.location_name IS NOT NULL
  AND (
    LOWER(TRIM(rs.location_name)) = LOWER(TRIM(bl.name))
    OR LOWER(TRIM(rs.location_name)) = LOWER(TRIM(bl.address_city))
  );
