-- Add auto-post settings to RSS feed sources
-- When enabled, new items are automatically scheduled as posts

-- Auto-post enabled toggle (default true for automatic scheduling)
ALTER TABLE rss_feed_sources
  ADD COLUMN IF NOT EXISTS auto_post BOOLEAN NOT NULL DEFAULT true;

-- Days between auto-scheduled posts (default 1 = daily)
ALTER TABLE rss_feed_sources
  ADD COLUMN IF NOT EXISTS auto_post_interval_days INTEGER NOT NULL DEFAULT 1;

-- Add constraint for interval
ALTER TABLE rss_feed_sources
  ADD CONSTRAINT rss_feed_sources_auto_post_interval_check
  CHECK (auto_post_interval_days >= 1 AND auto_post_interval_days <= 30);

DO $$
BEGIN
  RAISE NOTICE '✅ Added auto_post and auto_post_interval_days to rss_feed_sources';
END $$;
