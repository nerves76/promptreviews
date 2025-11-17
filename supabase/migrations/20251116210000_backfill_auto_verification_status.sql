-- Backfill auto_verification_status for existing Google Business Profile reviews
-- This sets pending status for unverified reviews and copies review content

UPDATE public.review_submissions
SET
  auto_verification_status = 'pending',
  verification_attempts = 0,
  review_text_copy = COALESCE(review_text_copy, review_content)
WHERE
  platform = 'Google Business Profile'
  AND verified = false
  AND business_id IS NOT NULL
  AND review_content IS NOT NULL
  AND (auto_verification_status = 'pending' OR auto_verification_status IS NULL);

-- Add comment for documentation
COMMENT ON COLUMN public.review_submissions.auto_verification_status IS 'Automated verification status: pending, verified, not_found, failed. Backfilled for existing reviews.';
