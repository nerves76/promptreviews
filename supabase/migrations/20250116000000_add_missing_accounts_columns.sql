-- Add missing columns to accounts table
-- This migration ensures the accounts table has all columns from the schema document

-- Add missing columns that don't exist yet
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS business_name text,
ADD COLUMN IF NOT EXISTS plan text DEFAULT 'NULL'::text,
ADD COLUMN IF NOT EXISTS trial_start timestamp with time zone,
ADD COLUMN IF NOT EXISTS trial_end timestamp with time zone,
ADD COLUMN IF NOT EXISTS custom_prompt_page_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS contact_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS subscription_status text,
ADD COLUMN IF NOT EXISTS is_free_account boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_had_paid_plan boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS plan_lookup_key text,
ADD COLUMN IF NOT EXISTS review_notifications_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS user_id uuid;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_plan ON accounts(plan);
CREATE INDEX IF NOT EXISTS idx_accounts_trial_end ON accounts(trial_end);
CREATE INDEX IF NOT EXISTS idx_accounts_created_at ON accounts(created_at);
CREATE INDEX IF NOT EXISTS idx_accounts_plan_trial_end ON accounts(plan, trial_end); 