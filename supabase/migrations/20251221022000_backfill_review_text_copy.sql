-- Backfill review_text_copy from review_content for existing Google Business Profile reviews
-- This enables the auto-verification cron job to match submitted reviews against Google reviews
--
-- The cron job (verify-google-reviews) uses review_text_copy for fuzzy matching.
-- Reviews submitted via review-submissions API were only setting review_content,
-- not review_text_copy, causing auto-verification to fail.

-- Update all Google Business Profile reviews where review_text_copy is null but review_content exists
UPDATE public.review_submissions
SET review_text_copy = review_content
WHERE platform = 'Google Business Profile'
  AND review_text_copy IS NULL
  AND review_content IS NOT NULL;

-- Also reset verification_attempts to 0 and status to 'pending' for these reviews
-- so they get picked up by the next cron run
UPDATE public.review_submissions
SET
  auto_verification_status = 'pending',
  verification_attempts = 0
WHERE platform = 'Google Business Profile'
  AND auto_verification_status IN ('failed', 'not_found')
  AND review_text_copy IS NOT NULL;
