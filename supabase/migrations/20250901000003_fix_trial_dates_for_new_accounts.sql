-- Fix trial date logic for new accounts
-- Date: 2025-09-01
-- 
-- This migration fixes the issue where new accounts were getting trial dates set automatically,
-- which prevented them from being eligible for trials when selecting a paid plan.
-- Trial dates should only be set when a user actually chooses a paid plan, not during signup.

-- Drop and recreate the trigger function to not set trial dates
CREATE OR REPLACE FUNCTION handle_new_user_clean()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only process confirmed users
  IF NEW.confirmed_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Create account if doesn't exist
  -- NOTE: Don't set trial_start and trial_end here - they should only be set when user chooses a paid plan
  INSERT INTO public.accounts (
    id,
    email,
    plan,
    trial_start,
    trial_end,
    created_at,
    updated_at,
    user_id,
    first_name,
    last_name,
    is_free_account,
    has_had_paid_plan
  ) VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    'no_plan',
    NULL,  -- Don't set trial dates during account creation
    NULL,  -- Trial dates are set when user selects a paid plan
    NOW(),
    NOW(),
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    false,  -- Not a free account yet
    false   -- New accounts haven't had paid plans
  ) ON CONFLICT (id) DO NOTHING;

  -- Create account_users link if doesn't exist
  INSERT INTO public.account_users (
    account_id,
    user_id,
    role,
    created_at
  ) VALUES (
    NEW.id,
    NEW.id,
    'owner',
    NOW()
  ) ON CONFLICT (user_id, account_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but always return NEW to not block auth
    RAISE WARNING 'Error in handle_new_user_clean: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Update any existing accounts that have trial dates but are still on 'no_plan'
-- These are accounts that haven't actually started a trial yet
UPDATE public.accounts
SET 
  trial_start = NULL,
  trial_end = NULL
WHERE 
  plan = 'no_plan' 
  AND trial_start IS NOT NULL
  AND has_had_paid_plan = false
  AND stripe_subscription_id IS NULL;

-- Add a comment explaining the trial logic
COMMENT ON COLUMN public.accounts.trial_start IS 
'Trial start date - only set when user selects a paid plan, not during signup';

COMMENT ON COLUMN public.accounts.trial_end IS 
'Trial end date - only set when user selects a paid plan, not during signup';