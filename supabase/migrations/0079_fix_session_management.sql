-- Fix session management and prevent user deletion issues
-- This migration ensures proper auth configuration and removes any problematic triggers

-- =====================================================
-- ENSURE AUTH TRIGGERS ARE DISABLED
-- =====================================================

-- Double-check that all auth triggers are disabled
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS track_user_login_trigger ON auth.users;

-- Drop any remaining trigger functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS track_user_login();

-- =====================================================
-- VERIFY RLS POLICIES ARE CORRECT
-- =====================================================

-- Ensure accounts table has proper RLS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Ensure account_users table has proper RLS
ALTER TABLE public.account_users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE SESSION MONITORING FUNCTION
-- =====================================================

-- Create a function to monitor active sessions (for debugging)
CREATE OR REPLACE FUNCTION public.get_active_sessions()
RETURNS TABLE (
    user_id uuid,
    email text,
    last_sign_in timestamp with time zone,
    created_at timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.email,
        au.last_sign_in_at,
        au.created_at
    FROM auth.users au
    WHERE au.confirmed_at IS NOT NULL
    ORDER BY au.last_sign_in_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION public.get_active_sessions() IS 'Returns active user sessions for debugging session issues';

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