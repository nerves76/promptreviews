-- Debug: Check what's actually in review_content for Google Business Profile reviews

DO $$
DECLARE
  total_gbp INTEGER;
  with_review_content INTEGER;
  with_empty_review_content INTEGER;
  with_null_review_content INTEGER;
  sample_id TEXT;
  sample_content TEXT;
BEGIN
  -- Count total Google Business Profile reviews
  SELECT COUNT(*) INTO total_gbp
  FROM public.review_submissions
  WHERE platform = 'Google Business Profile';

  -- Count with non-null review_content
  SELECT COUNT(*) INTO with_review_content
  FROM public.review_submissions
  WHERE platform = 'Google Business Profile'
  AND review_content IS NOT NULL;

  -- Count with empty string review_content
  SELECT COUNT(*) INTO with_empty_review_content
  FROM public.review_submissions
  WHERE platform = 'Google Business Profile'
  AND review_content = '';

  -- Count with NULL review_content
  SELECT COUNT(*) INTO with_null_review_content
  FROM public.review_submissions
  WHERE platform = 'Google Business Profile'
  AND review_content IS NULL;

  -- Get a sample
  SELECT id, review_content INTO sample_id, sample_content
  FROM public.review_submissions
  WHERE platform = 'Google Business Profile'
  LIMIT 1;

  RAISE NOTICE 'Total Google Business Profile reviews: %', total_gbp;
  RAISE NOTICE 'With review_content NOT NULL: %', with_review_content;
  RAISE NOTICE 'With review_content empty string: %', with_empty_review_content;
  RAISE NOTICE 'With review_content NULL: %', with_null_review_content;
  RAISE NOTICE 'Sample ID: %', sample_id;
  RAISE NOTICE 'Sample content (first 100 chars): %', SUBSTRING(sample_content, 1, 100);
END $$;
