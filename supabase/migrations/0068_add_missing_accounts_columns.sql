-- Migration: Add all missing columns to accounts table (safe to run multiple times)
-- This script brings the accounts table up to date with databaseschema.md and code expectations

ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS plan text DEFAULT 'NULL',
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
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS has_seen_welcome boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Add comments for clarity
COMMENT ON COLUMN public.accounts.business_name IS 'Business name for the account';
COMMENT ON COLUMN public.accounts.plan IS 'The user''s subscription plan';
COMMENT ON COLUMN public.accounts.trial_start IS 'When the user''s trial started';
COMMENT ON COLUMN public.accounts.trial_end IS 'When the user''s trial ends';
COMMENT ON COLUMN public.accounts.custom_prompt_page_count IS 'Number of custom prompt pages created';
COMMENT ON COLUMN public.accounts.contact_count IS 'Number of contacts created';
COMMENT ON COLUMN public.accounts.first_name IS 'First name of the account owner';
COMMENT ON COLUMN public.accounts.last_name IS 'Last name of the account owner';
COMMENT ON COLUMN public.accounts.stripe_customer_id IS 'Stripe customer ID';
COMMENT ON COLUMN public.accounts.stripe_subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN public.accounts.subscription_status IS 'Stripe subscription status';
COMMENT ON COLUMN public.accounts.is_free_account IS 'Whether the account is marked as free';
COMMENT ON COLUMN public.accounts.has_had_paid_plan IS 'Whether the account has ever had a paid plan';
COMMENT ON COLUMN public.accounts.email IS 'Primary email for the account';
COMMENT ON COLUMN public.accounts.plan_lookup_key IS 'Stripe plan lookup key';
COMMENT ON COLUMN public.accounts.review_notifications_enabled IS 'Whether review notifications are enabled';
COMMENT ON COLUMN public.accounts.user_id IS 'User ID (auth.users.id) for the account owner';
COMMENT ON COLUMN public.accounts.has_seen_welcome IS 'Tracks whether the user has seen the welcome popup on first login';
COMMENT ON COLUMN public.accounts.created_at IS 'Account creation timestamp';
COMMENT ON COLUMN public.accounts.updated_at IS 'Account last update timestamp'; 