-- Confirm email for any user in the local database
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Show all users and their confirmation status
SELECT id, email, email_confirmed_at, confirmed_at, created_at
FROM auth.users 
ORDER BY created_at DESC; 