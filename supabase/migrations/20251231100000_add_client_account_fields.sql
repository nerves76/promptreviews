-- Add client account fields for custom credit allocation
-- is_client_account: marks accounts that should receive monthly credits even on free plan
-- monthly_credit_allocation: custom credit amount per account (overrides plan defaults)

ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS is_client_account boolean DEFAULT false;

ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS monthly_credit_allocation integer DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN accounts.is_client_account IS 'When true, account receives monthly credits even without a paid subscription';
COMMENT ON COLUMN accounts.monthly_credit_allocation IS 'Custom monthly credit amount. If NULL, uses plan default. If set, overrides plan tier.';

-- Create index for the cron job query
CREATE INDEX IF NOT EXISTS idx_accounts_client_account ON accounts (is_client_account) WHERE is_client_account = true AND deleted_at IS NULL;
