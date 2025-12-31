-- ============================================================================
-- Add low_balance_warning_count column to accounts table
-- ============================================================================
-- Tracks how many low balance warnings have been sent this billing period.
-- Max 2 warnings per billing period, then resets when monthly credits are granted.

ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS low_balance_warning_count INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN accounts.low_balance_warning_count IS
'Number of low credit balance warnings sent this billing period (max 2). Reset to 0 when monthly credits are granted.';
