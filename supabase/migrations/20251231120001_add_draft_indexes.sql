-- Add indexes for draft status queries (must be separate migration from enum add)

-- Index for efficient queue queries
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_drafts
  ON google_business_scheduled_posts(account_id, status, queue_order)
  WHERE status = 'draft';

-- Index for source type queries
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_source
  ON google_business_scheduled_posts(source_type)
  WHERE source_type IS NOT NULL;

DO $$
BEGIN
  RAISE NOTICE '✅ Added indexes for draft status queries';
END $$;
