-- Simple test to bypass RLS and check admin access
-- This will help identify if RLS is causing the empty error object

-- 1. Temporarily disable RLS
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- 2. Test a simple query
SELECT 
    'Test Query with RLS Disabled' as test_name,
    COUNT(*) as admin_count
FROM admins;

-- 3. Test with a specific user ID (using the first user from diagnostic results)
SELECT 
    'Available Users' as info,
    id,
    email
FROM auth.users
ORDER BY created_at DESC
LIMIT 3;

-- 4. Test the exact query that the isAdmin function uses
-- Using the user ID: 5b001922-ca54-4aec-b4ea-581a9515984e (chris@murmurcreative.com)
SELECT 
    'Exact isAdmin Query Test' as test_name,
    id,
    account_id
FROM admins
WHERE account_id = '5b001922-ca54-4aec-b4ea-581a9515984e'
LIMIT 1;

-- 5. Re-enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 6. Test the same query with RLS enabled
SELECT 
    'Exact isAdmin Query Test with RLS' as test_name,
    id,
    account_id
FROM admins
WHERE account_id = '5b001922-ca54-4aec-b4ea-581a9515984e'
LIMIT 1;

-- 7. Test with the second user as well
SELECT 
    'Second User Test with RLS' as test_name,
    id,
    account_id
FROM admins
WHERE account_id = 'ffa1452d-658a-4b8a-ad07-d4aaaa537664'
LIMIT 1; 