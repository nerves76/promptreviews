-- Manually confirm user email based on the database output
-- This script will confirm the email for the user who is having issues

-- First, let's see the current status
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed'
    ELSE 'Not Confirmed'
  END as status
FROM auth.users 
WHERE email IN ('nerves76@gmail.com', 'boltro3000@gmail.com')
ORDER BY created_at DESC;

-- Manually confirm the email for nerves76@gmail.com (if not already confirmed)
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'nerves76@gmail.com' 
AND email_confirmed_at IS NULL;

-- Manually confirm the email for boltro3000@gmail.com (if not already confirmed)
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'boltro3000@gmail.com' 
AND email_confirmed_at IS NULL;

-- Verify the changes
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed'
    ELSE 'Not Confirmed'
  END as status
FROM auth.users 
WHERE email IN ('nerves76@gmail.com', 'boltro3000@gmail.com')
ORDER BY created_at DESC; 