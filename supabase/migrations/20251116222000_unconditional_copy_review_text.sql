-- Unconditionally copy review_content to review_text_copy for Google Business Profile reviews
-- No WHERE conditions except platform match

UPDATE public.review_submissions
SET review_text_copy = review_content
WHERE platform = 'Google Business Profile';

-- Verify the results
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
