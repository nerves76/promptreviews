-- Re-run Google review auto-verification prep on production project
-- Ensures review_text_copy, business_id, and status fields are ready for cron job

-- 1. Copy review_content into review_text_copy (idempotent)
UPDATE public.review_submissions
SET review_text_copy = review_content
WHERE platform = 'Google Business Profile'
  AND (review_text_copy IS NULL OR TRIM(review_text_copy) = '');

-- 2. Backfill business_id using prompt_pages.account_id (matches track-review insert logic)
UPDATE public.review_submissions rs
SET business_id = pp.account_id
FROM public.prompt_pages pp
WHERE rs.prompt_page_id = pp.id
  AND rs.business_id IS NULL
  AND pp.account_id IS NOT NULL;

-- 3. Reset failed reviews back to pending so cron can process them
UPDATE public.review_submissions
SET
  auto_verification_status = 'pending',
  verification_attempts = 0,
  last_verification_attempt_at = NULL
WHERE platform = 'Google Business Profile'
  AND auto_verification_status IN ('failed', 'not_found')
  AND business_id IS NOT NULL
  AND review_text_copy IS NOT NULL
  AND TRIM(review_text_copy) != '';

-- 4. Log current readiness
DO $$
DECLARE
  ready_count INTEGER;
  pending_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO ready_count
  FROM public.review_submissions
  WHERE platform = 'Google Business Profile'
    AND business_id IS NOT NULL
    AND review_text_copy IS NOT NULL
    AND TRIM(review_text_copy) != '';

  SELECT COUNT(*) INTO pending_count
  FROM public.review_submissions
  WHERE platform = 'Google Business Profile'
    AND auto_verification_status = 'pending';

  RAISE NOTICE 'Google reviews with business_id + text: %', ready_count;
  RAISE NOTICE 'Google reviews marked pending: %', pending_count;
END $$;
