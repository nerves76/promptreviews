-- Confirm email for the user who just signed up
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email = 'nerves76@gmail.com';

-- Also confirm for the other test user
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email = 'boltro3000@gmail.com';

-- Show the updated users
SELECT id, email, email_confirmed_at, confirmed_at 
FROM auth.users 
WHERE email IN ('nerves76@gmail.com', 'boltro3000@gmail.com'); 