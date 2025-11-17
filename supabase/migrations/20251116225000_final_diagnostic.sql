-- Final diagnostic - check ALL conditions the cron job requires

DO $$
DECLARE
  has_both INTEGER;
  also_pending INTEGER;
  also_not_null_name INTEGER;
  final_count INTEGER;
BEGIN
  -- Reviews with business_id AND review_text_copy
  SELECT COUNT(*) INTO has_both
  FROM public.review_submissions
  WHERE platform = 'Google Business Profile'
  AND business_id IS NOT NULL
  AND review_text_copy IS NOT NULL;

  -- Also have auto_verification_status = 'pending'
  SELECT COUNT(*) INTO also_pending
  FROM public.review_submissions
  WHERE platform = 'Google Business Profile'
  AND business_id IS NOT NULL
  AND review_text_copy IS NOT NULL
  AND auto_verification_status = 'pending';

  -- Also have first_name or last_name
  SELECT COUNT(*) INTO also_not_null_name
  FROM public.review_submissions
  WHERE platform = 'Google Business Profile'
  AND business_id IS NOT NULL
  AND review_text_copy IS NOT NULL
  AND auto_verification_status = 'pending'
  AND (first_name IS NOT NULL OR last_name IS NOT NULL);

  -- Final count matching EXACTLY what cron job queries
  SELECT COUNT(*) INTO final_count
  FROM public.review_submissions
  WHERE platform = 'Google Business Profile'
  AND auto_verification_status = 'pending'
  AND business_id IS NOT NULL
  AND review_text_copy IS NOT NULL
  LIMIT 10;

  RAISE NOTICE 'With business_id AND review_text_copy: %', has_both;
  RAISE NOTICE 'Also auto_verification_status=pending: %', also_pending;
  RAISE NOTICE 'Also have name: %', also_not_null_name;
  RAISE NOTICE 'Matching cron query (limit 10): %', final_count;
END $$;
