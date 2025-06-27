-- Fix account user upsert and admin check issues
-- This script addresses the empty error objects in the console

-- First, let's check the current state of account_users table
SELECT 
  au.account_id,
  au.user_id,
  au.role,
  au.created_at,
  u.email
FROM account_users au
JOIN auth.users u ON au.user_id = u.id
ORDER BY au.created_at DESC;

-- Check if admins table exists and has data
SELECT 
  id,
  account_id,
  created_at
FROM admins
ORDER BY created_at DESC;

-- Check RLS policies on account_users table
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
WHERE tablename = 'account_users';

-- Check RLS policies on admins table
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

-- Ensure account_users table has proper RLS policies
-- First, let's see if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('account_users', 'admins');

-- If RLS is causing issues, we can temporarily disable it for testing
-- ALTER TABLE account_users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- Or create proper RLS policies that allow the operations
-- This policy allows users to insert/update their own account_user records
CREATE POLICY IF NOT EXISTS "Users can manage their own account_user records" ON account_users
FOR ALL USING (auth.uid() = user_id);

-- This policy allows users to read account_user records they're part of
CREATE POLICY IF NOT EXISTS "Users can read their account_user records" ON account_users
FOR SELECT USING (auth.uid() = user_id);

-- This policy allows admins to read all account_user records
CREATE POLICY IF NOT EXISTS "Admins can read all account_user records" ON account_users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM admins WHERE account_id = auth.uid()
  )
);

-- For the admins table, allow users to check if they are admins
CREATE POLICY IF NOT EXISTS "Users can check their own admin status" ON admins
FOR SELECT USING (auth.uid() = account_id);

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('account_users', 'admins')
ORDER BY tablename, policyname; 