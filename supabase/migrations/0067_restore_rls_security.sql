-- =====================================================
-- RESTORE ROW LEVEL SECURITY - CRITICAL FIX
-- =====================================================
-- This migration re-enables RLS with proper security policies
-- to prevent unauthorized access to account data

-- =====================================================
-- RE-ENABLE RLS ON ACCOUNTS TABLE
-- =====================================================

-- Enable RLS on accounts table
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own account" ON public.accounts;
DROP POLICY IF EXISTS "Users can update their own account" ON public.accounts;
DROP POLICY IF EXISTS "Users can insert their own account" ON public.accounts;
DROP POLICY IF EXISTS "Service role can access all accounts" ON public.accounts;
DROP POLICY IF EXISTS "Allow account owner full access" ON public.accounts;

-- Create secure RLS policies for accounts table
-- Policy 1: Users can only view their own account
CREATE POLICY "Users can view their own account" ON public.accounts
    FOR SELECT USING (id = auth.uid());

-- Policy 2: Users can only update their own account
CREATE POLICY "Users can update their own account" ON public.accounts
    FOR UPDATE USING (id = auth.uid());

-- Policy 3: Users can only insert their own account (during signup)
CREATE POLICY "Users can insert their own account" ON public.accounts
    FOR INSERT WITH CHECK (id = auth.uid());

-- Policy 4: Service role can access all accounts (for admin operations)
CREATE POLICY "Service role can access all accounts" ON public.accounts
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- RE-ENABLE RLS ON ACCOUNT_USERS TABLE
-- =====================================================

-- Enable RLS on account_users table
ALTER TABLE public.account_users ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own account_user records" ON public.account_users;
DROP POLICY IF EXISTS "Users can update their own account_user records" ON public.account_users;
DROP POLICY IF EXISTS "Users can insert their own account_user records" ON public.account_users;
DROP POLICY IF EXISTS "Service role can access all account_users" ON public.account_users;
DROP POLICY IF EXISTS "Account owners can manage their account users" ON public.account_users;

-- Create secure RLS policies for account_users table
-- Policy 1: Users can view account_user records where they are the user OR the account owner
CREATE POLICY "Users can view their account_user records" ON public.account_users
    FOR SELECT USING (
        user_id = auth.uid() OR 
        account_id = auth.uid()
    );

-- Policy 2: Account owners can update account_user records for their account
CREATE POLICY "Account owners can update their account users" ON public.account_users
    FOR UPDATE USING (account_id = auth.uid());

-- Policy 3: Users can insert account_user records for their own account
CREATE POLICY "Users can insert their own account_user records" ON public.account_users
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR 
        account_id = auth.uid()
    );

-- Policy 4: Service role can access all account_users (for admin operations)
CREATE POLICY "Service role can access all account_users" ON public.account_users
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- VERIFY RLS POLICIES ARE WORKING
-- =====================================================

-- Function to test RLS policies (admin use only)
CREATE OR REPLACE FUNCTION public.test_rls_policies()
RETURNS TABLE(
    test_name text,
    table_name text,
    rls_enabled boolean,
    policy_count integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'RLS Status Check'::text as test_name,
        t.tablename::text as table_name,
        t.rowsecurity as rls_enabled,
        COUNT(p.policyname)::integer as policy_count
    FROM pg_tables t
    LEFT JOIN pg_policies p ON p.tablename = t.tablename
    WHERE t.tablename IN ('accounts', 'account_users')
    AND t.schemaname = 'public'
    GROUP BY t.tablename, t.rowsecurity
    ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment explaining the security model
COMMENT ON FUNCTION public.test_rls_policies() IS 'Tests that RLS policies are properly configured - for admin use only';

-- =====================================================
-- UPDATE ACCOUNT SETUP FUNCTION FOR RLS COMPATIBILITY
-- =====================================================

-- Update the account setup function to work with RLS
CREATE OR REPLACE FUNCTION public.setup_user_account(user_id uuid)
RETURNS void AS $$
BEGIN
    -- This function runs with SECURITY DEFINER privileges
    -- so it can bypass RLS for account creation
    
    -- Create account record if it doesn't exist
    INSERT INTO public.accounts (
        id,
        plan,
        trial_start,
        trial_end,
        is_free_account,
        custom_prompt_page_count,
        contact_count,
        created_at
    ) VALUES (
        user_id,
        'grower',
        NOW(),
        NOW() + INTERVAL '14 days',
        false,
        0,
        0,
        NOW()
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
    
    -- Log account creation for security audit
    INSERT INTO public.debug_errors (error_text, created_at) 
    VALUES ('Account setup completed for user: ' || user_id::text, NOW());
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update comment
COMMENT ON FUNCTION public.setup_user_account(uuid) IS 'Sets up account and account_user records with proper RLS security - runs with elevated privileges';

-- =====================================================
-- SECURITY VERIFICATION
-- =====================================================

-- Verify RLS is enabled
DO $$
DECLARE
    accounts_rls boolean;
    account_users_rls boolean;
BEGIN
    -- Check accounts table RLS
    SELECT rowsecurity INTO accounts_rls 
    FROM pg_tables 
    WHERE tablename = 'accounts' AND schemaname = 'public';
    
    -- Check account_users table RLS
    SELECT rowsecurity INTO account_users_rls 
    FROM pg_tables 
    WHERE tablename = 'account_users' AND schemaname = 'public';
    
    -- Verify both tables have RLS enabled
    IF NOT accounts_rls OR NOT account_users_rls THEN
        RAISE EXCEPTION 'CRITICAL: RLS not properly enabled on authentication tables';
    END IF;
    
    -- Log successful RLS restoration
    INSERT INTO public.debug_errors (error_text, created_at) 
    VALUES ('RLS security successfully restored on authentication tables', NOW());
END;
$$;

-- =====================================================
-- GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Ensure authenticated users can execute the account setup function
GRANT EXECUTE ON FUNCTION public.setup_user_account(uuid) TO authenticated;

-- Ensure admins can test RLS policies
GRANT EXECUTE ON FUNCTION public.test_rls_policies() TO authenticated;

-- Final verification message
SELECT 
    'RLS Security Restored' as status,
    'accounts: ' || (SELECT rowsecurity FROM pg_tables WHERE tablename = 'accounts' AND schemaname = 'public') as accounts_rls,
    'account_users: ' || (SELECT rowsecurity FROM pg_tables WHERE tablename = 'account_users' AND schemaname = 'public') as account_users_rls,
    'Policies created: ' || COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('accounts', 'account_users')
GROUP BY 1, 2, 3;