-- RSS Feed Items table
-- Tracks processed RSS items to prevent duplicates and show history

CREATE TABLE rss_feed_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_source_id UUID NOT NULL REFERENCES rss_feed_sources(id) ON DELETE CASCADE,

  -- Item identifiers (for deduplication)
  item_guid TEXT NOT NULL,
  item_url TEXT,

  -- Content (cached for debugging/display)
  title TEXT,
  description TEXT,
  image_url TEXT,
  published_at TIMESTAMPTZ,

  -- Processing status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'skipped', 'failed')),
  scheduled_post_id UUID REFERENCES google_business_scheduled_posts(id) ON DELETE SET NULL,
  skip_reason TEXT,
  error_message TEXT,

  -- Timestamps
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Unique constraint to prevent duplicate processing of same item
CREATE UNIQUE INDEX idx_rss_feed_items_unique ON rss_feed_items(feed_source_id, item_guid);

-- Index for finding pending items efficiently
CREATE INDEX idx_rss_feed_items_pending ON rss_feed_items(feed_source_id, status)
  WHERE status = 'pending';

-- Index for querying items by scheduled post
CREATE INDEX idx_rss_feed_items_scheduled_post ON rss_feed_items(scheduled_post_id)
  WHERE scheduled_post_id IS NOT NULL;

-- Index for recent items display
CREATE INDEX idx_rss_feed_items_discovered ON rss_feed_items(feed_source_id, discovered_at DESC);

-- RLS
ALTER TABLE rss_feed_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view items from feeds they have access to
CREATE POLICY "Users can view items from own feeds"
  ON rss_feed_items FOR SELECT
  USING (feed_source_id IN (
    SELECT id FROM rss_feed_sources WHERE account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  ));

-- Policy: Service role can insert items (cron job uses service role)
-- Regular users don't insert items directly - the cron job does

-- Comment for documentation
COMMENT ON TABLE rss_feed_items IS 'Tracks RSS items discovered and processed for auto-posting';
COMMENT ON COLUMN rss_feed_items.item_guid IS 'Unique identifier from RSS feed (guid or link)';
COMMENT ON COLUMN rss_feed_items.status IS 'pending=new, scheduled=post created, skipped=filtered out, failed=error';
COMMENT ON COLUMN rss_feed_items.skip_reason IS 'Why item was skipped: insufficient_credits, daily_limit, duplicate, etc.';
