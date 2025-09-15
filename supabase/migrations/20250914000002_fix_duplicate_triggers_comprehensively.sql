-- Fix duplicate account creation by removing ALL conflicting triggers and functions
-- This ensures only ONE trigger handles account creation

-- Drop ALL existing auth triggers that might create accounts (must be done before dropping functions)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_clean ON auth.users;

-- Drop ALL functions that create accounts
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user_clean();
DROP FUNCTION IF EXISTS public.handle_user_confirmation();
DROP FUNCTION IF EXISTS public.handle_new_user_account();

-- Create ONE consolidated function that handles account creation properly
CREATE OR REPLACE FUNCTION public.handle_auth_user_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_should_create_account boolean := false;
BEGIN
  -- Determine if we should create an account
  IF TG_OP = 'INSERT' THEN
    -- On INSERT, always check if account needs to be created
    v_should_create_account := true;
  ELSIF TG_OP = 'UPDATE' THEN
    -- On UPDATE, only create account if user is being confirmed for the first time
    IF NEW.confirmed_at IS NOT NULL AND OLD.confirmed_at IS NULL THEN
      v_should_create_account := true;
    END IF;
  END IF;

  -- Only proceed if we should create an account
  IF v_should_create_account THEN
    -- Check if account already exists (critical to prevent duplicates)
    IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = NEW.id) THEN
      -- Create account with proper defaults
      INSERT INTO public.accounts (
        id,
        email,
        first_name,
        last_name,
        plan,
        trial_start,
        trial_end,
        is_free_account,
        has_had_paid_plan,
        custom_prompt_page_count,
        contact_count,
        review_notifications_enabled,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(COALESCE(NEW.email, ''), '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        'no_plan',
        NULL,  -- Don't set trial dates on signup
        NULL,  -- Trial dates are set when user chooses a paid plan
        false,
        false,
        0,
        0,
        true,
        NOW(),
        NOW()
      );
    END IF;

    -- Ensure account_users link exists (also check for duplicates)
    IF NOT EXISTS (
      SELECT 1 FROM public.account_users
      WHERE user_id = NEW.id AND account_id = NEW.id
    ) THEN
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
      );
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If we hit a unique constraint, that's fine - account already exists
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't block authentication
    RAISE WARNING 'Error in handle_auth_user_change: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create a SINGLE trigger that handles both INSERT and UPDATE
CREATE TRIGGER auth_user_account_management
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_change();

-- Add comment to document this is the only trigger
COMMENT ON FUNCTION public.handle_auth_user_change() IS
  'Consolidated function for account creation - handles both new signups and email confirmations with duplicate prevention';