-- Add billing_period column to accounts table to track user's billing preference
-- This allows us to show the correct billing period (monthly/annual) even during trials

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS billing_period text DEFAULT 'monthly' 
CHECK (billing_period IN ('monthly', 'annual'));

-- Add comment for documentation
COMMENT ON COLUMN accounts.billing_period IS 'User''s selected billing period (monthly or annual), stored even during trial period';

-- Update any existing grower accounts based on their Stripe price ID if available
-- This helps fix any existing accounts that might have selected annual
UPDATE accounts
SET billing_period = 'annual'
WHERE plan = 'grower' 
  AND stripe_subscription_id IS NOT NULL
  AND plan_lookup_key LIKE '%annual%';

-- Also check for builder and maven annual plans
UPDATE accounts
SET billing_period = 'annual'
WHERE plan IN ('builder', 'maven')
  AND stripe_subscription_id IS NOT NULL
  AND plan_lookup_key LIKE '%annual%';