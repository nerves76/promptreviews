-- Add trial_ends_at column to accounts table for tracking trial expiration
-- This is used by the agency feature to set trial periods for client workspaces

ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN accounts.trial_ends_at IS 'Date when the account trial period ends. NULL means no trial or trial has ended.';
