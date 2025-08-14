-- Fix infinite recursion in account_users RLS policies
-- This script will diagnose and fix the circular dependency issue

-- First, let's check the current RLS policies on account_users
SELECT 
    'Current account_users RLS Policies' as check_type,
    p.schemaname,
    p.tablename,
    p.policyname,
    p.permissive,
    p.roles,
    p.cmd,
    p.qual,
    p.with_check
FROM pg_policies p
WHERE p.tablename = 'account_users';

-- Check if RLS is enabled on account_users
SELECT 
    'account_users RLS Status' as check_type,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'account_users';

-- The issue is that the RLS policy is trying to check account_users
-- while inserting into account_users, creating infinite recursion

-- Let's drop all existing policies and create a simple one
DROP POLICY IF EXISTS "Users can manage their own account_users" ON account_users;
DROP POLICY IF EXISTS "Account owners can manage users" ON account_users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON account_users;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON account_users;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON account_users;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON account_users;
DROP POLICY IF EXISTS "Allow account_users management" ON account_users;

-- Create a simple policy that allows authenticated users to manage their own records
-- This avoids the circular dependency by only checking the user_id
CREATE POLICY "Allow account_users management" ON account_users
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Test the policies
SELECT 
    'Updated account_users RLS Policies' as check_type,
    p.schemaname,
    p.tablename,
    p.policyname,
    p.permissive,
    p.roles,
    p.cmd,
    p.qual,
    p.with_check
FROM pg_policies p
WHERE p.tablename = 'account_users';

-- Show final state
SELECT 
    'Final account_users RLS State' as status,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'account_users'; 