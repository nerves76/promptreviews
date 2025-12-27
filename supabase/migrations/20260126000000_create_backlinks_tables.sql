-- ============================================
-- DataForSEO Backlinks Tracking Tables
-- Feature: Track domain backlink profiles with
-- historical trends, anchors, and referring domains
-- ============================================

-- ============================================
-- Table 1: Tracked domains
-- ============================================
CREATE TABLE backlink_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

  -- Domain to track (e.g., "example.com")
  domain TEXT NOT NULL,

  -- Scheduling (mirrors rank_keyword_groups pattern)
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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One domain per account
  UNIQUE(account_id, domain)
);

CREATE INDEX idx_backlink_domains_account ON backlink_domains(account_id);
CREATE INDEX idx_backlink_domains_account_enabled ON backlink_domains(account_id, is_enabled);
CREATE INDEX idx_backlink_domains_schedule ON backlink_domains(next_scheduled_at)
  WHERE is_enabled = true AND schedule_frequency IS NOT NULL;

COMMENT ON TABLE backlink_domains IS 'Domains being tracked for backlink monitoring';
COMMENT ON COLUMN backlink_domains.domain IS 'Domain to track (e.g., "example.com")';
COMMENT ON COLUMN backlink_domains.schedule_frequency IS 'How often to check: daily, weekly, monthly';

-- ============================================
-- Table 2: Backlink check results (summary metrics)
-- ============================================
CREATE TABLE backlink_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES backlink_domains(id) ON DELETE CASCADE,

  -- Summary metrics from /v3/backlinks/summary
  backlinks_total INT DEFAULT 0,
  referring_domains_total INT DEFAULT 0,
  referring_domains_nofollow INT DEFAULT 0,
  referring_main_domains INT DEFAULT 0,
  referring_ips INT DEFAULT 0,
  referring_subnets INT DEFAULT 0,

  -- DataForSEO Rank (domain authority score)
  rank INT,

  -- Follow/NoFollow breakdown
  backlinks_follow INT DEFAULT 0,
  backlinks_nofollow INT DEFAULT 0,

  -- Link types
  backlinks_text INT DEFAULT 0,
  backlinks_image INT DEFAULT 0,
  backlinks_redirect INT DEFAULT 0,
  backlinks_form INT DEFAULT 0,
  backlinks_frame INT DEFAULT 0,

  -- Page counts
  referring_pages INT DEFAULT 0,

  -- Cost tracking
  api_cost_usd DECIMAL(10,6),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_backlink_checks_account ON backlink_checks(account_id);
CREATE INDEX idx_backlink_checks_domain_date ON backlink_checks(domain_id, checked_at DESC);
CREATE INDEX idx_backlink_checks_checked_at ON backlink_checks(checked_at DESC);

COMMENT ON TABLE backlink_checks IS 'Individual backlink check results over time';
COMMENT ON COLUMN backlink_checks.rank IS 'DataForSEO Rank - domain authority score (0-1000)';
COMMENT ON COLUMN backlink_checks.backlinks_total IS 'Total number of backlinks pointing to domain';
COMMENT ON COLUMN backlink_checks.referring_domains_total IS 'Total unique domains linking to target';

-- ============================================
-- Table 3: Anchor text distribution snapshots
-- ============================================
CREATE TABLE backlink_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  check_id UUID NOT NULL REFERENCES backlink_checks(id) ON DELETE CASCADE,

  -- Anchor data
  anchor_text TEXT NOT NULL,
  backlinks_count INT DEFAULT 0,
  referring_domains_count INT DEFAULT 0,
  first_seen DATE,
  last_seen DATE,
  rank INT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_backlink_anchors_check ON backlink_anchors(check_id);
CREATE INDEX idx_backlink_anchors_account ON backlink_anchors(account_id);

COMMENT ON TABLE backlink_anchors IS 'Anchor text distribution for each check';
COMMENT ON COLUMN backlink_anchors.anchor_text IS 'The anchor text used in backlinks';
COMMENT ON COLUMN backlink_anchors.backlinks_count IS 'Number of backlinks using this anchor';

-- ============================================
-- Table 4: Top referring domains snapshots
-- ============================================
CREATE TABLE backlink_referring_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  check_id UUID NOT NULL REFERENCES backlink_checks(id) ON DELETE CASCADE,

  -- Domain info
  referring_domain TEXT NOT NULL,
  backlinks_count INT DEFAULT 0,

  -- Domain metrics
  rank INT,
  backlinks_spam_score DECIMAL(5,2),
  first_seen DATE,
  last_seen DATE,

  -- Link type
  is_follow BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_backlink_referring_domains_check ON backlink_referring_domains(check_id);
CREATE INDEX idx_backlink_referring_domains_account ON backlink_referring_domains(account_id);

COMMENT ON TABLE backlink_referring_domains IS 'Top referring domains for each check';
COMMENT ON COLUMN backlink_referring_domains.rank IS 'DataForSEO Rank of the referring domain';
COMMENT ON COLUMN backlink_referring_domains.backlinks_spam_score IS 'Spam score (0-100) of the referring domain';

-- ============================================
-- Table 5: New and lost backlinks tracking
-- ============================================
CREATE TABLE backlink_new_lost (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES backlink_domains(id) ON DELETE CASCADE,
  check_id UUID NOT NULL REFERENCES backlink_checks(id) ON DELETE CASCADE,

  -- Change type
  change_type TEXT NOT NULL CHECK (change_type IN ('new', 'lost')),

  -- Link details
  source_url TEXT,
  source_domain TEXT,
  target_url TEXT,
  anchor_text TEXT,
  link_type TEXT, -- text, image, redirect, form, frame
  is_follow BOOLEAN DEFAULT true,
  first_seen DATE,
  last_seen DATE,

  -- Source domain authority
  source_rank INT,

  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_backlink_new_lost_domain_date ON backlink_new_lost(domain_id, detected_at DESC);
CREATE INDEX idx_backlink_new_lost_account ON backlink_new_lost(account_id);
CREATE INDEX idx_backlink_new_lost_type ON backlink_new_lost(domain_id, change_type);
CREATE INDEX idx_backlink_new_lost_check ON backlink_new_lost(check_id);

COMMENT ON TABLE backlink_new_lost IS 'New and lost backlinks detected during checks';
COMMENT ON COLUMN backlink_new_lost.change_type IS 'Whether this is a new or lost backlink';
COMMENT ON COLUMN backlink_new_lost.source_rank IS 'DataForSEO Rank of the source domain';

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE backlink_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlink_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlink_anchors ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlink_referring_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlink_new_lost ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies: backlink_domains
-- ============================================
CREATE POLICY "Users can view own account backlink_domains"
  ON backlink_domains FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = backlink_domains.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own account backlink_domains"
  ON backlink_domains FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = backlink_domains.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own account backlink_domains"
  ON backlink_domains FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = backlink_domains.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own account backlink_domains"
  ON backlink_domains FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = backlink_domains.account_id
        AND au.user_id = auth.uid()
    )
  );

-- ============================================
-- RLS Policies: backlink_checks
-- ============================================
CREATE POLICY "Users can view own account backlink_checks"
  ON backlink_checks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = backlink_checks.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own account backlink_checks"
  ON backlink_checks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = backlink_checks.account_id
        AND au.user_id = auth.uid()
    )
  );

-- ============================================
-- RLS Policies: backlink_anchors
-- ============================================
CREATE POLICY "Users can view own account backlink_anchors"
  ON backlink_anchors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = backlink_anchors.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own account backlink_anchors"
  ON backlink_anchors FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = backlink_anchors.account_id
        AND au.user_id = auth.uid()
    )
  );

-- ============================================
-- RLS Policies: backlink_referring_domains
-- ============================================
CREATE POLICY "Users can view own account backlink_referring_domains"
  ON backlink_referring_domains FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = backlink_referring_domains.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own account backlink_referring_domains"
  ON backlink_referring_domains FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = backlink_referring_domains.account_id
        AND au.user_id = auth.uid()
    )
  );

-- ============================================
-- RLS Policies: backlink_new_lost
-- ============================================
CREATE POLICY "Users can view own account backlink_new_lost"
  ON backlink_new_lost FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = backlink_new_lost.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own account backlink_new_lost"
  ON backlink_new_lost FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = backlink_new_lost.account_id
        AND au.user_id = auth.uid()
    )
  );

-- ============================================
-- Service role bypass for cron jobs and API routes
-- ============================================
CREATE POLICY "Service role full access backlink_domains"
  ON backlink_domains FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access backlink_checks"
  ON backlink_checks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access backlink_anchors"
  ON backlink_anchors FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access backlink_referring_domains"
  ON backlink_referring_domains FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access backlink_new_lost"
  ON backlink_new_lost FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Trigger to auto-update next_scheduled_at when schedule changes
-- (Uses same function pattern as rank tracking)
-- ============================================
CREATE OR REPLACE FUNCTION calculate_backlink_next_scheduled_at(
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

CREATE OR REPLACE FUNCTION update_backlink_next_scheduled_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.schedule_frequency IS NOT NULL AND NEW.is_enabled = true THEN
    NEW.next_scheduled_at := calculate_backlink_next_scheduled_at(
      NEW.schedule_frequency,
      NEW.schedule_day_of_week,
      NEW.schedule_day_of_month,
      NEW.schedule_hour,
      COALESCE(NEW.last_scheduled_run_at, NOW())
    );
  ELSE
    NEW.next_scheduled_at := NULL;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_backlink_next_scheduled_at ON backlink_domains;
CREATE TRIGGER trg_update_backlink_next_scheduled_at
  BEFORE INSERT OR UPDATE OF schedule_frequency, schedule_day_of_week, schedule_day_of_month, schedule_hour, is_enabled, last_scheduled_run_at
  ON backlink_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_backlink_next_scheduled_at();

-- ============================================
-- Updated_at trigger for backlink_domains
-- ============================================
CREATE OR REPLACE FUNCTION update_backlink_domains_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_backlink_domains_updated_at ON backlink_domains;
CREATE TRIGGER trg_backlink_domains_updated_at
  BEFORE UPDATE ON backlink_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_backlink_domains_updated_at();
