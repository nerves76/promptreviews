-- Direct SQL script to confirm user account bypassing broken auth service
-- Usage: Run this in Supabase SQL editor or via psql

UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'chris@diviner.agency'
  AND email_confirmed_at IS NULL;

-- Verify the update
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'chris@diviner.agency'; 