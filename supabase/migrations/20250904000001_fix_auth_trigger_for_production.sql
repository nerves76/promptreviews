-- Fix authentication trigger for production
-- Date: 2025-09-04
-- 
-- This migration fixes the issue where accounts aren't being created on production
-- during signup. The problem is that the trigger only fires for confirmed users,
-- but on production the confirmed_at field might not be set immediately.

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a more robust account creation function that handles all cases
CREATE OR REPLACE FUNCTION handle_new_user_clean()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_account_exists boolean;
BEGIN
  -- Log for debugging
  RAISE LOG 'handle_new_user_clean triggered for user %', NEW.id;
  
  -- Check if account already exists
  SELECT EXISTS (
    SELECT 1 FROM public.accounts WHERE id = NEW.id
  ) INTO v_account_exists;
  
  -- If account already exists, just ensure account_users link exists
  IF v_account_exists THEN
    -- Ensure account_users link exists
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
  END IF;

  -- Create account for new users (both confirmed and unconfirmed)
  -- The account will be created immediately but with no_plan status
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

  -- Create account_users link
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

-- Create trigger that fires for ALL new users (not just confirmed ones)
-- This ensures accounts are created immediately on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_clean();

-- Also handle the case where users update their email confirmation status
CREATE OR REPLACE FUNCTION handle_user_confirmation()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- If user is being confirmed and doesn't have an account, create one
  IF NEW.confirmed_at IS NOT NULL AND OLD.confirmed_at IS NULL THEN
    -- Check if account exists
    IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = NEW.id) THEN
      -- Create account
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
        NULL,
        NULL,
        NOW(),
        NOW(),
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        false,
        false
      ) ON CONFLICT (id) DO NOTHING;

      -- Create account_users link
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
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

-- Create trigger for user confirmation updates
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (NEW.confirmed_at IS NOT NULL AND OLD.confirmed_at IS NULL)
  EXECUTE FUNCTION handle_user_confirmation();

-- Fix any existing users who don't have accounts
-- This will create accounts for any users that somehow got created without accounts
DO $$
DECLARE
  v_user RECORD;
BEGIN
  FOR v_user IN 
    SELECT u.* 
    FROM auth.users u
    LEFT JOIN public.accounts a ON a.id = u.id
    WHERE a.id IS NULL
  LOOP
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
      v_user.id,
      COALESCE(v_user.email, ''),
      'no_plan',
      NULL,
      NULL,
      COALESCE(v_user.created_at, NOW()),
      NOW(),
      v_user.id,
      COALESCE(v_user.raw_user_meta_data->>'first_name', ''),
      COALESCE(v_user.raw_user_meta_data->>'last_name', ''),
      false,
      false
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Create account_users link
    INSERT INTO public.account_users (
      account_id,
      user_id,
      role,
      created_at
    ) VALUES (
      v_user.id,
      v_user.id,
      'owner',
      NOW()
    ) ON CONFLICT (user_id, account_id) DO NOTHING;
    
    RAISE NOTICE 'Created missing account for user %', v_user.id;
  END LOOP;
END;
$$;

-- Add a comment explaining the new trigger logic
COMMENT ON FUNCTION handle_new_user_clean IS 
'Creates accounts for ALL new users immediately on signup, not just confirmed users. This fixes production signup issues.';