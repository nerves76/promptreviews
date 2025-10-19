-- ============================================
-- Analytics System - Platform Metrics & Daily Stats
-- ============================================
-- Creates comprehensive analytics tracking for:
-- - Global lifetime counters (never decrease)
-- - Daily snapshots for trends
-- - Google Business Profile usage
-- - User engagement and retention
-- ============================================

-- ============================================
-- Table: platform_metrics
-- Global lifetime counters that only increase
-- ============================================
CREATE TABLE IF NOT EXISTS platform_metrics (
  metric_name TEXT PRIMARY KEY,
  metric_value BIGINT NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (admins only)
ALTER TABLE platform_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view platform metrics"
  ON platform_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.account_id = auth.uid()
    )
  );

CREATE POLICY "Only system can update platform metrics"
  ON platform_metrics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Table: daily_stats
-- Daily snapshots for historical analysis
-- ============================================
CREATE TABLE IF NOT EXISTS daily_stats (
  date DATE PRIMARY KEY,

  -- Account metrics
  accounts_created_today INT DEFAULT 0,
  accounts_deleted_today INT DEFAULT 0,
  accounts_total INT DEFAULT 0,
  accounts_active INT DEFAULT 0,
  accounts_trial INT DEFAULT 0,
  accounts_paid INT DEFAULT 0,

  -- Review metrics
  reviews_captured_today INT DEFAULT 0,
  reviews_deleted_today INT DEFAULT 0,
  reviews_total INT DEFAULT 0,
  reviews_active INT DEFAULT 0,

  -- Engagement metrics
  active_users_today INT DEFAULT 0,
  active_users_7day INT DEFAULT 0,
  active_users_30day INT DEFAULT 0,

  -- Feature usage
  widgets_created_today INT DEFAULT 0,
  widgets_total INT DEFAULT 0,
  prompt_pages_created_today INT DEFAULT 0,
  prompt_pages_total INT DEFAULT 0,
  ai_generations_today INT DEFAULT 0,

  -- Google Business Profile metrics
  gbp_locations_connected INT DEFAULT 0,
  gbp_posts_published_today INT DEFAULT 0,
  gbp_posts_total INT DEFAULT 0,
  gbp_reviews_responded_today INT DEFAULT 0,
  gbp_photos_uploaded_today INT DEFAULT 0,

  -- Revenue metrics
  mrr DECIMAL(12,2) DEFAULT 0,
  paying_accounts INT DEFAULT 0,

  -- Platform breakdown (JSONB)
  reviews_by_platform JSONB DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (admins only)
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view daily stats"
  ON daily_stats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.account_id = auth.uid()
    )
  );

CREATE POLICY "Only system can update daily stats"
  ON daily_stats FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_platform_metrics_name ON platform_metrics(metric_name);

-- ============================================
-- Initialize platform_metrics with base counters
-- ============================================
INSERT INTO platform_metrics (metric_name, metric_value, metadata) VALUES
  ('total_accounts_created', 0, '{"description": "Lifetime account signups"}'),
  ('total_accounts_deleted', 0, '{"description": "Accounts permanently deleted"}'),
  ('total_reviews_captured', 0, '{"description": "All reviews ever submitted"}'),
  ('total_reviews_deleted', 0, '{"description": "Reviews removed by users"}'),
  ('total_widgets_created', 0, '{"description": "Widgets created"}'),
  ('total_prompt_pages_created', 0, '{"description": "Prompt pages created"}'),
  ('total_gbp_posts_published', 0, '{"description": "Posts published to Google Business"}'),
  ('total_gbp_locations_connected', 0, '{"description": "Google Business locations ever connected"}'),
  ('total_ai_generations', 0, '{"description": "AI generations used"}')
ON CONFLICT (metric_name) DO NOTHING;

-- ============================================
-- Function: increment_metric
-- Safely increment a platform metric
-- ============================================
CREATE OR REPLACE FUNCTION increment_metric(
  p_metric_name TEXT,
  p_increment BIGINT DEFAULT 1
) RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_value BIGINT;
BEGIN
  INSERT INTO platform_metrics (metric_name, metric_value, updated_at)
  VALUES (p_metric_name, p_increment, NOW())
  ON CONFLICT (metric_name)
  DO UPDATE SET
    metric_value = platform_metrics.metric_value + p_increment,
    updated_at = NOW()
  RETURNING metric_value INTO v_new_value;

  RETURN v_new_value;
END;
$$;

-- ============================================
-- Function: get_metric
-- Get current value of a metric
-- ============================================
CREATE OR REPLACE FUNCTION get_metric(p_metric_name TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_value BIGINT;
BEGIN
  SELECT metric_value INTO v_value
  FROM platform_metrics
  WHERE metric_name = p_metric_name;

  RETURN COALESCE(v_value, 0);
END;
$$;

-- ============================================
-- Function: populate_historical_metrics
-- Backfill metrics from existing data
-- ============================================
CREATE OR REPLACE FUNCTION populate_historical_metrics()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_accounts BIGINT;
  v_total_reviews BIGINT;
  v_total_widgets BIGINT;
  v_total_prompt_pages BIGINT;
  v_total_gbp_locations BIGINT;
BEGIN
  -- Count existing accounts
  SELECT COUNT(*) INTO v_total_accounts FROM accounts;
  UPDATE platform_metrics SET metric_value = v_total_accounts, updated_at = NOW()
  WHERE metric_name = 'total_accounts_created';

  -- Count existing reviews
  SELECT COUNT(*) INTO v_total_reviews FROM review_submissions;
  UPDATE platform_metrics SET metric_value = v_total_reviews, updated_at = NOW()
  WHERE metric_name = 'total_reviews_captured';

  -- Count existing widgets
  SELECT COUNT(*) INTO v_total_widgets FROM widgets;
  UPDATE platform_metrics SET metric_value = v_total_widgets, updated_at = NOW()
  WHERE metric_name = 'total_widgets_created';

  -- Count existing prompt pages
  SELECT COUNT(*) INTO v_total_prompt_pages FROM prompt_pages;
  UPDATE platform_metrics SET metric_value = v_total_prompt_pages, updated_at = NOW()
  WHERE metric_name = 'total_prompt_pages_created';

  -- Count GBP locations (if table exists)
  BEGIN
    SELECT COUNT(DISTINCT location_id) INTO v_total_gbp_locations
    FROM google_business_locations
    WHERE location_id IS NOT NULL;

    UPDATE platform_metrics SET metric_value = v_total_gbp_locations, updated_at = NOW()
    WHERE metric_name = 'total_gbp_locations_connected';
  EXCEPTION
    WHEN undefined_table THEN
      -- Table doesn't exist yet, skip
      NULL;
  END;

  RAISE NOTICE 'Historical metrics populated successfully';
  RAISE NOTICE 'Total accounts: %', v_total_accounts;
  RAISE NOTICE 'Total reviews: %', v_total_reviews;
  RAISE NOTICE 'Total widgets: %', v_total_widgets;
  RAISE NOTICE 'Total prompt pages: %', v_total_prompt_pages;
END;
$$;

-- Run initial population
SELECT populate_historical_metrics();

-- ============================================
-- Success message
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Analytics tables created successfully';
  RAISE NOTICE 'Tables: platform_metrics, daily_stats';
  RAISE NOTICE 'Functions: increment_metric(), get_metric(), populate_historical_metrics()';
END $$;
