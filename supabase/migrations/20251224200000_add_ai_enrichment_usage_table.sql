-- Create table to track AI enrichment usage for daily limits
-- This replaces the credit-based system for keyword enrichment

CREATE TABLE IF NOT EXISTS ai_enrichment_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phrase TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient daily count queries
CREATE INDEX idx_ai_enrichment_usage_account_date 
  ON ai_enrichment_usage(account_id, created_at);

-- Index for user-level queries if needed
CREATE INDEX idx_ai_enrichment_usage_user_date 
  ON ai_enrichment_usage(user_id, created_at);

-- RLS policies
ALTER TABLE ai_enrichment_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own account's usage
CREATE POLICY "Users can view own account usage"
  ON ai_enrichment_usage FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- Service role can insert (API uses service client)
CREATE POLICY "Service can insert usage"
  ON ai_enrichment_usage FOR INSERT
  WITH CHECK (true);

-- Comment explaining the table
COMMENT ON TABLE ai_enrichment_usage IS 'Tracks AI keyword enrichment usage for daily limit enforcement (30/day per account)';
