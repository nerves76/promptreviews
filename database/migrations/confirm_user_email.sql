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

-- Manually confirm email for boltro3000@gmail.com or nerves76@gmail.com
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email IN ('boltro3000@gmail.com', 'nerves76@gmail.com');

-- Also update the confirmation token to be used
UPDATE auth.users 
SET confirmation_token = NULL,
    updated_at = NOW()
WHERE email IN ('boltro3000@gmail.com', 'nerves76@gmail.com');

-- Check if the user exists and show the result
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at
FROM auth.users 
WHERE email IN ('boltro3000@gmail.com', 'nerves76@gmail.com'); 