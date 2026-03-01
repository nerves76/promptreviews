-- Track website scraper usage per account (lifetime limit of 5)
-- Prevents abuse of the "Scan & fill" website import feature during signup

CREATE TABLE IF NOT EXISTS scrape_business_info_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  website_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient count queries by account
CREATE INDEX idx_scrape_business_info_usage_account
  ON scrape_business_info_usage(account_id);

-- RLS policies
ALTER TABLE scrape_business_info_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own account's usage
CREATE POLICY "Users can view own account scrape usage"
  ON scrape_business_info_usage FOR SELECT TO authenticated
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- Service role full access (API uses service client for inserts)
CREATE POLICY "Service role full access on scrape usage"
  ON scrape_business_info_usage FOR ALL TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE scrape_business_info_usage IS 'Tracks website scraper usage for lifetime limit enforcement (5 per account)';
