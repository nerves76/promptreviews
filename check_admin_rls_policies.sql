-- Check and fix RLS policies for admins table
-- This script will diagnose and fix admin access issues

-- First, let's check the current state of the admins table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'admins';

-- Check current RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'admins';

-- Check if there are any admin records
SELECT COUNT(*) as admin_count FROM admins;

-- Check if the current user has any admin records
SELECT 
    a.id,
    a.account_id,
    a.created_at,
    au.email
FROM admins a
LEFT JOIN auth.users au ON a.account_id = au.id
LIMIT 10;

-- Now let's create a comprehensive fix
-- First, disable RLS temporarily to see if that's the issue
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- Drop any existing problematic policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON admins;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON admins;
DROP POLICY IF EXISTS "Enable update for users based on account_id" ON admins;
DROP POLICY IF EXISTS "Enable delete for users based on account_id" ON admins;

-- Create a simple policy that allows authenticated users to read admin status
CREATE POLICY "Enable read access for authenticated users" ON admins
    FOR SELECT
    TO authenticated
    USING (true);

-- Re-enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Test the policy
SELECT 
    'RLS Policy Test' as test_name,
    COUNT(*) as admin_records_visible
FROM admins;

-- Show the final state
SELECT 
    'Final RLS State' as status,
    schemaname,
    tablename,
    rowsecurity,
    policyname,
    permissive,
    cmd
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.tablename = 'admins'; 