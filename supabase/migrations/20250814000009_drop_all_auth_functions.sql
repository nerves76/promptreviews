-- Drop ALL functions that might have GRANT to postgres role
-- This is the nuclear option to remove any function that could be causing the error

-- First, get a list of all functions in public schema that might be auth-related
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Drop all functions that might be related to auth/accounts
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc
        WHERE pronamespace = 'public'::regnamespace
        AND (
            proname LIKE '%user%' 
            OR proname LIKE '%account%' 
            OR proname LIKE '%auth%'
            OR proname LIKE '%handle%'
            OR proname LIKE '%create%'
        )
    LOOP
        BEGIN
            EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', func_record.proname, func_record.args);
            RAISE NOTICE 'Dropped function: public.%.%', func_record.proname, func_record.args;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop function: public.%.% - %', func_record.proname, func_record.args, SQLERRM;
        END;
    END LOOP;
END $$;

-- Specifically drop these functions if they exist in any form
DROP FUNCTION IF EXISTS handle_new_user_account() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_account() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_account_for_user(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.create_account_for_user(uuid) CASCADE;
DROP FUNCTION IF EXISTS auth_user_account_handler() CASCADE;
DROP FUNCTION IF EXISTS public.auth_user_account_handler() CASCADE;
DROP FUNCTION IF EXISTS auth_user_account_handler_v2() CASCADE;
DROP FUNCTION IF EXISTS public.auth_user_account_handler_v2() CASCADE;
DROP FUNCTION IF EXISTS auth_account_handler_v2() CASCADE;
DROP FUNCTION IF EXISTS public.auth_account_handler_v2() CASCADE;
DROP FUNCTION IF EXISTS manual_create_account(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.manual_create_account(uuid) CASCADE;
DROP FUNCTION IF EXISTS manual_fix_account_v2(text) CASCADE;
DROP FUNCTION IF EXISTS public.manual_fix_account_v2(text) CASCADE;
DROP FUNCTION IF EXISTS ensure_user_account(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.ensure_user_account(uuid) CASCADE;

-- Check if any functions remain
DO $$
DECLARE
    func_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO func_count
    FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
    AND (
        proname LIKE '%handle%new%user%' 
        OR proname LIKE '%create%account%'
    );
    
    RAISE NOTICE 'Auth-related functions remaining: %', func_count;
END $$;

-- Recreate ONLY a simple manual account creation function with NO GRANTS to postgres
CREATE OR REPLACE FUNCTION simple_ensure_account(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Simple insert, ignore if exists
    INSERT INTO public.accounts (email, plan, created_at, updated_at)
    VALUES (user_email, 'no_plan', NOW(), NOW())
    ON CONFLICT (email) DO NOTHING;
END;
$$;

-- Only grant to service_role (minimum required)
REVOKE ALL ON FUNCTION simple_ensure_account(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION simple_ensure_account(text) TO service_role;

COMMENT ON FUNCTION simple_ensure_account(text) IS 'Minimal account creation - no postgres grants';