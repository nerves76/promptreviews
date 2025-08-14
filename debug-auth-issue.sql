-- Debug script for auth issues
-- Run this in Supabase SQL editor to check the database state

-- 1. Check if the user exists in auth.users
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
WHERE email = 'chris@diviner.agency';

-- 2. Check if there's an account record
SELECT a.*, au.role 
FROM accounts a
LEFT JOIN account_users au ON au.account_id = a.id
WHERE a.email = 'chris@diviner.agency' 
   OR a.id IN (
     SELECT id FROM auth.users WHERE email = 'chris@diviner.agency'
   );

-- 3. Check account_users table
SELECT * FROM account_users
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'chris@diviner.agency'
);

-- 4. Check for any RLS policies that might be blocking
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('accounts', 'account_users', 'businesses')
ORDER BY tablename, policyname;

-- 5. Check if triggers exist that might be failing
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('accounts', 'account_users');