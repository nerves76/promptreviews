-- Remove unused has_seen_welcome column from accounts table
-- This column was part of the old welcome popup system that has been replaced
-- by the modern onboarding_tasks table and onboarding flow system.

-- Remove the column if it exists
ALTER TABLE accounts DROP COLUMN IF EXISTS has_seen_welcome;

-- Add a comment to document the removal
COMMENT ON TABLE accounts IS 'Stores user account information including plan and trial status. Note: has_seen_welcome column removed in favor of onboarding_tasks system.'; 