-- Restore the working trigger that was successfully creating accounts
-- This replaces the non-working consolidated trigger

-- First drop the non-working trigger
DROP TRIGGER IF EXISTS auth_user_account_management ON auth.users;
DROP FUNCTION IF EXISTS public.handle_auth_user_change();

-- Restore the handle_new_user_account function that was working
CREATE OR REPLACE FUNCTION handle_new_user_account()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if user is confirmed (or being created with confirmation)
  IF NEW.confirmed_at IS NOT NULL OR NEW.email_confirmed_at IS NOT NULL THEN
    -- Check if account already exists to avoid duplicates
    IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = NEW.id) THEN
      -- Create account record
      INSERT INTO public.accounts (
        id,
        email,
        first_name,
        last_name,
        plan,
        trial_start,
        trial_end,
        is_free_account,
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
        NULL,  -- Don't set trial on account creation
        NULL,  -- Trial dates are set when user chooses a plan
        false,
        0,
        0,
        true,
        NOW(),
        NOW()
      );
    END IF;

    -- Check if account_users record already exists
    IF NOT EXISTS (SELECT 1 FROM public.account_users WHERE user_id = NEW.id AND account_id = NEW.id) THEN
      -- Create account_users record
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
    RAISE WARNING 'Error in handle_new_user_account: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table for both INSERT and UPDATE
-- This is the ONLY trigger that should handle account creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_account();