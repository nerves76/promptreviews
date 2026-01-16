-- Create concept_check_runs table to track async check runs
-- This enables "run now" to return immediately while checks run in background

CREATE TABLE IF NOT EXISTS concept_check_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,

  -- Check configuration
  search_rank_enabled BOOLEAN NOT NULL DEFAULT false,
  geo_grid_enabled BOOLEAN NOT NULL DEFAULT false,
  llm_visibility_enabled BOOLEAN NOT NULL DEFAULT false,
  llm_providers TEXT[] DEFAULT ARRAY['chatgpt']::TEXT[],
  review_matching_enabled BOOLEAN NOT NULL DEFAULT false,

  -- Overall status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

  -- Per-check status (null = not requested, pending/processing/completed/failed)
  search_rank_status TEXT CHECK (search_rank_status IN ('pending', 'processing', 'completed', 'failed')),
  geo_grid_status TEXT CHECK (geo_grid_status IN ('pending', 'processing', 'completed', 'failed')),
  llm_visibility_status TEXT CHECK (llm_visibility_status IN ('pending', 'processing', 'completed', 'failed')),
  review_matching_status TEXT CHECK (review_matching_status IN ('pending', 'processing', 'completed', 'failed')),

  -- Results summary
  total_credits_used INTEGER DEFAULT 0,
  error_message TEXT,

  -- Metadata
  triggered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_concept_check_runs_account ON concept_check_runs(account_id);
CREATE INDEX idx_concept_check_runs_keyword ON concept_check_runs(keyword_id);
CREATE INDEX idx_concept_check_runs_status ON concept_check_runs(status) WHERE status IN ('pending', 'processing');
CREATE INDEX idx_concept_check_runs_created ON concept_check_runs(created_at DESC);

-- RLS policies
ALTER TABLE concept_check_runs ENABLE ROW LEVEL SECURITY;

-- Users can view their own account's runs
CREATE POLICY "Users can view own account runs" ON concept_check_runs
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- Service role can do everything (for cron jobs)
CREATE POLICY "Service role full access" ON concept_check_runs
  FOR ALL USING (auth.role() = 'service_role');

-- Trigger to update updated_at
CREATE TRIGGER update_concept_check_runs_updated_at
  BEFORE UPDATE ON concept_check_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE concept_check_runs IS 'Tracks async concept check runs for the "Run Now" feature';
