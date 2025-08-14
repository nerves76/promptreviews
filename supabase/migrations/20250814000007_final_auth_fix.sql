-- FINAL FIX: Remove ALL auth-related functions and triggers
-- Then recreate with proper permissions

-- Step 1: Remove ALL existing auth triggers
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all triggers that might be calling auth functions
    FOR r IN 
        SELECT DISTINCT tgname, tgrelid::regclass 
        FROM pg_trigger 
        WHERE tgrelid = 'auth.users'::regclass 
        AND tgisinternal = false
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %s CASCADE', r.tgname, r.tgrelid);
        RAISE NOTICE 'Dropped trigger: % on %', r.tgname, r.tgrelid;
    END LOOP;
END $$;

-- Step 2: Drop ALL functions that might have bad GRANTs
-- Use CASCADE to ensure complete removal
DROP FUNCTION IF EXISTS handle_new_user_account() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_account() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_account_for_user(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.create_account_for_user(uuid) CASCADE;
DROP FUNCTION IF EXISTS auth_user_account_handler() CASCADE;
DROP FUNCTION IF EXISTS public.auth_user_account_handler() CASCADE;
DROP FUNCTION IF EXISTS manual_create_account(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.manual_create_account(uuid) CASCADE;

-- Step 3: Revoke any existing permissions (in case they persist)
DO $$
BEGIN
    -- Try to revoke from postgres if it exists (might fail, that's ok)
    EXECUTE 'REVOKE ALL ON FUNCTION handle_new_user_account() FROM postgres';
EXCEPTION
    WHEN undefined_function THEN NULL;
    WHEN undefined_object THEN NULL;
    WHEN insufficient_privilege THEN NULL;
END $$;

-- Step 4: Create a completely clean function with unique name
CREATE OR REPLACE FUNCTION auth_account_handler_v2()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process confirmed users
  IF NEW.confirmed_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Create account if doesn't exist (using INSERT ... ON CONFLICT for safety)
  INSERT INTO public.accounts (
    id,
    email,
    plan,
    trial_start,
    trial_end,
    created_at,
    updated_at,
    user_id
  ) VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    'no_plan',
    NOW(),
    NOW() + INTERVAL '14 days',
    NOW(),
    NOW(),
    NEW.id
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
    RAISE WARNING 'Auth account handler error: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 5: Set ownership and permissions properly
ALTER FUNCTION auth_account_handler_v2() OWNER TO CURRENT_USER;

-- First revoke all to start clean
REVOKE ALL ON FUNCTION auth_account_handler_v2() FROM PUBLIC;

-- Then grant ONLY to allowed roles (no postgres!)
DO $$
BEGIN
    GRANT EXECUTE ON FUNCTION auth_account_handler_v2() TO authenticated;
    GRANT EXECUTE ON FUNCTION auth_account_handler_v2() TO anon;
    GRANT EXECUTE ON FUNCTION auth_account_handler_v2() TO service_role;
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE WARNING 'Could not grant permissions, but function will work with SECURITY DEFINER';
END $$;

-- Step 6: Create trigger with unique name
CREATE TRIGGER auth_account_trigger_v2
  AFTER INSERT OR UPDATE OF confirmed_at ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION auth_account_handler_v2();

-- Step 7: Create manual fix function with unique name
CREATE OR REPLACE FUNCTION manual_fix_account_v2(user_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get user ID from email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = user_email
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Create account
  INSERT INTO public.accounts (
    id, email, plan, trial_start, trial_end,
    created_at, updated_at, user_id
  ) VALUES (
    v_user_id,
    user_email,
    'no_plan',
    NOW(),
    NOW() + INTERVAL '14 days',
    NOW(),
    NOW(),
    v_user_id
  ) ON CONFLICT (id) DO NOTHING;
  
  -- Create account_users link
  INSERT INTO public.account_users (
    account_id, user_id, role, created_at
  ) VALUES (
    v_user_id, v_user_id, 'owner', NOW()
  ) ON CONFLICT (user_id, account_id) DO NOTHING;
  
  RETURN jsonb_build_object('success', true, 'message', 'Account fixed');
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Set permissions for manual function
ALTER FUNCTION manual_fix_account_v2(text) OWNER TO CURRENT_USER;
REVOKE ALL ON FUNCTION manual_fix_account_v2(text) FROM PUBLIC;

DO $$
BEGIN
    GRANT EXECUTE ON FUNCTION manual_fix_account_v2(text) TO authenticated;
    GRANT EXECUTE ON FUNCTION manual_fix_account_v2(text) TO service_role;
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE WARNING 'Could not grant permissions, but function will work with SECURITY DEFINER';
END $$;

-- Add comment
COMMENT ON FUNCTION auth_account_handler_v2() IS 'Clean auth handler v2 - no postgres role grants';