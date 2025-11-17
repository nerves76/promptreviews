-- Reset ALL failed Google reviews to pending, including manually verified ones
-- We want to auto-verify them to get the google_review_id link

UPDATE public.review_submissions
SET
  auto_verification_status = 'pending',
  verification_attempts = 0,
  last_verification_attempt_at = NULL
WHERE platform = 'Google Business Profile'
  AND auto_verification_status = 'failed'
  AND business_id IS NOT NULL
  AND review_text_copy IS NOT NULL
  AND TRIM(review_text_copy) != '';

-- Log the results
DO $$
DECLARE
  reset_count INTEGER;
BEGIN
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  RAISE NOTICE '✅ Reset % reviews from failed to pending (including manually verified)', reset_count;

  -- Verify the count
  SELECT COUNT(*) INTO reset_count
  FROM public.review_submissions
  WHERE platform = 'Google Business Profile'
    AND auto_verification_status = 'pending';

  RAISE NOTICE '✅ CONFIRMED: % reviews now have status=pending', reset_count;
END $$;
