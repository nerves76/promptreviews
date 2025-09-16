-- Fix Admin Accounts Migration
-- This script handles existing admin users who don't have accounts in the account_users table

-- Step 1: Create accounts for admin users who don't have them
INSERT INTO accounts (id, name, created_at)
SELECT 
  gen_random_uuid() as id,
  'Admin Account - ' || au.email as name,
  NOW() as created_at
FROM auth.users au
INNER JOIN admins a ON au.id = a.user_id
LEFT JOIN account_users acu ON au.id = acu.user_id
WHERE acu.user_id IS NULL
ON CONFLICT DO NOTHING;

-- Step 2: Link admin users to their accounts
INSERT INTO account_users (account_id, user_id, role, created_at)
SELECT 
  acc.id as account_id,
  au.id as user_id,
  'owner' as role,
  NOW() as created_at
FROM auth.users au
INNER JOIN admins a ON au.id = a.user_id
INNER JOIN accounts acc ON acc.name = 'Admin Account - ' || au.email
LEFT JOIN account_users acu ON au.id = acu.user_id
WHERE acu.user_id IS NULL
ON CONFLICT DO NOTHING;

-- Step 3: Create business profiles for admin accounts that don't have them
INSERT INTO businesses (id, account_id, name, created_at)
SELECT 
  gen_random_uuid() as id,
  acc.id as account_id,
  'Admin Business - ' || au.email as name,
  NOW() as created_at
FROM auth.users au
INNER JOIN admins a ON au.id = a.user_id
INNER JOIN accounts acc ON acc.name = 'Admin Account - ' || au.email
LEFT JOIN businesses b ON acc.id = b.account_id
WHERE b.account_id IS NULL
ON CONFLICT DO NOTHING;

-- Step 4: Show results
SELECT 
  'Migration Results' as info,
  COUNT(*) as total_admin_users,
  COUNT(acu.user_id) as users_with_accounts,
  COUNT(b.account_id) as accounts_with_businesses
FROM auth.users au
INNER JOIN admins a ON au.id = a.user_id
LEFT JOIN account_users acu ON au.id = acu.user_id
LEFT JOIN accounts acc ON acu.account_id = acc.id
LEFT JOIN businesses b ON acc.id = b.account_id; 