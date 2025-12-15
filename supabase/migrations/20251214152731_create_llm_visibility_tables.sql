-- ============================================
-- LLM Visibility Tracking Tables
-- Feature: Track brand visibility in AI assistants
-- (ChatGPT, Claude, Gemini, Perplexity)
-- ============================================

-- ============================================
-- Table 1: Individual check results
-- ============================================
CREATE TABLE llm_visibility_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,

  -- The question sent to the LLM (from keywords.related_questions)
  question TEXT NOT NULL,

  -- Which LLM was queried
  llm_provider TEXT NOT NULL CHECK (llm_provider IN ('chatgpt', 'claude', 'gemini', 'perplexity')),

  -- Results
  domain_cited BOOLEAN NOT NULL DEFAULT false,    -- Was our domain cited?
  citation_position INT,                           -- Position in citations (1-based, NULL if not cited)
  citation_url TEXT,                               -- Exact URL cited (if any)
  total_citations INT NOT NULL DEFAULT 0,          -- Total citations in response

  -- Response data (for auditing/debugging)
  response_snippet TEXT,                           -- First ~500 chars of response
  citations JSONB,                                 -- [{domain, url, title, position, isOurs}]

  -- Metadata
  api_cost_usd DECIMAL(10,6),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX idx_llm_checks_account ON llm_visibility_checks(account_id);
CREATE INDEX idx_llm_checks_keyword ON llm_visibility_checks(keyword_id, checked_at DESC);
CREATE INDEX idx_llm_checks_keyword_provider ON llm_visibility_checks(keyword_id, llm_provider, checked_at DESC);
CREATE INDEX idx_llm_checks_account_cited ON llm_visibility_checks(account_id, domain_cited, checked_at DESC);
CREATE INDEX idx_llm_checks_checked_at ON llm_visibility_checks(checked_at DESC);

COMMENT ON TABLE llm_visibility_checks IS 'Individual LLM visibility check results over time';
COMMENT ON COLUMN llm_visibility_checks.question IS 'The question sent to the LLM (from keywords.related_questions)';
COMMENT ON COLUMN llm_visibility_checks.llm_provider IS 'Which AI assistant: chatgpt, claude, gemini, perplexity';
COMMENT ON COLUMN llm_visibility_checks.domain_cited IS 'Whether our domain appeared in citations';
COMMENT ON COLUMN llm_visibility_checks.citation_position IS '1-based position in citations list (NULL if not cited)';
COMMENT ON COLUMN llm_visibility_checks.citations IS 'Full citation data: [{domain, url, title, position, isOurs}]';

-- ============================================
-- Table 2: Keyword-level summary (denormalized for fast reads)
-- ============================================
CREATE TABLE llm_visibility_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,

  -- Aggregated stats (updated after each check batch)
  total_questions INT NOT NULL DEFAULT 0,
  questions_with_citation INT NOT NULL DEFAULT 0,
  visibility_score DECIMAL(5,2),                   -- Percentage (0-100)

  -- Per-provider stats
  -- {chatgpt: {checked: 5, cited: 2, avgPosition: 3.5}, claude: {...}, ...}
  provider_stats JSONB NOT NULL DEFAULT '{}',

  -- Timing
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(account_id, keyword_id)
);

CREATE INDEX idx_llm_summary_account ON llm_visibility_summary(account_id);
CREATE INDEX idx_llm_summary_score ON llm_visibility_summary(account_id, visibility_score DESC NULLS LAST);
CREATE INDEX idx_llm_summary_keyword ON llm_visibility_summary(keyword_id);

COMMENT ON TABLE llm_visibility_summary IS 'Aggregated LLM visibility metrics per keyword';
COMMENT ON COLUMN llm_visibility_summary.visibility_score IS 'Percentage of questions where domain was cited (0-100)';
COMMENT ON COLUMN llm_visibility_summary.provider_stats IS 'Per-provider stats: {chatgpt: {checked, cited, avgPosition}, ...}';

-- ============================================
-- Table 3: Scheduling configuration
-- ============================================
CREATE TABLE llm_visibility_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,

  -- Which providers to check
  providers TEXT[] NOT NULL DEFAULT ARRAY['chatgpt'],

  -- Schedule settings (mirrors rank_keyword_groups pattern)
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  schedule_frequency TEXT CHECK (schedule_frequency IN ('daily', 'weekly', 'monthly')),
  schedule_day_of_week INT CHECK (schedule_day_of_week BETWEEN 0 AND 6),
  schedule_day_of_month INT CHECK (schedule_day_of_month BETWEEN 1 AND 28),
  schedule_hour INT NOT NULL DEFAULT 9 CHECK (schedule_hour BETWEEN 0 AND 23),

  -- Scheduling state
  next_scheduled_at TIMESTAMPTZ,
  last_scheduled_run_at TIMESTAMPTZ,
  last_credit_warning_sent_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(account_id, keyword_id)
);

CREATE INDEX idx_llm_schedules_account ON llm_visibility_schedules(account_id);
CREATE INDEX idx_llm_schedules_keyword ON llm_visibility_schedules(keyword_id);
CREATE INDEX idx_llm_schedules_next ON llm_visibility_schedules(next_scheduled_at)
  WHERE is_enabled = true AND schedule_frequency IS NOT NULL;

COMMENT ON TABLE llm_visibility_schedules IS 'Scheduling configuration for automated LLM visibility checks';
COMMENT ON COLUMN llm_visibility_schedules.providers IS 'Which LLMs to check: chatgpt, claude, gemini, perplexity';

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE llm_visibility_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_visibility_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_visibility_schedules ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies: llm_visibility_checks
-- ============================================
CREATE POLICY "Users can view own account llm_visibility_checks"
  ON llm_visibility_checks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = llm_visibility_checks.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own account llm_visibility_checks"
  ON llm_visibility_checks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = llm_visibility_checks.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access llm_visibility_checks"
  ON llm_visibility_checks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- RLS Policies: llm_visibility_summary
-- ============================================
CREATE POLICY "Users can view own account llm_visibility_summary"
  ON llm_visibility_summary FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = llm_visibility_summary.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own account llm_visibility_summary"
  ON llm_visibility_summary FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = llm_visibility_summary.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own account llm_visibility_summary"
  ON llm_visibility_summary FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = llm_visibility_summary.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access llm_visibility_summary"
  ON llm_visibility_summary FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- RLS Policies: llm_visibility_schedules
-- ============================================
CREATE POLICY "Users can view own account llm_visibility_schedules"
  ON llm_visibility_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = llm_visibility_schedules.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own account llm_visibility_schedules"
  ON llm_visibility_schedules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = llm_visibility_schedules.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own account llm_visibility_schedules"
  ON llm_visibility_schedules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = llm_visibility_schedules.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own account llm_visibility_schedules"
  ON llm_visibility_schedules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = llm_visibility_schedules.account_id
        AND au.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access llm_visibility_schedules"
  ON llm_visibility_schedules FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Function to calculate next scheduled run time
-- (Reuses the rank tracking pattern)
-- ============================================
CREATE OR REPLACE FUNCTION calculate_llm_next_scheduled_at(
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
      v_next := DATE_TRUNC('day', p_from_time) + (v_target_hour || ' hours')::INTERVAL;
      IF v_next <= p_from_time THEN
        v_next := v_next + INTERVAL '1 day';
      END IF;

    WHEN 'weekly' THEN
      v_current_dow := EXTRACT(DOW FROM p_from_time)::INTEGER;
      v_days_to_add := (COALESCE(p_day_of_week, 1) - v_current_dow + 7) % 7;
      v_next := DATE_TRUNC('day', p_from_time) + (v_days_to_add || ' days')::INTERVAL + (v_target_hour || ' hours')::INTERVAL;
      IF v_next <= p_from_time THEN
        v_next := v_next + INTERVAL '7 days';
      END IF;

    WHEN 'monthly' THEN
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
-- Trigger to auto-update next_scheduled_at
-- ============================================
CREATE OR REPLACE FUNCTION update_llm_next_scheduled_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.schedule_frequency IS NOT NULL AND NEW.is_enabled = true THEN
    NEW.next_scheduled_at := calculate_llm_next_scheduled_at(
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

DROP TRIGGER IF EXISTS trg_update_llm_next_scheduled_at ON llm_visibility_schedules;
CREATE TRIGGER trg_update_llm_next_scheduled_at
  BEFORE INSERT OR UPDATE OF schedule_frequency, schedule_day_of_week, schedule_day_of_month, schedule_hour, is_enabled, last_scheduled_run_at
  ON llm_visibility_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_llm_next_scheduled_at();

-- ============================================
-- Trigger to auto-update updated_at on summary
-- ============================================
CREATE OR REPLACE FUNCTION update_llm_summary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_llm_summary_updated_at ON llm_visibility_summary;
CREATE TRIGGER trg_update_llm_summary_updated_at
  BEFORE UPDATE ON llm_visibility_summary
  FOR EACH ROW
  EXECUTE FUNCTION update_llm_summary_updated_at();
