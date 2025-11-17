-- Show actual auto_verification_status values in production database

DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '=== AUTO_VERIFICATION_STATUS VALUE ANALYSIS ===';

  -- Show unique values and counts
  FOR rec IN
    SELECT
      auto_verification_status,
      COUNT(*) as count
    FROM public.review_submissions
    WHERE platform = 'Google Business Profile'
    GROUP BY auto_verification_status
    ORDER BY count DESC
  LOOP
    RAISE NOTICE 'Status: "%" (count: %)', rec.auto_verification_status, rec.count;
  END LOOP;

  -- Show sample pending reviews with all relevant fields
  RAISE NOTICE '';
  RAISE NOTICE '=== SAMPLE REVIEWS WITH STATUS=pending ===';
  FOR rec IN
    SELECT id, auto_verification_status, business_id IS NOT NULL as has_business, review_text_copy IS NOT NULL as has_text
    FROM public.review_submissions
    WHERE platform = 'Google Business Profile'
      AND auto_verification_status = 'pending'
    LIMIT 5
  LOOP
    RAISE NOTICE 'ID: %, Status: "%", Has Business: %, Has Text: %',
      rec.id, rec.auto_verification_status, rec.has_business, rec.has_text;
  END LOOP;
END $$;
