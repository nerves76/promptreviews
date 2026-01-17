-- Migration: Create LLM batch runs tables for "Run All" functionality
-- Purpose: Track batch execution of LLM visibility checks across all keywords/questions

-- Table: llm_batch_runs - Tracks overall batch run status
CREATE TABLE llm_batch_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

  -- Configuration
  providers TEXT[] NOT NULL,  -- e.g., ['chatgpt', 'claude']
  total_questions INT NOT NULL DEFAULT 0,

  -- Progress tracking
  processed_questions INT NOT NULL DEFAULT 0,
  successful_checks INT NOT NULL DEFAULT 0,
  failed_checks INT NOT NULL DEFAULT 0,

  -- Cost tracking
  estimated_credits INT NOT NULL DEFAULT 0,
  total_credits_used INT NOT NULL DEFAULT 0,

  -- Metadata
  error_message TEXT,
  triggered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for cron job to find pending/processing runs
CREATE INDEX idx_llm_batch_runs_status ON llm_batch_runs(status)
WHERE status IN ('pending', 'processing');

-- Index for account queries
CREATE INDEX idx_llm_batch_runs_account ON llm_batch_runs(account_id, created_at DESC);

-- Table: llm_batch_run_items - Tracks per-question status within a batch
CREATE TABLE llm_batch_run_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_run_id UUID NOT NULL REFERENCES llm_batch_runs(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_index INT NOT NULL,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for finding items to process
CREATE INDEX idx_llm_batch_run_items_batch_status ON llm_batch_run_items(batch_run_id, status);

-- Index for keyword lookups
CREATE INDEX idx_llm_batch_run_items_keyword ON llm_batch_run_items(keyword_id);

-- Trigger to update updated_at on llm_batch_runs
CREATE OR REPLACE FUNCTION update_llm_batch_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_llm_batch_runs_updated_at
  BEFORE UPDATE ON llm_batch_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_llm_batch_runs_updated_at();

-- Trigger to update updated_at on llm_batch_run_items
CREATE OR REPLACE FUNCTION update_llm_batch_run_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_llm_batch_run_items_updated_at
  BEFORE UPDATE ON llm_batch_run_items
  FOR EACH ROW
  EXECUTE FUNCTION update_llm_batch_run_items_updated_at();

-- RLS Policies
ALTER TABLE llm_batch_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_batch_run_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own account's batch runs
CREATE POLICY "Users can view own account batch runs"
  ON llm_batch_runs
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert batch runs for their accounts
CREATE POLICY "Users can insert batch runs for own accounts"
  ON llm_batch_runs
  FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update their own account's batch runs (for status updates from API)
CREATE POLICY "Users can update own account batch runs"
  ON llm_batch_runs
  FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- Policy: Service role can do anything (for cron jobs)
CREATE POLICY "Service role full access to batch runs"
  ON llm_batch_runs
  FOR ALL
  USING (auth.role() = 'service_role');

-- Policy: Users can view items for their batch runs
CREATE POLICY "Users can view own batch run items"
  ON llm_batch_run_items
  FOR SELECT
  USING (
    batch_run_id IN (
      SELECT id FROM llm_batch_runs WHERE account_id IN (
        SELECT account_id FROM account_users WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Users can insert items for their batch runs
CREATE POLICY "Users can insert batch run items"
  ON llm_batch_run_items
  FOR INSERT
  WITH CHECK (
    batch_run_id IN (
      SELECT id FROM llm_batch_runs WHERE account_id IN (
        SELECT account_id FROM account_users WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Service role can do anything (for cron jobs)
CREATE POLICY "Service role full access to batch run items"
  ON llm_batch_run_items
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE llm_batch_runs IS 'Tracks batch execution of LLM visibility checks across all keywords';
COMMENT ON TABLE llm_batch_run_items IS 'Tracks individual question status within a batch run';
COMMENT ON COLUMN llm_batch_runs.providers IS 'Array of LLM providers to check (chatgpt, claude, gemini, perplexity)';
COMMENT ON COLUMN llm_batch_runs.status IS 'Overall batch status: pending (queued), processing (running), completed, failed';
COMMENT ON COLUMN llm_batch_run_items.status IS 'Individual question status within the batch';
