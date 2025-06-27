-- Add admin privileges for a user
-- This script will add an admin record for the specified user

-- First, let's see the current admin records
SELECT 
    'Current Admin Records' as info,
    a.id,
    a.account_id,
    a.created_at,
    au.email
FROM admins a
LEFT JOIN auth.users au ON a.account_id = au.id
ORDER BY a.created_at DESC;

-- Add admin privileges for chris@murmurcreative.com
-- Using the user ID: 5b001922-ca54-4aec-b4ea-581a9515984e
INSERT INTO admins (account_id, created_at)
VALUES ('5b001922-ca54-4aec-b4ea-581a9515984e', NOW())
ON CONFLICT (account_id) DO NOTHING;

-- Verify the admin record was created
SELECT 
    'New Admin Record' as info,
    a.id,
    a.account_id,
    a.created_at,
    au.email
FROM admins a
LEFT JOIN auth.users au ON a.account_id = au.id
WHERE a.account_id = '5b001922-ca54-4aec-b4ea-581a9515984e';

-- Show all admin records after the change
SELECT 
    'All Admin Records After Change' as info,
    a.id,
    a.account_id,
    a.created_at,
    au.email
FROM admins a
LEFT JOIN auth.users au ON a.account_id = au.id
ORDER BY a.created_at DESC; 