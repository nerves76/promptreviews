-- Restore the correct triggers that were working from 20250904000001
-- These handle both INSERT (new users) and UPDATE (confirmations)

-- First clean up any existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
DROP TRIGGER IF EXISTS auth_user_account_management ON auth.users;

-- Drop the non-working functions
DROP FUNCTION IF EXISTS public.handle_auth_user_change();
DROP FUNCTION IF EXISTS public.handle_new_user_account();

-- Restore handle_new_user_clean that fires on INSERT
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
    has_had_paid_plan,
    custom_prompt_page_count,
    contact_count,
    review_notifications_enabled
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
    false,  -- New accounts haven't had paid plans
    0,
    0,
    true
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

-- Create trigger that fires for ALL new users (INSERT)
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
        has_had_paid_plan,
        custom_prompt_page_count,
        contact_count,
        review_notifications_enabled
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
        false,
        0,
        0,
        true
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

-- Create trigger for user confirmation updates (UPDATE)
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (NEW.confirmed_at IS NOT NULL AND OLD.confirmed_at IS NULL)
  EXECUTE FUNCTION handle_user_confirmation();