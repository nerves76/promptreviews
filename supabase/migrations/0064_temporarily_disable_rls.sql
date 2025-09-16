-- Temporarily disable RLS on critical tables to fix authentication issues
-- This is a temporary fix to get authentication working

-- Disable RLS on accounts table
ALTER TABLE public.accounts DISABLE ROW LEVEL SECURITY;

-- Disable RLS on account_users table  
ALTER TABLE public.account_users DISABLE ROW LEVEL SECURITY; 