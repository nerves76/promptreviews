-- Re-run backfills with detailed logging to understand what's happening

DO $$
DECLARE
  reviews_updated_text INTEGER;
  reviews_updated_business INTEGER;
  final_ready_count INTEGER;
BEGIN
  -- Step 1: Copy review_content to review_text_copy
  UPDATE public.review_submissions
  SET review_text_copy = review_content
  WHERE platform = 'Google Business Profile'
    AND (review_text_copy IS NULL OR review_text_copy = '');

  GET DIAGNOSTICS reviews_updated_text = ROW_COUNT;
  RAISE NOTICE 'Updated review_text_copy for % reviews', reviews_updated_text;

  -- Step 2: Backfill business_id
  UPDATE public.review_submissions rs
  SET business_id = b.id
  FROM public.prompt_pages pp
  JOIN public.businesses b ON b.account_id = pp.account_id
  WHERE rs.prompt_page_id = pp.id
    AND rs.platform = 'Google Business Profile'
    AND rs.business_id IS NULL
    AND pp.account_id IS NOT NULL;

  GET DIAGNOSTICS reviews_updated_business = ROW_COUNT;
  RAISE NOTICE 'Updated business_id for % reviews', reviews_updated_business;

  -- Step 3: Count final ready reviews
  SELECT COUNT(*) INTO final_ready_count
  FROM public.review_submissions
  WHERE platform = 'Google Business Profile'
    AND auto_verification_status = 'pending'
    AND business_id IS NOT NULL
    AND review_text_copy IS NOT NULL
    AND TRIM(review_text_copy) != '';

  RAISE NOTICE '✅ FINAL: % Google Business Profile reviews ready for verification', final_ready_count;

  -- Step 4: Show sample of ready reviews
  RAISE NOTICE 'Sample ready review IDs: %', (
    SELECT string_agg(id::text, ', ')
    FROM (
      SELECT id
      FROM public.review_submissions
      WHERE platform = 'Google Business Profile'
        AND auto_verification_status = 'pending'
        AND business_id IS NOT NULL
        AND review_text_copy IS NOT NULL
      LIMIT 5
    ) AS sample
  );
END $$;
