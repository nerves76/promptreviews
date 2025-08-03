-- Add review verification and tracking fields to contacts table
-- This enables automatic contact creation from reviews and manual verification

ALTER TABLE public.contacts 
  ADD COLUMN IF NOT EXISTS review_submission_id uuid REFERENCES public.review_submissions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_verification_status text DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS google_review_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS yelp_review_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS facebook_review_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS tripadvisor_review_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS potential_review_matches jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS manual_verification_notes text,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS last_review_check_at timestamptz;

-- Add constraints for review_verification_status
ALTER TABLE public.contacts 
  ADD CONSTRAINT contacts_review_verification_status_check 
  CHECK (review_verification_status IN ('unknown', 'verified', 'potential_match', 'no_review', 'pending_verification'));

-- Add constraints for source
ALTER TABLE public.contacts 
  ADD CONSTRAINT contacts_source_check 
  CHECK (source IN ('manual', 'review_submission', 'google_reviews_api', 'import'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_review_verification_status ON public.contacts(review_verification_status);
CREATE INDEX IF NOT EXISTS idx_contacts_review_submission_id ON public.contacts(review_submission_id);
CREATE INDEX IF NOT EXISTS idx_contacts_source ON public.contacts(source);
CREATE INDEX IF NOT EXISTS idx_contacts_google_review_verified_at ON public.contacts(google_review_verified_at);
CREATE INDEX IF NOT EXISTS idx_contacts_yelp_review_verified_at ON public.contacts(yelp_review_verified_at);
CREATE INDEX IF NOT EXISTS idx_contacts_facebook_review_verified_at ON public.contacts(facebook_review_verified_at);

-- Add comments
COMMENT ON COLUMN public.contacts.review_submission_id IS 'Links to the review submission that created this contact (if auto-generated)';
COMMENT ON COLUMN public.contacts.review_verification_status IS 'Status of review verification: unknown, verified, potential_match, no_review, pending_verification';
COMMENT ON COLUMN public.contacts.google_review_verified_at IS 'When Google review was verified for this contact';
COMMENT ON COLUMN public.contacts.yelp_review_verified_at IS 'When Yelp review was verified for this contact';
COMMENT ON COLUMN public.contacts.facebook_review_verified_at IS 'When Facebook review was verified for this contact';
COMMENT ON COLUMN public.contacts.tripadvisor_review_verified_at IS 'When TripAdvisor review was verified for this contact';
COMMENT ON COLUMN public.contacts.potential_review_matches IS 'JSON array of potential review matches found through API or manual search';
COMMENT ON COLUMN public.contacts.manual_verification_notes IS 'Notes from manual review verification process';
COMMENT ON COLUMN public.contacts.source IS 'How this contact was created: manual, review_submission, google_reviews_api, import';
COMMENT ON COLUMN public.contacts.last_review_check_at IS 'When we last checked for reviews from this contact';