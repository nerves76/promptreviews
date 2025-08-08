-- Apply account creation fix directly
-- Run this in Supabase SQL Editor if migrations won't apply

-- First check if the function already exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user_account') THEN
    RAISE NOTICE 'Function handle_new_user_account already exists, dropping...';
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    DROP FUNCTION IF EXISTS handle_new_user_account();
  END IF;
END $$;

-- Now apply the fix from migration 0201
-- Fix account creation trigger with better error handling and RLS bypass

-- Create improved function with error handling
CREATE OR REPLACE FUNCTION handle_new_user_account()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  account_exists boolean;
BEGIN
  -- Log the trigger execution
  RAISE LOG 'handle_new_user_account triggered for user %', NEW.id;

  -- Only proceed if user is confirmed
  IF NEW.confirmed_at IS NOT NULL THEN
    -- Check if account already exists
    SELECT EXISTS(SELECT 1 FROM public.accounts WHERE id = NEW.id) INTO account_exists;
    
    IF NOT account_exists THEN
      BEGIN
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
          updated_at,
          has_seen_welcome,
          user_id
        ) VALUES (
          NEW.id,
          COALESCE(NEW.email, ''),
          COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(COALESCE(NEW.email, ''), '@', 1)),
          COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
          'no_plan',
          NOW(),
          NOW() + INTERVAL '14 days',
          false,
          0,
          0,
          true,
          NOW(),
          NOW(),
          false,
          NEW.id
        );
        
        RAISE LOG 'Account created successfully for user %', NEW.id;
      EXCEPTION
        WHEN OTHERS THEN
          -- Log the error but don't fail the trigger
          RAISE LOG 'Error creating account for user %: % %', NEW.id, SQLERRM, SQLSTATE;
      END;
    END IF;

    -- Check if account_users record exists
    IF NOT EXISTS (SELECT 1 FROM public.account_users WHERE user_id = NEW.id AND account_id = NEW.id) THEN
      BEGIN
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
        
        RAISE LOG 'Account user link created successfully for user %', NEW.id;
      EXCEPTION
        WHEN OTHERS THEN
          -- Log the error but don't fail the trigger
          RAISE LOG 'Error creating account_users for user %: % %', NEW.id, SQLERRM, SQLSTATE;
      END;
    END IF;
  END IF;

  -- Always return NEW to allow the auth operation to continue
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log any unexpected errors but don't fail
    RAISE LOG 'Unexpected error in handle_new_user_account for user %: % %', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to the function
GRANT EXECUTE ON FUNCTION handle_new_user_account() TO postgres, authenticated, anon, service_role;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE OF confirmed_at ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user_account();

-- Create backup function
CREATE OR REPLACE FUNCTION create_account_for_user(user_id uuid)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record auth.users%ROWTYPE;
  result jsonb;
BEGIN
  -- Get user record
  SELECT * INTO user_record FROM auth.users WHERE id = user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Check if account already exists
  IF EXISTS (SELECT 1 FROM public.accounts WHERE id = user_id) THEN
    RETURN jsonb_build_object('success', true, 'message', 'Account already exists');
  END IF;
  
  -- Create account
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
    updated_at,
    has_seen_welcome,
    user_id
  ) VALUES (
    user_id,
    COALESCE(user_record.email, ''),
    COALESCE(user_record.raw_user_meta_data->>'first_name', split_part(COALESCE(user_record.email, ''), '@', 1)),
    COALESCE(user_record.raw_user_meta_data->>'last_name', ''),
    'no_plan',
    NOW(),
    NOW() + INTERVAL '14 days',
    false,
    0,
    0,
    true,
    NOW(),
    NOW(),
    false,
    user_id
  );
  
  -- Create account_users link
  IF NOT EXISTS (SELECT 1 FROM public.account_users WHERE user_id = user_id AND account_id = user_id) THEN
    INSERT INTO public.account_users (
      account_id,
      user_id,
      role,
      created_at
    ) VALUES (
      user_id,
      user_id,
      'owner',
      NOW()
    );
  END IF;
  
  RETURN jsonb_build_object('success', true, 'message', 'Account created successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_account_for_user(uuid) TO authenticated, service_role;

-- Test the function exists
SELECT 'Functions created successfully' as status;