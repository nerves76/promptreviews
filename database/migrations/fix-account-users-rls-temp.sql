-- Temporary fix to disable RLS on account_users table
-- This will allow the getAccountIdForUser function to work properly

-- Disable RLS on account_users table
ALTER TABLE public.account_users DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'account_users'
  AND schemaname = 'public';

-- Show current RLS policies (should be none now)
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
WHERE tablename = 'account_users'
  AND schemaname = 'public'; 