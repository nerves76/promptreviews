-- ============================================
-- Geo Grid Rank Tracker Tables
-- Feature: Track Google Maps/Local Pack visibility
-- across geographic points around a business
-- ============================================

-- ============================================
-- Table 1: Configuration per account
-- ============================================
CREATE TABLE gg_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  google_business_location_id UUID REFERENCES google_business_locations(id),

  -- Center point (from GBP location or manual entry)
  center_lat DECIMAL(10,7) NOT NULL,
  center_lng DECIMAL(10,7) NOT NULL,
  radius_miles DECIMAL(5,2) DEFAULT 3.0,

  -- Which points to check (default 5: center + cardinal directions)
  check_points JSONB DEFAULT '["center","n","s","e","w"]'::jsonb,

  -- The business Place ID we're looking for in results
  target_place_id TEXT,

  -- State
  is_enabled BOOLEAN DEFAULT true,
  last_checked_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- One config per account
  UNIQUE(account_id)
);

-- ============================================
-- Table 2: Which keywords to track per config
-- ============================================
CREATE TABLE gg_tracked_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES gg_configs(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- One entry per keyword per config
  UNIQUE(config_id, keyword_id)
);

-- ============================================
-- Table 3: Individual rank check results
-- ============================================
CREATE TABLE gg_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  config_id UUID NOT NULL REFERENCES gg_configs(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,

  -- Location checked
  check_point TEXT NOT NULL, -- 'center', 'n', 's', 'e', 'w'
  point_lat DECIMAL(10,7) NOT NULL,
  point_lng DECIMAL(10,7) NOT NULL,

  -- Results
  position INT, -- null if not found in top 20
  position_bucket TEXT CHECK (position_bucket IN ('top3', 'top10', 'top20', 'none')),
  business_found BOOLEAN DEFAULT false,

  -- Competitor context (top 3 businesses)
  top_competitors JSONB, -- [{name, rating, review_count, position, place_id}]

  -- Our listing's stats at time of check (if found)
  our_rating DECIMAL(2,1),
  our_review_count INT,
  our_place_id TEXT,

  -- Metadata
  checked_at TIMESTAMPTZ DEFAULT now(),
  api_cost_usd DECIMAL(10,6),
  raw_response JSONB, -- full API response for debugging (30-day retention)

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Table 4: Daily aggregates for trends
-- ============================================
CREATE TABLE gg_daily_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  config_id UUID NOT NULL REFERENCES gg_configs(id) ON DELETE CASCADE,
  check_date DATE NOT NULL,

  -- Bundle-level stats (across all points)
  total_keywords_checked INT,
  keywords_in_top3 INT,
  keywords_in_top10 INT,
  keywords_in_top20 INT,
  keywords_not_found INT,

  -- Per-point breakdown
  -- {"center": {"top3": 5, "top10": 8, "top20": 10, "none": 2}, "n": {...}, ...}
  point_summaries JSONB,

  -- Cost tracking
  total_api_cost_usd DECIMAL(10,6),

  created_at TIMESTAMPTZ DEFAULT now(),

  -- One summary per account per day
  UNIQUE(account_id, check_date)
);

-- ============================================
-- Indexes for common queries
-- ============================================
CREATE INDEX idx_gg_configs_account ON gg_configs(account_id);
CREATE INDEX idx_gg_tracked_keywords_config ON gg_tracked_keywords(config_id);
CREATE INDEX idx_gg_tracked_keywords_account ON gg_tracked_keywords(account_id);
CREATE INDEX idx_gg_tracked_keywords_keyword ON gg_tracked_keywords(keyword_id);
CREATE INDEX idx_gg_checks_account_date ON gg_checks(account_id, checked_at DESC);
CREATE INDEX idx_gg_checks_keyword ON gg_checks(keyword_id, checked_at DESC);
CREATE INDEX idx_gg_checks_config_date ON gg_checks(config_id, checked_at DESC);
CREATE INDEX idx_gg_checks_point ON gg_checks(config_id, check_point, checked_at DESC);
CREATE INDEX idx_gg_daily_summary_account ON gg_daily_summary(account_id, check_date DESC);
CREATE INDEX idx_gg_daily_summary_config ON gg_daily_summary(config_id, check_date DESC);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE gg_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gg_tracked_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE gg_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE gg_daily_summary ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies: Users can access their account's data
-- ============================================

-- gg_configs policies
CREATE POLICY "Users can view own account gg_configs"
  ON gg_configs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = gg_configs.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own account gg_configs"
  ON gg_configs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = gg_configs.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own account gg_configs"
  ON gg_configs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = gg_configs.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own account gg_configs"
  ON gg_configs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = gg_configs.account_id
        AND au.user_id = auth.uid()
    )
  );

-- gg_tracked_keywords policies
CREATE POLICY "Users can view own account gg_tracked_keywords"
  ON gg_tracked_keywords FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = gg_tracked_keywords.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own account gg_tracked_keywords"
  ON gg_tracked_keywords FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = gg_tracked_keywords.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own account gg_tracked_keywords"
  ON gg_tracked_keywords FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = gg_tracked_keywords.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own account gg_tracked_keywords"
  ON gg_tracked_keywords FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = gg_tracked_keywords.account_id
        AND au.user_id = auth.uid()
    )
  );

-- gg_checks policies
CREATE POLICY "Users can view own account gg_checks"
  ON gg_checks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = gg_checks.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own account gg_checks"
  ON gg_checks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = gg_checks.account_id
        AND au.user_id = auth.uid()
    )
  );

-- gg_daily_summary policies
CREATE POLICY "Users can view own account gg_daily_summary"
  ON gg_daily_summary FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = gg_daily_summary.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own account gg_daily_summary"
  ON gg_daily_summary FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = gg_daily_summary.account_id
        AND au.user_id = auth.uid()
    )
  );

-- ============================================
-- Service role bypass for cron jobs and API routes
-- ============================================
CREATE POLICY "Service role full access gg_configs"
  ON gg_configs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access gg_tracked_keywords"
  ON gg_tracked_keywords FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access gg_checks"
  ON gg_checks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access gg_daily_summary"
  ON gg_daily_summary FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE gg_configs IS 'Geo Grid rank tracking configuration per account';
COMMENT ON TABLE gg_tracked_keywords IS 'Keywords selected for geo grid tracking';
COMMENT ON TABLE gg_checks IS 'Individual rank check results per keyword per point';
COMMENT ON TABLE gg_daily_summary IS 'Daily aggregated visibility summaries for trends';

COMMENT ON COLUMN gg_configs.check_points IS 'JSON array of points to check: center, n, s, e, w';
COMMENT ON COLUMN gg_configs.target_place_id IS 'Google Place ID of the business we are tracking';
COMMENT ON COLUMN gg_checks.position_bucket IS 'Visibility tier: top3, top10, top20, or none';
COMMENT ON COLUMN gg_checks.raw_response IS 'Full DataForSEO response, nulled after 30 days';
COMMENT ON COLUMN gg_daily_summary.point_summaries IS 'Per-point breakdown: {point: {top3: n, top10: n, ...}}';
