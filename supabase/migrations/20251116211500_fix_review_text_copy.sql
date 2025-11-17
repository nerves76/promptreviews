-- Fix review_text_copy for existing Google Business Profile reviews
-- The backfill migration didn't work because auto_verification_status wasn't NULL

UPDATE public.review_submissions
SET
  review_text_copy = review_content,
  verification_attempts = 0
WHERE
  platform = 'Google Business Profile'
  AND verified = false
  AND business_id IS NOT NULL
  AND review_content IS NOT NULL
  AND review_text_copy IS NULL;

-- Log how many rows were updated
DO $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count
  FROM public.review_submissions
  WHERE
    platform = 'Google Business Profile'
    AND verified = false
    AND business_id IS NOT NULL
    AND auto_verification_status = 'pending';

  RAISE NOTICE 'Found % Google Business Profile reviews ready for verification', row_count;
END $$;
