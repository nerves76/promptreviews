-- Fix RLS for Development
-- This script temporarily disables RLS on critical tables to allow account creation
-- during local development when JWT signature issues occur

-- Disable RLS on accounts table
ALTER TABLE public.accounts DISABLE ROW LEVEL SECURITY;

-- Disable RLS on account_users table  
ALTER TABLE public.account_users DISABLE ROW LEVEL SECURITY;

-- Disable RLS on businesses table
ALTER TABLE public.businesses DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('accounts', 'account_users', 'businesses')
  AND schemaname = 'public';

-- Show current RLS policies (if any)
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
WHERE tablename IN ('accounts', 'account_users', 'businesses')
  AND schemaname = 'public';

-- Note: This is a temporary fix for development only
-- In production, proper RLS policies should be enabled 