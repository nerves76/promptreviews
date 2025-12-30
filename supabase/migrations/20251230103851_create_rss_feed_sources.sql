-- RSS Feed Sources table
-- Stores user-configured RSS feeds for auto-posting to GBP/Bluesky

CREATE TABLE rss_feed_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

  -- Feed configuration
  feed_url TEXT NOT NULL,
  feed_name TEXT NOT NULL,

  -- Polling settings
  polling_interval_minutes INTEGER NOT NULL DEFAULT 60 CHECK (polling_interval_minutes >= 15),
  last_polled_at TIMESTAMPTZ,
  last_successful_poll_at TIMESTAMPTZ,

  -- Post template settings
  -- Available tokens: {title}, {description}, {link}
  post_template TEXT NOT NULL DEFAULT '{title}

{description}',
  include_link BOOLEAN NOT NULL DEFAULT true,
  max_content_length INTEGER NOT NULL DEFAULT 1500 CHECK (max_content_length >= 100 AND max_content_length <= 4096),

  -- Target locations for GBP (JSON array of location objects)
  -- Format: [{ "id": "location-id", "name": "Location Name" }]
  target_locations JSONB NOT NULL DEFAULT '[]',

  -- Cross-posting settings (matches scheduled posts structure)
  -- Format: { "bluesky": { "enabled": true, "connectionId": "uuid" } }
  additional_platforms JSONB NOT NULL DEFAULT '{}',

  -- Status and error tracking
  is_active BOOLEAN NOT NULL DEFAULT true,
  error_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,

  -- Rate limiting
  posts_today INTEGER NOT NULL DEFAULT 0,
  posts_today_reset_at DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_rss_feed_sources_account ON rss_feed_sources(account_id);
CREATE INDEX idx_rss_feed_sources_active_polling ON rss_feed_sources(is_active, last_polled_at)
  WHERE is_active = true;

-- Updated_at trigger
CREATE TRIGGER update_rss_feed_sources_updated_at
  BEFORE UPDATE ON rss_feed_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE rss_feed_sources ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view feeds for accounts they belong to
CREATE POLICY "Users can view own account feeds"
  ON rss_feed_sources FOR SELECT
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

-- Policy: Users can insert feeds for accounts they belong to
CREATE POLICY "Users can create feeds for own accounts"
  ON rss_feed_sources FOR INSERT
  WITH CHECK (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

-- Policy: Users can update feeds for accounts they belong to
CREATE POLICY "Users can update own account feeds"
  ON rss_feed_sources FOR UPDATE
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

-- Policy: Users can delete feeds for accounts they belong to
CREATE POLICY "Users can delete own account feeds"
  ON rss_feed_sources FOR DELETE
  USING (account_id IN (
    SELECT account_id FROM account_users WHERE user_id = auth.uid()
  ));

-- Comment for documentation
COMMENT ON TABLE rss_feed_sources IS 'RSS feed configurations for auto-posting to GBP and Bluesky';
COMMENT ON COLUMN rss_feed_sources.post_template IS 'Template with tokens: {title}, {description}, {link}';
COMMENT ON COLUMN rss_feed_sources.target_locations IS 'Array of GBP location objects: [{ id, name }]';
COMMENT ON COLUMN rss_feed_sources.additional_platforms IS 'Cross-posting config: { bluesky: { enabled, connectionId } }';
