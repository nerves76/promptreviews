-- Temporarily disable RLS on critical tables to fix authentication issues
-- This migration disables RLS on accounts and account_users tables to allow authentication to work

-- Disable RLS on accounts table
ALTER TABLE public.accounts DISABLE ROW LEVEL SECURITY;

-- Disable RLS on account_users table  
ALTER TABLE public.account_users DISABLE ROW LEVEL SECURITY; 