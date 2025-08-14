-- Immediate fix for admin RLS issues
-- This script will disable RLS temporarily and then create proper policies

-- First, let's see the current state
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'admins';

-- Check current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'admins';

-- Temporarily disable RLS on admins table to fix immediate issue
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- Drop any existing problematic policies
DROP POLICY IF EXISTS "Users can check their own admin status" ON admins;
DROP POLICY IF EXISTS "Enable read access for all users" ON admins;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON admins;
DROP POLICY IF EXISTS "Enable update for users based on account_id" ON admins;
DROP POLICY IF EXISTS "Enable delete for users based on account_id" ON admins;

-- Create a simple policy that allows all authenticated users to read admin status
CREATE POLICY "Allow authenticated users to read admin status" ON admins
FOR SELECT USING (auth.role() = 'authenticated');

-- Re-enable RLS with the new policy
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Verify the fix
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'admins';

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'admins';

-- Test the admin check
-- This should now work without errors
SELECT 
  id,
  account_id,
  created_at
FROM admins
WHERE account_id = auth.uid()
LIMIT 1; 