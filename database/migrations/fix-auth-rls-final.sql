-- Fix authentication issues by re-enabling RLS with proper policies
-- This script re-enables RLS on critical tables with policies that allow authentication to work

-- =====================================================
-- RE-ENABLE RLS ON ACCOUNTS TABLE
-- =====================================================

-- Enable RLS on accounts table
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view their own account" ON public.accounts;
DROP POLICY IF EXISTS "Users can update their own account" ON public.accounts;
DROP POLICY IF EXISTS "Service role can access all accounts" ON public.accounts;

-- Create proper RLS policies for accounts table
-- Allow users to view their own account
CREATE POLICY "Users can view their own account" ON public.accounts
    FOR SELECT USING (id = auth.uid());

-- Allow users to update their own account
CREATE POLICY "Users can update their own account" ON public.accounts
    FOR UPDATE USING (id = auth.uid());

-- Allow service role to access all accounts (for authentication)
CREATE POLICY "Service role can access all accounts" ON public.accounts
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- RE-ENABLE RLS ON ACCOUNT_USERS TABLE
-- =====================================================

-- Enable RLS on account_users table
ALTER TABLE public.account_users ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view their own account_user records" ON public.account_users;
DROP POLICY IF EXISTS "Users can update their own account_user records" ON public.account_users;
DROP POLICY IF EXISTS "Service role can access all account_users" ON public.account_users;

-- Create proper RLS policies for account_users table
-- Allow users to view their own account_user records
CREATE POLICY "Users can view their own account_user records" ON public.account_users
    FOR SELECT USING (user_id = auth.uid());

-- Allow users to update their own account_user records
CREATE POLICY "Users can update their own account_user records" ON public.account_users
    FOR UPDATE USING (user_id = auth.uid());

-- Allow service role to access all account_users (for authentication)
CREATE POLICY "Service role can access all account_users" ON public.account_users
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- VERIFY CHANGES
-- =====================================================

-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('accounts', 'account_users')
AND schemaname = 'public';

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('accounts', 'account_users')
AND schemaname = 'public'; 