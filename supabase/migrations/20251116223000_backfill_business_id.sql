-- Backfill business_id for review_submissions that have prompt_page_id but no business_id
-- business_id references businesses table, get it via account_id

UPDATE public.review_submissions rs
SET business_id = b.id
FROM public.prompt_pages pp
JOIN public.businesses b ON b.account_id = pp.account_id
WHERE rs.prompt_page_id = pp.id
  AND rs.business_id IS NULL
  AND pp.account_id IS NOT NULL;

-- Log the results
DO $$
DECLARE
  ready_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO ready_count
  FROM public.review_submissions
  WHERE
    platform = 'Google Business Profile'
    AND business_id IS NOT NULL
    AND auto_verification_status = 'pending'
    AND review_text_copy IS NOT NULL
    AND TRIM(review_text_copy) != '';

  RAISE NOTICE 'Google Business Profile reviews now ready for verification: %', ready_count;
END $$;
