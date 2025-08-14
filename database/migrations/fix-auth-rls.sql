-- Temporarily disable RLS on critical tables to fix authentication issues
-- This script disables RLS on accounts and account_users tables to allow authentication to work

-- Disable RLS on accounts table
ALTER TABLE public.accounts DISABLE ROW LEVEL SECURITY;

-- Disable RLS on account_users table  
ALTER TABLE public.account_users DISABLE ROW LEVEL SECURITY;

-- Verify the changes
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('accounts', 'account_users')
AND schemaname = 'public'; 