-- Create analysis_batch_runs table for tracking batch analysis jobs
-- Used for both domain analysis (visibility opportunities) and competitor analysis

CREATE TABLE IF NOT EXISTS analysis_batch_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  batch_type TEXT NOT NULL CHECK (batch_type IN ('domain', 'competitor')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_items INT NOT NULL DEFAULT 0,
  processed_items INT NOT NULL DEFAULT 0,
  successful_items INT NOT NULL DEFAULT 0,
  failed_items INT NOT NULL DEFAULT 0,
  estimated_credits INT NOT NULL DEFAULT 0,
  total_credits_used INT NOT NULL DEFAULT 0,
  error_message TEXT,
  triggered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create analysis_batch_run_items table for tracking individual items in a batch
CREATE TABLE IF NOT EXISTS analysis_batch_run_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_run_id UUID NOT NULL REFERENCES analysis_batch_runs(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('domain', 'competitor')),
  item_key TEXT NOT NULL, -- domain name or competitor name (lowercase)
  item_display_name TEXT NOT NULL, -- original display name
  item_metadata JSONB, -- additional context (categories, concepts, etc.)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_analysis_batch_runs_account ON analysis_batch_runs(account_id);
CREATE INDEX IF NOT EXISTS idx_analysis_batch_runs_status ON analysis_batch_runs(status);
CREATE INDEX IF NOT EXISTS idx_analysis_batch_runs_type_status ON analysis_batch_runs(batch_type, status);
CREATE INDEX IF NOT EXISTS idx_analysis_batch_run_items_batch ON analysis_batch_run_items(batch_run_id);
CREATE INDEX IF NOT EXISTS idx_analysis_batch_run_items_status ON analysis_batch_run_items(batch_run_id, status);

-- Comments
COMMENT ON TABLE analysis_batch_runs IS 'Tracks batch analysis jobs for domain and competitor analysis';
COMMENT ON TABLE analysis_batch_run_items IS 'Individual items within an analysis batch job';
