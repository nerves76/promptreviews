-- Add agency fields to accounts table
-- This enables accounts to be marked as agencies and track agency-specific metadata

-- Agency identification
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_agncy BOOLEAN DEFAULT FALSE;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS agncy_trial_start TIMESTAMPTZ;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS agncy_trial_end TIMESTAMPTZ;

-- Agency metadata (captured during signup)
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS agncy_type TEXT; -- 'freelancer', 'small_agency', 'mid_agency', 'enterprise'
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS agncy_employee_count TEXT; -- '1', '2-5', '6-10', '11-50', '50+'
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS agncy_expected_clients TEXT; -- '1-5', '6-20', '21-50', '50+'
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS agncy_multi_location_pct TEXT; -- '0-25', '26-50', '51-75', '76-100'

-- Agency relationship (for client accounts managed by an agency)
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS managing_agncy_id UUID REFERENCES accounts(id);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS agncy_billing_owner TEXT DEFAULT 'client';

-- Add check constraint for agncy_billing_owner
ALTER TABLE accounts ADD CONSTRAINT accounts_agncy_billing_owner_check
  CHECK (agncy_billing_owner IN ('client', 'agency'));

-- Create index for finding clients managed by an agency
CREATE INDEX IF NOT EXISTS idx_accounts_managing_agncy_id ON accounts(managing_agncy_id) WHERE managing_agncy_id IS NOT NULL;

-- Create index for finding agency accounts
CREATE INDEX IF NOT EXISTS idx_accounts_is_agncy ON accounts(is_agncy) WHERE is_agncy = TRUE;

COMMENT ON COLUMN accounts.is_agncy IS 'Whether this account is an agency account';
COMMENT ON COLUMN accounts.agncy_trial_start IS 'Start of 30-day agency trial period';
COMMENT ON COLUMN accounts.agncy_trial_end IS 'End of 30-day agency trial period';
COMMENT ON COLUMN accounts.agncy_type IS 'Type of agency: freelancer, small_agency, mid_agency, enterprise';
COMMENT ON COLUMN accounts.agncy_employee_count IS 'Number of employees at the agency';
COMMENT ON COLUMN accounts.agncy_expected_clients IS 'Expected number of client accounts';
COMMENT ON COLUMN accounts.agncy_multi_location_pct IS 'Percentage of clients expected to be multi-location';
COMMENT ON COLUMN accounts.managing_agncy_id IS 'ID of the agency account managing this client account';
COMMENT ON COLUMN accounts.agncy_billing_owner IS 'Who owns billing for this account: client or agency';
