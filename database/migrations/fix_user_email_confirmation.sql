-- Fix user email confirmation issue
-- This script will help identify and fix the email confirmation problem

-- First, let's see all users and their confirmation status
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed'
    ELSE 'Not Confirmed'
  END as status
FROM auth.users 
ORDER BY created_at DESC;

-- To manually confirm a specific user's email, run this (replace with actual email):
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW() 
-- WHERE email = 'your-email@example.com';

-- To confirm all users who don't have email_confirmed_at set:
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW() 
-- WHERE email_confirmed_at IS NULL;

-- Check if the user exists in account_users table
SELECT 
  au.account_id,
  au.user_id,
  au.role,
  au.created_at,
  u.email,
  u.email_confirmed_at
FROM account_users au
JOIN auth.users u ON au.user_id = u.id
ORDER BY au.created_at DESC; 