-- Create table to track AI keyword generation usage for daily limits
-- This replaces the credit-based system for keyword generation

CREATE TABLE IF NOT EXISTS ai_keyword_generation_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient daily count queries
CREATE INDEX idx_ai_keyword_generation_usage_account_date
  ON ai_keyword_generation_usage(account_id, created_at);

-- Index for user-level queries if needed
CREATE INDEX idx_ai_keyword_generation_usage_user_date
  ON ai_keyword_generation_usage(user_id, created_at);

-- RLS policies
ALTER TABLE ai_keyword_generation_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own account's usage
CREATE POLICY "Users can view own account usage"
  ON ai_keyword_generation_usage FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- Service role can insert (API uses service client)
CREATE POLICY "Service can insert usage"
  ON ai_keyword_generation_usage FOR INSERT
  WITH CHECK (true);

-- Comment explaining the table
COMMENT ON TABLE ai_keyword_generation_usage IS 'Tracks AI keyword generation usage for daily limit enforcement (20/day per account)';
