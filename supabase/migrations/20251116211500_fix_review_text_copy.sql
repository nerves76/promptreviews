-- Fix review_text_copy for existing Google Business Profile reviews
-- Ensure all reviews have review_text_copy populated from review_content

UPDATE public.review_submissions
SET
  review_text_copy = review_content,
  verification_attempts = 0
WHERE
  platform = 'Google Business Profile'
  AND business_id IS NOT NULL
  AND review_content IS NOT NULL
  AND (review_text_copy IS NULL OR review_text_copy = '');

-- Log how many rows are ready for verification
DO $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count
  FROM public.review_submissions
  WHERE
    platform = 'Google Business Profile'
    AND business_id IS NOT NULL
    AND auto_verification_status = 'pending'
    AND review_text_copy IS NOT NULL;

  RAISE NOTICE 'Found % Google Business Profile reviews ready for verification', row_count;
END $$;
