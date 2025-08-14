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

-- Check if the user already has admin privileges
SELECT 
    'Checking Existing Admin Record' as info,
    a.id,
    a.account_id,
    a.created_at,
    au.email
FROM admins a
LEFT JOIN auth.users au ON a.account_id = au.id
WHERE a.account_id = '5b001922-ca54-4aec-b4ea-581a9515984e';

-- Add admin privileges for chris@murmurcreative.com
-- Using the user ID: 5b001922-ca54-4aec-b4ea-581a9515984e
-- Only insert if the record doesn't already exist
INSERT INTO admins (account_id, created_at)
SELECT '5b001922-ca54-4aec-b4ea-581a9515984e', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM admins 
    WHERE account_id = '5b001922-ca54-4aec-b4ea-581a9515984e'
);

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

-- Show final admin records count
SELECT 
    'Final Admin Records Count' as info,
    COUNT(*) as total_admins
FROM admins; 