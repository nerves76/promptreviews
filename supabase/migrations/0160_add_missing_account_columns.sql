-- Add missing columns to accounts table
-- These columns are needed for proper account management and plan limits

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS business_name TEXT;

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS max_locations INTEGER DEFAULT 1;

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS location_count INTEGER DEFAULT 0;

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS max_contacts INTEGER DEFAULT 100;

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS max_prompt_pages INTEGER DEFAULT 10;

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS prompt_page_count INTEGER DEFAULT 0;

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS has_had_paid_plan BOOLEAN DEFAULT false;

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS first_name TEXT;

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS last_name TEXT;

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS plan_lookup_key TEXT DEFAULT 'grower';

ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS review_notifications_enabled BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN accounts.business_name IS 'Name of the business associated with this account';
COMMENT ON COLUMN accounts.max_locations IS 'Maximum number of locations allowed for this plan';
COMMENT ON COLUMN accounts.location_count IS 'Current number of locations created';
COMMENT ON COLUMN accounts.max_contacts IS 'Maximum number of contacts allowed for this plan';
COMMENT ON COLUMN accounts.max_prompt_pages IS 'Maximum number of prompt pages allowed for this plan';
COMMENT ON COLUMN accounts.prompt_page_count IS 'Current number of prompt pages created';
COMMENT ON COLUMN accounts.has_had_paid_plan IS 'Whether the user has ever had a paid plan';
COMMENT ON COLUMN accounts.email IS 'Email address associated with this account';
COMMENT ON COLUMN accounts.first_name IS 'First name of the account owner';
COMMENT ON COLUMN accounts.last_name IS 'Last name of the account owner';
COMMENT ON COLUMN accounts.user_id IS 'User ID associated with this account';
COMMENT ON COLUMN accounts.plan_lookup_key IS 'Key used for plan lookup and billing';
COMMENT ON COLUMN accounts.review_notifications_enabled IS 'Whether review notifications are enabled'; 