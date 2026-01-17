-- Migration: Create rank batch runs tables for "Run All" functionality
-- Purpose: Track batch execution of rank tracking checks across all keywords

-- Table: rank_batch_runs - Tracks overall batch run status
CREATE TABLE rank_batch_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

  -- Configuration (always runs both desktop and mobile = 2 credits per keyword)
  total_keywords INT NOT NULL DEFAULT 0,

  -- Progress tracking
  processed_keywords INT NOT NULL DEFAULT 0,
  successful_checks INT NOT NULL DEFAULT 0,
  failed_checks INT NOT NULL DEFAULT 0,

  -- Cost tracking (2 credits per keyword: desktop + mobile)
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
CREATE INDEX idx_rank_batch_runs_status ON rank_batch_runs(status)
WHERE status IN ('pending', 'processing');

-- Index for account queries
CREATE INDEX idx_rank_batch_runs_account ON rank_batch_runs(account_id, created_at DESC);

-- Table: rank_batch_run_items - Tracks per-keyword status within a batch
CREATE TABLE rank_batch_run_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_run_id UUID NOT NULL REFERENCES rank_batch_runs(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  search_term TEXT NOT NULL,
  location_code INT,

  -- Per-device status
  desktop_status TEXT DEFAULT 'pending' CHECK (desktop_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  mobile_status TEXT DEFAULT 'pending' CHECK (mobile_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),

  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for finding items to process
CREATE INDEX idx_rank_batch_run_items_batch ON rank_batch_run_items(batch_run_id);

-- Index for pending items
CREATE INDEX idx_rank_batch_run_items_pending ON rank_batch_run_items(batch_run_id, desktop_status, mobile_status)
WHERE desktop_status = 'pending' OR mobile_status = 'pending';

-- Trigger to update updated_at on rank_batch_runs
CREATE OR REPLACE FUNCTION update_rank_batch_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_rank_batch_runs_updated_at
  BEFORE UPDATE ON rank_batch_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_rank_batch_runs_updated_at();

-- Trigger to update updated_at on rank_batch_run_items
CREATE OR REPLACE FUNCTION update_rank_batch_run_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_rank_batch_run_items_updated_at
  BEFORE UPDATE ON rank_batch_run_items
  FOR EACH ROW
  EXECUTE FUNCTION update_rank_batch_run_items_updated_at();

-- RLS Policies
ALTER TABLE rank_batch_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rank_batch_run_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own account's batch runs
CREATE POLICY "Users can view own account rank batch runs"
  ON rank_batch_runs
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert batch runs for their accounts
CREATE POLICY "Users can insert rank batch runs for own accounts"
  ON rank_batch_runs
  FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update their own account's batch runs
CREATE POLICY "Users can update own account rank batch runs"
  ON rank_batch_runs
  FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- Policy: Service role can do anything (for cron jobs)
CREATE POLICY "Service role full access to rank batch runs"
  ON rank_batch_runs
  FOR ALL
  USING (auth.role() = 'service_role');

-- Policy: Users can view items for their batch runs
CREATE POLICY "Users can view own rank batch run items"
  ON rank_batch_run_items
  FOR SELECT
  USING (
    batch_run_id IN (
      SELECT id FROM rank_batch_runs WHERE account_id IN (
        SELECT account_id FROM account_users WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Users can insert items for their batch runs
CREATE POLICY "Users can insert rank batch run items"
  ON rank_batch_run_items
  FOR INSERT
  WITH CHECK (
    batch_run_id IN (
      SELECT id FROM rank_batch_runs WHERE account_id IN (
        SELECT account_id FROM account_users WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Service role can do anything (for cron jobs)
CREATE POLICY "Service role full access to rank batch run items"
  ON rank_batch_run_items
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE rank_batch_runs IS 'Tracks batch execution of rank tracking checks across all keywords';
COMMENT ON TABLE rank_batch_run_items IS 'Tracks individual keyword status within a rank batch run';
COMMENT ON COLUMN rank_batch_runs.status IS 'Overall batch status: pending (queued), processing (running), completed, failed';
COMMENT ON COLUMN rank_batch_run_items.desktop_status IS 'Status of desktop rank check: pending, processing, completed, failed, skipped';
COMMENT ON COLUMN rank_batch_run_items.mobile_status IS 'Status of mobile rank check: pending, processing, completed, failed, skipped';
