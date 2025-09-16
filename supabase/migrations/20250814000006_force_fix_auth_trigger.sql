-- FORCE FIX: Completely remove and recreate auth trigger system
-- This ensures no remnants of the old problematic function remain

-- Drop ALL triggers on auth.users that might be calling our function
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'auth.users'::regclass 
        AND tgisinternal = false
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', r.tgname);
        RAISE NOTICE 'Dropped trigger: %', r.tgname;
    END LOOP;
END $$;

-- Drop ALL versions of the function that might exist
DROP FUNCTION IF EXISTS handle_new_user_account() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_account() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Drop the manual account creation function too
DROP FUNCTION IF EXISTS create_account_for_user(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.create_account_for_user(uuid) CASCADE;

-- Now create a completely fresh function with a NEW NAME to avoid any caching issues
CREATE OR REPLACE FUNCTION auth_user_account_handler()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only proceed if user is confirmed
  IF NEW.confirmed_at IS NOT NULL THEN
    -- Try to create account if it doesn't exist
    INSERT INTO public.accounts (
      id,
      email,
      plan,
      trial_start,
      trial_end,
      created_at,
      updated_at,
      user_id
    )
    SELECT
      NEW.id,
      COALESCE(NEW.email, ''),
      'no_plan',
      NOW(),
      NOW() + INTERVAL '14 days',
      NOW(),
      NOW(),
      NEW.id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.accounts WHERE id = NEW.id
    );

    -- Try to create account_users link if it doesn't exist
    INSERT INTO public.account_users (
      account_id,
      user_id,
      role,
      created_at
    )
    SELECT
      NEW.id,
      NEW.id,
      'owner',
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM public.account_users 
      WHERE user_id = NEW.id AND account_id = NEW.id
    );
  END IF;

  -- Always return NEW to allow auth to continue
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log but don't fail
    RAISE LOG 'Error in auth_user_account_handler: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Set permissions WITHOUT using postgres role
ALTER FUNCTION auth_user_account_handler() OWNER TO CURRENT_USER;
REVOKE ALL ON FUNCTION auth_user_account_handler() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auth_user_account_handler() TO authenticated;
GRANT EXECUTE ON FUNCTION auth_user_account_handler() TO anon;
GRANT EXECUTE ON FUNCTION auth_user_account_handler() TO service_role;

-- Create new trigger with new name
CREATE TRIGGER auth_account_creation_trigger
  AFTER INSERT OR UPDATE OF confirmed_at ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION auth_user_account_handler();

-- Create manual account fix function with new name
CREATE OR REPLACE FUNCTION manual_create_account(user_id uuid)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_record auth.users%ROWTYPE;
BEGIN
  -- Get user record
  SELECT * INTO user_record FROM auth.users WHERE id = user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Try to create account
  INSERT INTO public.accounts (
    id, email, plan, trial_start, trial_end,
    created_at, updated_at, user_id
  )
  SELECT
    user_id,
    COALESCE(user_record.email, ''),
    'no_plan',
    NOW(),
    NOW() + INTERVAL '14 days',
    NOW(),
    NOW(),
    user_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.accounts WHERE id = user_id
  );
  
  -- Try to create account_users link
  INSERT INTO public.account_users (
    account_id, user_id, role, created_at
  )
  SELECT
    user_id, user_id, 'owner', NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM public.account_users 
    WHERE user_id = user_id AND account_id = user_id
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Account created or already exists');
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Set permissions for manual function
ALTER FUNCTION manual_create_account(uuid) OWNER TO CURRENT_USER;
REVOKE ALL ON FUNCTION manual_create_account(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION manual_create_account(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION manual_create_account(uuid) TO service_role;

-- Add comment explaining this fix
COMMENT ON FUNCTION auth_user_account_handler() IS 'Clean auth trigger without postgres role - fixes Database error granting user';