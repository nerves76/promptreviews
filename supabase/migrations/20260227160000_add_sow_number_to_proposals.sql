-- Add SOW (Statement of Work) numbering to proposals
-- Each account gets a numeric prefix (e.g. "031") set once and locked.
-- Each non-template proposal gets a sequential sow_number (1, 2, 3...).
-- Display format: {prefix}{number} e.g. "0311", "0312", "031345"

-- 1. Add sow_prefix to accounts (nullable until the user sets it)
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS sow_prefix TEXT;

-- 2. Add sow_number and show_sow_number to proposals
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS sow_number INTEGER,
  ADD COLUMN IF NOT EXISTS show_sow_number BOOLEAN NOT NULL DEFAULT true;

-- 3. Unique constraint: no duplicate sow_number per account (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_proposals_account_sow_number
  ON proposals(account_id, sow_number) WHERE sow_number IS NOT NULL;
