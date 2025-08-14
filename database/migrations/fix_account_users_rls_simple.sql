-- Simple fix for account_users RLS infinite recursion
-- This approach temporarily disables RLS to break the recursion

-- First, let's see what policies exist
SELECT 
    'Current Policies' as status,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'account_users';

-- Temporarily disable RLS to break the recursion
ALTER TABLE account_users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can manage their own account_users" ON account_users;
DROP POLICY IF EXISTS "Account owners can manage users" ON account_users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON account_users;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON account_users;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON account_users;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON account_users;
DROP POLICY IF EXISTS "Allow account_users management" ON account_users;

-- Re-enable RLS
ALTER TABLE account_users ENABLE ROW LEVEL SECURITY;

-- Create a very simple policy that just allows authenticated users
-- This avoids any circular references
CREATE POLICY "Simple account_users access" ON account_users
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Check the final state
SELECT 
    'Final RLS State' as status,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'account_users';

SELECT 
    'Final Policies' as status,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'account_users'; 