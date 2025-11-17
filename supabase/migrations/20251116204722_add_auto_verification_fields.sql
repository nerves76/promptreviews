-- Add auto-verification fields to review_submissions table
-- These fields enable automated verification via Google Business Profile API

ALTER TABLE public.review_submissions
  ADD COLUMN IF NOT EXISTS auto_verification_status text DEFAULT 'pending' CHECK (auto_verification_status IN ('pending', 'verified', 'not_found', 'failed')),
  ADD COLUMN IF NOT EXISTS auto_verified_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS verification_attempts integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_verification_attempt_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS google_review_id text,
  ADD COLUMN IF NOT EXISTS review_text_copy text,
  ADD COLUMN IF NOT EXISTS verification_match_score decimal(3,2);

-- Create indexes for auto-verification queries
CREATE INDEX IF NOT EXISTS idx_review_submissions_auto_verification_status
  ON public.review_submissions(auto_verification_status);

CREATE INDEX IF NOT EXISTS idx_review_submissions_last_verification_attempt
  ON public.review_submissions(last_verification_attempt_at);

CREATE INDEX IF NOT EXISTS idx_review_submissions_google_review_id
  ON public.review_submissions(google_review_id);

-- Add comments for documentation
COMMENT ON COLUMN public.review_submissions.auto_verification_status IS 'Automated verification status: pending, verified, not_found, failed';
COMMENT ON COLUMN public.review_submissions.auto_verified_at IS 'Timestamp when review was automatically verified via API';
COMMENT ON COLUMN public.review_submissions.verification_attempts IS 'Number of times auto-verification has been attempted';
COMMENT ON COLUMN public.review_submissions.last_verification_attempt_at IS 'Last time auto-verification was attempted';
COMMENT ON COLUMN public.review_submissions.google_review_id IS 'Google Review ID from GBP API if matched';
COMMENT ON COLUMN public.review_submissions.review_text_copy IS 'Copy of review text that was submitted for matching';
COMMENT ON COLUMN public.review_submissions.verification_match_score IS 'Confidence score (0-1) of the automated match';
