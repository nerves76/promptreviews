-- Migration: Add Review Attribution Tracking Fields
-- Purpose: Enable tracking where reviews come from (email campaigns, widgets, QR codes, etc.)
-- This allows users to understand which channels drive the most reviews.

-- Step 1: Create the source channel enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_source_channel') THEN
    CREATE TYPE review_source_channel AS ENUM (
      'prompt_page_direct',    -- Direct link, bookmark, or typed URL
      'prompt_page_qr',        -- QR code scan
      'email_campaign',        -- Email review request link
      'sms_campaign',          -- SMS review request link
      'widget_cta',            -- Click from embedded widget CTA
      'gbp_import',            -- Google Business Profile import
      'social_share',          -- Shared link on social media
      'referral',              -- Referred by another customer
      'unknown'                -- Source not determined
    );
  END IF;
END$$;

-- Step 2: Add attribution fields to review_submissions table
ALTER TABLE review_submissions
  ADD COLUMN IF NOT EXISTS source_channel review_source_channel DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS source_id UUID,
  ADD COLUMN IF NOT EXISTS communication_record_id UUID,
  ADD COLUMN IF NOT EXISTS widget_id UUID,
  ADD COLUMN IF NOT EXISTS referrer_url TEXT,
  ADD COLUMN IF NOT EXISTS utm_params JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS entry_url TEXT,
  ADD COLUMN IF NOT EXISTS location_name TEXT;

-- Step 3: Add foreign key constraints
DO $$
BEGIN
  -- FK to communication_records (for email/SMS campaign attribution)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_review_submissions_communication_record'
  ) THEN
    ALTER TABLE review_submissions
      ADD CONSTRAINT fk_review_submissions_communication_record
      FOREIGN KEY (communication_record_id)
      REFERENCES communication_records(id)
      ON DELETE SET NULL;
  END IF;

  -- FK to widgets (for widget CTA attribution)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_review_submissions_widget'
  ) THEN
    ALTER TABLE review_submissions
      ADD CONSTRAINT fk_review_submissions_widget
      FOREIGN KEY (widget_id)
      REFERENCES widgets(id)
      ON DELETE SET NULL;
  END IF;
END$$;

-- Step 4: Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_review_submissions_source_channel
  ON review_submissions(source_channel);

CREATE INDEX IF NOT EXISTS idx_review_submissions_communication_record_id
  ON review_submissions(communication_record_id);

CREATE INDEX IF NOT EXISTS idx_review_submissions_widget_id
  ON review_submissions(widget_id);

CREATE INDEX IF NOT EXISTS idx_review_submissions_utm_params
  ON review_submissions USING gin(utm_params);

-- Step 5: Create composite index for common analytics queries
CREATE INDEX IF NOT EXISTS idx_review_submissions_account_source_created
  ON review_submissions(account_id, source_channel, created_at DESC);

-- Step 6: Add comment documentation
COMMENT ON COLUMN review_submissions.source_channel IS 'The channel through which the reviewer arrived (email, widget, QR, etc.)';
COMMENT ON COLUMN review_submissions.source_id IS 'Generic source identifier (deprecated, use specific *_id fields)';
COMMENT ON COLUMN review_submissions.communication_record_id IS 'Links to the email/SMS campaign that generated this review';
COMMENT ON COLUMN review_submissions.widget_id IS 'Links to the widget CTA that generated this review';
COMMENT ON COLUMN review_submissions.referrer_url IS 'HTTP referrer URL when the reviewer arrived at the prompt page';
COMMENT ON COLUMN review_submissions.utm_params IS 'UTM tracking parameters captured from the entry URL';
COMMENT ON COLUMN review_submissions.entry_url IS 'Full URL the reviewer used to access the prompt page';

-- Step 7: Backfill existing GBP imports
UPDATE review_submissions
SET source_channel = 'gbp_import'
WHERE imported_from_google = true
  AND source_channel = 'unknown';
