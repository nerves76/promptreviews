-- Disable all authentication-related triggers and simplify auth flow
-- This migration removes all triggers that could cause "Database error granting user"

-- =====================================================
-- DISABLE ALL AUTH TRIGGERS
-- =====================================================

-- Drop any remaining auth triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS track_user_login_trigger ON auth.users;

-- Drop trigger functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS track_user_login();

-- =====================================================
-- SIMPLIFY RLS POLICIES FOR AUTHENTICATION
-- =====================================================

-- Temporarily disable RLS on critical tables during authentication
-- This allows authentication to work without database operations

-- Disable RLS on accounts table temporarily
ALTER TABLE public.accounts DISABLE ROW LEVEL SECURITY;

-- Disable RLS on account_users table temporarily  
ALTER TABLE public.account_users DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE SIMPLE POST-AUTH ACCOUNT SETUP FUNCTION
-- =====================================================

-- Create a function to set up accounts after successful authentication
CREATE OR REPLACE FUNCTION public.setup_user_account(user_id uuid)
RETURNS void AS $$
BEGIN
    -- Create account record if it doesn't exist
    INSERT INTO public.accounts (
        id,
        plan,
        trial_start,
        trial_end,
        is_free_account,
        custom_prompt_page_count,
        contact_count
    ) VALUES (
        user_id,
        'no_plan',
        NOW(),
        NOW() + INTERVAL '14 days',
        false,
        0,
        0
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Create account_user record if it doesn't exist
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
    )
    ON CONFLICT (account_id, user_id) DO NOTHING;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION public.setup_user_account(uuid) IS 'Sets up account and account_user records for a user after successful authentication';

-- =====================================================
-- VERIFY CHANGES
-- =====================================================

-- Show that triggers are disabled
SELECT 
    'Disabled Triggers' as status,
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND trigger_schema = 'auth';

-- Show RLS status
SELECT 
    'RLS Status' as status,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('accounts', 'account_users'); 