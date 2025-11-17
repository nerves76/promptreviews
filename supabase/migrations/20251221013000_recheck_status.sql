-- Recheck current status distribution

DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '=== CURRENT STATUS DISTRIBUTION ===';

  FOR rec IN
    SELECT
      auto_verification_status,
      COUNT(*) as count,
      COUNT(*) FILTER (WHERE business_id IS NOT NULL) as with_business,
      COUNT(*) FILTER (WHERE review_text_copy IS NOT NULL) as with_text,
      COUNT(*) FILTER (WHERE business_id IS NOT NULL AND review_text_copy IS NOT NULL) as with_both
    FROM public.review_submissions
    WHERE platform = 'Google Business Profile'
    GROUP BY auto_verification_status
    ORDER BY count DESC
  LOOP
    RAISE NOTICE 'Status: "%" - Total: %, With business: %, With text: %, With both: %',
      rec.auto_verification_status, rec.count, rec.with_business, rec.with_text, rec.with_both;
  END LOOP;
END $$;
