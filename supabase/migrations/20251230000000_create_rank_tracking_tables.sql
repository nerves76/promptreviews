-- ============================================
-- Google SERP Rank Tracking Tables
-- Feature: Track organic search rankings across
-- devices and locations for keyword concepts
-- ============================================

-- ============================================
-- Enable pg_trgm extension for fuzzy location search
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- Table 1: DataForSEO location cache
-- ============================================
CREATE TABLE rank_locations (
  id SERIAL PRIMARY KEY,
  location_code INT NOT NULL UNIQUE,
  location_name TEXT NOT NULL,
  location_type TEXT, -- 'Country', 'State', 'City', 'DMA Region'
  country_iso_code TEXT,
  location_code_parent INT,

  -- Full hierarchy for display
  -- e.g., "Portland, Oregon, United States"
  canonical_name TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast location lookups
CREATE INDEX idx_rank_locations_code ON rank_locations(location_code);
CREATE INDEX idx_rank_locations_name_trgm ON rank_locations USING gin (location_name gin_trgm_ops);
CREATE INDEX idx_rank_locations_canonical_trgm ON rank_locations USING gin (canonical_name gin_trgm_ops);
CREATE INDEX idx_rank_locations_country ON rank_locations(country_iso_code);
CREATE INDEX idx_rank_locations_type ON rank_locations(location_type);

COMMENT ON TABLE rank_locations IS 'Cached DataForSEO location codes for fast lookups';
COMMENT ON COLUMN rank_locations.location_name IS 'Primary location name (e.g., "Portland")';
COMMENT ON COLUMN rank_locations.canonical_name IS 'Full hierarchy (e.g., "Portland, Oregon, United States")';

-- ============================================
-- Table 2: Keyword groups (device + location + schedule)
-- ============================================
CREATE TABLE rank_keyword_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

  -- Group identification
  name TEXT NOT NULL,
  device TEXT NOT NULL CHECK (device IN ('desktop', 'mobile')),
  location_code INT NOT NULL REFERENCES rank_locations(location_code),
  location_name TEXT NOT NULL, -- Denormalized for display

  -- Scheduling (mirrors geo-grid pattern)
  schedule_frequency TEXT CHECK (schedule_frequency IN ('daily', 'weekly', 'monthly')),
  schedule_day_of_week INT CHECK (schedule_day_of_week BETWEEN 0 AND 6),
  schedule_day_of_month INT CHECK (schedule_day_of_month BETWEEN 1 AND 28),
  schedule_hour INT NOT NULL DEFAULT 9 CHECK (schedule_hour BETWEEN 0 AND 23),
  next_scheduled_at TIMESTAMPTZ,
  last_scheduled_run_at TIMESTAMPTZ,

  -- State
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  last_checked_at TIMESTAMPTZ,
  last_credit_warning_sent_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rank_keyword_groups_account ON rank_keyword_groups(account_id);
CREATE INDEX idx_rank_keyword_groups_schedule ON rank_keyword_groups(next_scheduled_at)
  WHERE is_enabled = true AND schedule_frequency IS NOT NULL;
CREATE INDEX idx_rank_keyword_groups_account_enabled ON rank_keyword_groups(account_id, is_enabled);

COMMENT ON TABLE rank_keyword_groups IS 'Keyword groups defined by device + location + schedule';
COMMENT ON COLUMN rank_keyword_groups.location_code IS 'DataForSEO location code';
COMMENT ON COLUMN rank_keyword_groups.schedule_frequency IS 'How often to check: daily, weekly, monthly';

-- ============================================
-- Table 3: Keywords tracked in each group
-- ============================================
CREATE TABLE rank_group_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES rank_keyword_groups(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

  -- Optional: Expected URL for cannibalization detection
  target_url TEXT,

  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One entry per keyword per group
  UNIQUE(group_id, keyword_id)
);

CREATE INDEX idx_rank_group_keywords_group ON rank_group_keywords(group_id);
CREATE INDEX idx_rank_group_keywords_keyword ON rank_group_keywords(keyword_id);
CREATE INDEX idx_rank_group_keywords_account ON rank_group_keywords(account_id);

COMMENT ON TABLE rank_group_keywords IS 'Junction table linking keyword concepts to groups';
COMMENT ON COLUMN rank_group_keywords.target_url IS 'Expected URL to rank (for cannibalization alerts)';

-- ============================================
-- Table 4: Rank check results over time
-- ============================================
CREATE TABLE rank_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES rank_keyword_groups(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,

  -- Query and results
  search_query_used TEXT NOT NULL,
  position INT,                    -- NULL if not in top N
  found_url TEXT,                  -- URL that ranked
  matched_target_url BOOLEAN,      -- Cannibalization flag

  -- SERP features and competitive context
  serp_features JSONB,             -- {featured_snippet: true, map_pack: true, faq: true, ...}
  top_competitors JSONB,           -- [{domain, position, url, title}]

  -- Metadata
  api_cost_usd DECIMAL(10,6),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rank_checks_account ON rank_checks(account_id);
CREATE INDEX idx_rank_checks_group_date ON rank_checks(group_id, checked_at DESC);
CREATE INDEX idx_rank_checks_keyword_date ON rank_checks(keyword_id, checked_at DESC);
CREATE INDEX idx_rank_checks_account_keyword ON rank_checks(account_id, keyword_id, checked_at DESC);
CREATE INDEX idx_rank_checks_checked_at ON rank_checks(checked_at DESC);

COMMENT ON TABLE rank_checks IS 'Individual rank check results over time';
COMMENT ON COLUMN rank_checks.search_query_used IS 'Actual query sent to API (from keywords.search_query or keywords.phrase)';
COMMENT ON COLUMN rank_checks.serp_features IS 'Detected SERP features: featured snippet, map pack, FAQ, images, etc.';
COMMENT ON COLUMN rank_checks.top_competitors IS 'Top 10 competing domains with positions';

-- ============================================
-- Table 5: Daily keyword discovery usage tracking
-- ============================================
CREATE TABLE rank_discovery_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

  usage_date DATE NOT NULL,
  keywords_discovered INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One record per account per day
  UNIQUE(account_id, usage_date)
);

CREATE INDEX idx_rank_discovery_usage_account ON rank_discovery_usage(account_id);
CREATE INDEX idx_rank_discovery_usage_date ON rank_discovery_usage(account_id, usage_date DESC);

COMMENT ON TABLE rank_discovery_usage IS 'Daily limit tracking for keyword discovery feature';
COMMENT ON COLUMN rank_discovery_usage.keywords_discovered IS 'Number of keywords discovered via DataForSEO autocomplete today';

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE rank_keyword_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE rank_group_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE rank_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rank_discovery_usage ENABLE ROW LEVEL SECURITY;

-- rank_locations is public/readonly, no RLS needed

-- ============================================
-- RLS Policies: Users can access their account's data
-- ============================================

-- rank_keyword_groups policies
CREATE POLICY "Users can view own account rank_keyword_groups"
  ON rank_keyword_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = rank_keyword_groups.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own account rank_keyword_groups"
  ON rank_keyword_groups FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = rank_keyword_groups.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own account rank_keyword_groups"
  ON rank_keyword_groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = rank_keyword_groups.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own account rank_keyword_groups"
  ON rank_keyword_groups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = rank_keyword_groups.account_id
        AND au.user_id = auth.uid()
    )
  );

-- rank_group_keywords policies
CREATE POLICY "Users can view own account rank_group_keywords"
  ON rank_group_keywords FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = rank_group_keywords.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own account rank_group_keywords"
  ON rank_group_keywords FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = rank_group_keywords.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own account rank_group_keywords"
  ON rank_group_keywords FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = rank_group_keywords.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own account rank_group_keywords"
  ON rank_group_keywords FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = rank_group_keywords.account_id
        AND au.user_id = auth.uid()
    )
  );

-- rank_checks policies
CREATE POLICY "Users can view own account rank_checks"
  ON rank_checks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = rank_checks.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own account rank_checks"
  ON rank_checks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = rank_checks.account_id
        AND au.user_id = auth.uid()
    )
  );

-- rank_discovery_usage policies
CREATE POLICY "Users can view own account rank_discovery_usage"
  ON rank_discovery_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = rank_discovery_usage.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own account rank_discovery_usage"
  ON rank_discovery_usage FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = rank_discovery_usage.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own account rank_discovery_usage"
  ON rank_discovery_usage FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = rank_discovery_usage.account_id
        AND au.user_id = auth.uid()
    )
  );

-- ============================================
-- Service role bypass for cron jobs and API routes
-- ============================================
CREATE POLICY "Service role full access rank_keyword_groups"
  ON rank_keyword_groups FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access rank_group_keywords"
  ON rank_group_keywords FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access rank_checks"
  ON rank_checks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access rank_discovery_usage"
  ON rank_discovery_usage FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Function to calculate next scheduled run time
-- (Reuse geo-grid pattern)
-- ============================================
CREATE OR REPLACE FUNCTION calculate_rank_next_scheduled_at(
  p_frequency TEXT,
  p_day_of_week INTEGER,
  p_day_of_month INTEGER,
  p_hour INTEGER,
  p_from_time TIMESTAMPTZ DEFAULT NOW()
) RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_next TIMESTAMPTZ;
  v_target_hour INTEGER;
  v_current_dow INTEGER;
  v_current_dom INTEGER;
  v_days_to_add INTEGER;
BEGIN
  v_target_hour := COALESCE(p_hour, 9);

  CASE p_frequency
    WHEN 'daily' THEN
      -- Next occurrence at target hour
      v_next := DATE_TRUNC('day', p_from_time) + (v_target_hour || ' hours')::INTERVAL;
      IF v_next <= p_from_time THEN
        v_next := v_next + INTERVAL '1 day';
      END IF;

    WHEN 'weekly' THEN
      -- Next occurrence on target day of week at target hour
      v_current_dow := EXTRACT(DOW FROM p_from_time)::INTEGER;
      v_days_to_add := (COALESCE(p_day_of_week, 1) - v_current_dow + 7) % 7;
      v_next := DATE_TRUNC('day', p_from_time) + (v_days_to_add || ' days')::INTERVAL + (v_target_hour || ' hours')::INTERVAL;
      IF v_next <= p_from_time THEN
        v_next := v_next + INTERVAL '7 days';
      END IF;

    WHEN 'monthly' THEN
      -- Next occurrence on target day of month at target hour
      v_current_dom := EXTRACT(DAY FROM p_from_time)::INTEGER;
      v_next := DATE_TRUNC('month', p_from_time) + ((COALESCE(p_day_of_month, 1) - 1) || ' days')::INTERVAL + (v_target_hour || ' hours')::INTERVAL;
      IF v_next <= p_from_time THEN
        v_next := v_next + INTERVAL '1 month';
      END IF;

    ELSE
      v_next := NULL;
  END CASE;

  RETURN v_next;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Trigger to auto-update next_scheduled_at when schedule changes
-- ============================================
CREATE OR REPLACE FUNCTION update_rank_next_scheduled_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.schedule_frequency IS NOT NULL AND NEW.is_enabled = true THEN
    NEW.next_scheduled_at := calculate_rank_next_scheduled_at(
      NEW.schedule_frequency,
      NEW.schedule_day_of_week,
      NEW.schedule_day_of_month,
      NEW.schedule_hour,
      COALESCE(NEW.last_scheduled_run_at, NOW())
    );
  ELSE
    NEW.next_scheduled_at := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_rank_next_scheduled_at ON rank_keyword_groups;
CREATE TRIGGER trg_update_rank_next_scheduled_at
  BEFORE INSERT OR UPDATE OF schedule_frequency, schedule_day_of_week, schedule_day_of_month, schedule_hour, is_enabled, last_scheduled_run_at
  ON rank_keyword_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_rank_next_scheduled_at();

-- ============================================
-- Seed common US locations (subset for initial launch)
-- Full seed will be done via script
-- ============================================
INSERT INTO rank_locations (location_code, location_name, location_type, country_iso_code, canonical_name) VALUES
  (2840, 'United States', 'Country', 'US', 'United States'),
  (1022858, 'Portland', 'City', 'US', 'Portland, Oregon, United States'),
  (1014221, 'Los Angeles', 'City', 'US', 'Los Angeles, California, United States'),
  (1014895, 'Chicago', 'City', 'US', 'Chicago, Illinois, United States'),
  (1023191, 'New York', 'City', 'US', 'New York, New York, United States'),
  (1026339, 'Austin', 'City', 'US', 'Austin, Texas, United States'),
  (1027744, 'Seattle', 'City', 'US', 'Seattle, Washington, United States'),
  (21167, 'Oregon', 'State', 'US', 'Oregon, United States'),
  (21136, 'California', 'State', 'US', 'California, United States'),
  (21132, 'Illinois', 'State', 'US', 'Illinois, United States'),
  (21148, 'New York', 'State', 'US', 'New York, United States'),
  (21176, 'Texas', 'State', 'US', 'Texas, United States'),
  (21182, 'Washington', 'State', 'US', 'Washington, United States')
ON CONFLICT (location_code) DO NOTHING;
