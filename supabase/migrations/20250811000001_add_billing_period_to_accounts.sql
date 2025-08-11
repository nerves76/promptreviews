-- Add billing_period column to accounts table to track monthly vs annual billing
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS billing_period TEXT DEFAULT 'monthly' 
CHECK (billing_period IN ('monthly', 'annual'));

-- Add comment for documentation
COMMENT ON COLUMN accounts.billing_period IS 'Tracks whether the account is on monthly or annual billing cycle';

-- Create index for faster queries when filtering by billing period
CREATE INDEX IF NOT EXISTS idx_accounts_billing_period ON accounts(billing_period);