-- Add per-platform and workflow fields to contacts
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS google_url TEXT,
  ADD COLUMN IF NOT EXISTS yelp_url TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT,
  ADD COLUMN IF NOT EXISTS google_review TEXT,
  ADD COLUMN IF NOT EXISTS yelp_review TEXT,
  ADD COLUMN IF NOT EXISTS facebook_review TEXT,
  ADD COLUMN IF NOT EXISTS google_instructions TEXT,
  ADD COLUMN IF NOT EXISTS yelp_instructions TEXT,
  ADD COLUMN IF NOT EXISTS facebook_instructions TEXT,
  ADD COLUMN IF NOT EXISTS review_rewards TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- Add comment for status
COMMENT ON COLUMN public.contacts.status IS 'Workflow status for the contact (draft, in_queue, sent, completed)'; 