-- Reset failed Google reviews back to pending so cron can retry with new logic

UPDATE public.review_submissions
SET
  auto_verification_status = 'pending',
  verification_attempts = 0,
  last_verification_attempt_at = NULL
WHERE platform = 'Google Business Profile'
  AND auto_verification_status = 'failed';

DO $$
DECLARE
  pending_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO pending_count
  FROM public.review_submissions
  WHERE platform = 'Google Business Profile'
    AND auto_verification_status = 'pending';

  RAISE NOTICE 'Google reviews currently pending: %', pending_count;
END $$;
