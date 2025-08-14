-- Manually confirm user email for chris@MurmurCreative
-- This script will confirm the email for the user who is having issues

-- First, let's see the current status of the user
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
WHERE email = 'chris@MurmurCreative.com'
ORDER BY created_at DESC;

-- Manually confirm the email for chris@MurmurCreative.com
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'chris@MurmurCreative.com' 
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
WHERE email = 'chris@MurmurCreative.com'
ORDER BY created_at DESC;

-- Also check if there are any other users with similar emails
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
WHERE email LIKE '%chris%' OR email LIKE '%MurmurCreative%'
ORDER BY created_at DESC; 