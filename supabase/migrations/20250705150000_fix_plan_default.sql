-- Fix plan default value to trigger tier selection for new users
-- Change the default from 'grower' to 'no_plan' so new users see the pricing modal

-- First, update existing accounts that have 'grower' plan but no trial_end (indicating they're new users)
UPDATE accounts 
SET plan = 'no_plan' 
WHERE plan = 'grower' 
AND trial_end IS NULL;

-- Then change the default value for new accounts
ALTER TABLE accounts 
ALTER COLUMN plan SET DEFAULT 'no_plan';

-- Add a comment to clarify the purpose
COMMENT ON COLUMN accounts.plan IS 'The user''s subscription plan. no_plan means no plan selected yet.'; 