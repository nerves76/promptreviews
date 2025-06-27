-- Script to manually confirm a user's email
-- Replace 'user_email@example.com' with the actual email address

-- First, let's see the current status of the user
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 'user_email@example.com';

-- To manually confirm the email, run this (replace with actual user ID):
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW() 
-- WHERE email = 'user_email@example.com';

-- To see all users and their confirmation status:
-- SELECT 
--   id,
--   email,
--   email_confirmed_at,
--   created_at,
--   last_sign_in_at
-- FROM auth.users 
-- ORDER BY created_at DESC; 