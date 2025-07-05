-- Add onboarding_step column to accounts table
-- This tracks the user's progress through the onboarding flow
-- Values: 'incomplete', 'needs_business', 'needs_plan', 'complete'

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS onboarding_step TEXT DEFAULT 'incomplete';

-- Create index for performance on onboarding_step queries
CREATE INDEX IF NOT EXISTS idx_accounts_onboarding_step ON accounts(onboarding_step);

-- Update existing accounts based on their current state
-- This ensures existing users have the correct onboarding step
UPDATE accounts SET onboarding_step = 
  CASE 
    -- User has a paid plan - onboarding is complete
    WHEN plan IS NOT NULL AND plan != 'no_plan' AND plan != 'NULL' THEN 'complete'
    -- User has businesses but no plan - needs plan selection
    WHEN (SELECT COUNT(*) FROM businesses WHERE account_id = accounts.id) > 0 THEN 'needs_plan'
    -- User has no businesses - needs to create business
    ELSE 'needs_business'
  END
WHERE onboarding_step = 'incomplete';

-- Add comment for documentation
COMMENT ON COLUMN accounts.onboarding_step IS 'Tracks user onboarding progress: incomplete, needs_business, needs_plan, complete'; 