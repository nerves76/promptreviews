-- Diagnose why failed reviews can't be reset to pending

DO $$
DECLARE
  total_failed INTEGER;
  has_business INTEGER;
  has_text INTEGER;
  has_both INTEGER;
  rec RECORD;
BEGIN
  SELECT COUNT(*) INTO total_failed
  FROM public.review_submissions
  WHERE platform = 'Google Business Profile'
    AND auto_verification_status = 'failed';

  SELECT COUNT(*) INTO has_business
  FROM public.review_submissions
  WHERE platform = 'Google Business Profile'
    AND auto_verification_status = 'failed'
    AND business_id IS NOT NULL;

  SELECT COUNT(*) INTO has_text
  FROM public.review_submissions
  WHERE platform = 'Google Business Profile'
    AND auto_verification_status = 'failed'
    AND review_text_copy IS NOT NULL
    AND TRIM(review_text_copy) != '';

  SELECT COUNT(*) INTO has_both
  FROM public.review_submissions
  WHERE platform = 'Google Business Profile'
    AND auto_verification_status = 'failed'
    AND business_id IS NOT NULL
    AND review_text_copy IS NOT NULL
    AND TRIM(review_text_copy) != '';

  RAISE NOTICE 'Total failed: %', total_failed;
  RAISE NOTICE 'With business_id: %', has_business;
  RAISE NOTICE 'With review_text_copy: %', has_text;
  RAISE NOTICE 'With BOTH: %', has_both;

  -- Show samples of what's missing
  RAISE NOTICE '';
  RAISE NOTICE '=== SAMPLE FAILED REVIEWS (showing what is missing) ===';
  FOR rec IN
    SELECT
      id,
      business_id IS NULL as missing_business,
      review_text_copy IS NULL as missing_text,
      verified
    FROM public.review_submissions
    WHERE platform = 'Google Business Profile'
      AND auto_verification_status = 'failed'
    LIMIT 10
  LOOP
    RAISE NOTICE 'ID: %, Missing business: %, Missing text: %, Already verified: %',
      rec.id, rec.missing_business, rec.missing_text, rec.verified;
  END LOOP;
END $$;
