-- Force copy review_content to review_text_copy for all Google Business Profile reviews
-- This should populate the field regardless of current state

UPDATE public.review_submissions
SET review_text_copy = review_content
WHERE
  platform = 'Google Business Profile'
  AND review_content IS NOT NULL
  AND review_content != '';

-- Log the results
DO $$
DECLARE
  updated_count INTEGER;
  ready_count INTEGER;
BEGIN
  -- Count how many were just updated
  GET DIAGNOSTICS updated_count = ROW_COUNT;

  -- Count how many are now ready
  SELECT COUNT(*) INTO ready_count
  FROM public.review_submissions
  WHERE
    platform = 'Google Business Profile'
    AND business_id IS NOT NULL
    AND auto_verification_status = 'pending'
    AND review_text_copy IS NOT NULL
    AND review_text_copy != '';

  RAISE NOTICE 'Updated % reviews with review_text_copy', updated_count;
  RAISE NOTICE 'Found % Google Business Profile reviews ready for verification', ready_count;
END $$;
