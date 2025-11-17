-- Reset 'failed' reviews back to 'pending' if they now have the required data
-- This allows them to be retried now that business_id and review_text_copy are populated

UPDATE public.review_submissions
SET
  auto_verification_status = 'pending',
  verification_attempts = 0,
  last_verification_attempt_at = NULL
WHERE platform = 'Google Business Profile'
  AND auto_verification_status = 'failed'
  AND business_id IS NOT NULL
  AND review_text_copy IS NOT NULL
  AND TRIM(review_text_copy) != ''
  AND verified = false;

-- Log the results
DO $$
DECLARE
  reset_count INTEGER;
BEGIN
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  RAISE NOTICE '✅ Reset % reviews from failed to pending', reset_count;
END $$;
