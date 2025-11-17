-- Reset failed reviews to pending, excluding already manually verified ones

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
  AND (verified = false OR verified IS NULL);

-- Log the results
DO $$
DECLARE
  reset_count INTEGER;
  ready_count INTEGER;
BEGIN
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  RAISE NOTICE '✅ Reset % reviews from failed to pending', reset_count;

  -- Count how many are now ready
  SELECT COUNT(*) INTO ready_count
  FROM public.review_submissions
  WHERE platform = 'Google Business Profile'
    AND auto_verification_status = 'pending'
    AND business_id IS NOT NULL
    AND review_text_copy IS NOT NULL;

  RAISE NOTICE '✅ READY: % reviews are now pending auto-verification', ready_count;
END $$;
