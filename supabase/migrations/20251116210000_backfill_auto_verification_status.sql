-- Backfill auto_verification_status for existing Google Business Profile reviews
-- This sets pending status for reviews that don't have it set yet

UPDATE public.review_submissions
SET
  auto_verification_status = 'pending',
  verification_attempts = 0,
  review_text_copy = COALESCE(review_text_copy, review_content)
WHERE
  platform = 'Google Business Profile'
  AND auto_verification_status IS NULL
  AND verified = false
  AND business_id IS NOT NULL
  AND (review_content IS NOT NULL OR review_text_copy IS NOT NULL);

-- Add comment for documentation
COMMENT ON COLUMN public.review_submissions.auto_verification_status IS 'Automated verification status: pending, verified, not_found, failed. Backfilled for existing reviews.';
