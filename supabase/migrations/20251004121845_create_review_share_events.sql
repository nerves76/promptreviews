-- Create review_share_events table for tracking social sharing
-- This table tracks when users share reviews on various platforms

-- First, create the enum type for platforms
DO $$ BEGIN
  CREATE TYPE share_platform AS ENUM (
    'facebook',
    'linkedin',
    'twitter',
    'bluesky',
    'reddit',
    'pinterest',
    'email',
    'text',
    'copy_link'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create the table
CREATE TABLE IF NOT EXISTS public.review_share_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  platform share_platform NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL

  -- Foreign key to review_submissions (most common case)
  -- Note: review_id can reference either review_submissions or widget_reviews
  -- We don't enforce FK here to allow flexibility, but validation in API
  -- account_id FK is defined inline above for CASCADE delete
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_review_share_events_review_id
  ON public.review_share_events(review_id);

CREATE INDEX IF NOT EXISTS idx_review_share_events_account_id
  ON public.review_share_events(account_id);

CREATE INDEX IF NOT EXISTS idx_review_share_events_user_id
  ON public.review_share_events(user_id);

CREATE INDEX IF NOT EXISTS idx_review_share_events_platform
  ON public.review_share_events(platform);

CREATE INDEX IF NOT EXISTS idx_review_share_events_timestamp
  ON public.review_share_events(timestamp DESC);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_review_share_events_account_platform
  ON public.review_share_events(account_id, platform);

CREATE INDEX IF NOT EXISTS idx_review_share_events_review_platform
  ON public.review_share_events(review_id, platform);

-- Enable Row Level Security
ALTER TABLE public.review_share_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view share events for their own accounts
-- This ensures account isolation as per CLAUDE.md security requirements
CREATE POLICY "Users can view share events for their accounts"
  ON public.review_share_events
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM public.account_users
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can create share events for reviews in their accounts
CREATE POLICY "Users can create share events for their accounts"
  ON public.review_share_events
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.account_users
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can delete share events for reviews in their accounts
CREATE POLICY "Users can delete share events for their accounts"
  ON public.review_share_events
  FOR DELETE USING (
    account_id IN (
      SELECT account_id FROM public.account_users
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can update share events for reviews in their accounts
-- (In case we want to add fields like notes or metadata later)
CREATE POLICY "Users can update share events for their accounts"
  ON public.review_share_events
  FOR UPDATE USING (
    account_id IN (
      SELECT account_id FROM public.account_users
      WHERE user_id = auth.uid()
    )
  );

-- Add comment for documentation
COMMENT ON TABLE public.review_share_events IS
  'Tracks social sharing events for reviews. Each row represents a single share action. Account isolation enforced via RLS policies.';

COMMENT ON COLUMN public.review_share_events.review_id IS
  'UUID of the review (from review_submissions or widget_reviews). Validation enforced in API layer.';

COMMENT ON COLUMN public.review_share_events.account_id IS
  'Account ID for isolation. CRITICAL for security - ensures users only see their own data.';

COMMENT ON COLUMN public.review_share_events.platform IS
  'Social platform where review was shared. Uses share_platform enum.';

COMMENT ON COLUMN public.review_share_events.timestamp IS
  'When the share occurred. Used for analytics and sorting.';
