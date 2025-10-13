-- Create sentiment_analysis_runs table
CREATE TABLE IF NOT EXISTS sentiment_analysis_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  run_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  review_count_analyzed INTEGER NOT NULL,
  date_range_start TIMESTAMP WITH TIME ZONE NOT NULL,
  date_range_end TIMESTAMP WITH TIME ZONE NOT NULL,
  plan_at_time VARCHAR(50) NOT NULL,
  results_json JSONB NOT NULL,
  analysis_version VARCHAR(20) DEFAULT '1.0',
  processing_time_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_sentiment_runs_account_date ON sentiment_analysis_runs(account_id, run_date DESC);
-- Note: Using run_date directly since DATE_TRUNC in index requires IMMUTABLE function
-- Queries can use DATE_TRUNC in WHERE clause, which is efficient enough
CREATE INDEX idx_sentiment_runs_run_date ON sentiment_analysis_runs(run_date);

-- Add sentiment tracking columns to accounts table
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS sentiment_analyses_this_month INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sentiment_last_reset_date DATE DEFAULT CURRENT_DATE;

-- Enable Row Level Security
ALTER TABLE sentiment_analysis_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view runs for their own accounts
CREATE POLICY "Users can view sentiment runs for their accounts"
  ON sentiment_analysis_runs
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id
      FROM account_users
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can create runs for their own accounts
CREATE POLICY "Users can create sentiment runs for their accounts"
  ON sentiment_analysis_runs
  FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id
      FROM account_users
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can delete runs for their own accounts or admins can delete any
CREATE POLICY "Users can delete sentiment runs for their accounts"
  ON sentiment_analysis_runs
  FOR DELETE
  USING (
    account_id IN (
      SELECT account_id
      FROM account_users
      WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1
      FROM account_users
      WHERE user_id = auth.uid()
      AND account_id = sentiment_analysis_runs.account_id
      AND role = 'admin'
    )
  );

-- Add comment for documentation
COMMENT ON TABLE sentiment_analysis_runs IS 'Stores historical sentiment analysis results for business reviews';
COMMENT ON COLUMN sentiment_analysis_runs.results_json IS 'Full SentimentAnalysisResult object with summary and detailed metrics';
COMMENT ON COLUMN sentiment_analysis_runs.plan_at_time IS 'The account plan (grower, builder, maven) at the time of analysis';
COMMENT ON COLUMN accounts.sentiment_analyses_this_month IS 'Counter for sentiment analyses run this month, resets monthly';
COMMENT ON COLUMN accounts.sentiment_last_reset_date IS 'Date when sentiment analysis counter was last reset';
