-- Repair migration: Add business_location_id column to review_submissions if it doesn't exist

-- Add the column if it doesn't exist
ALTER TABLE public.review_submissions
  ADD COLUMN IF NOT EXISTS business_location_id uuid REFERENCES public.business_locations(id);

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_review_submissions_business_location_id
  ON public.review_submissions(business_location_id);
