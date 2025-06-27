-- Simple test to bypass RLS and check admin access
-- This will help identify if RLS is causing the empty error object

-- 1. Temporarily disable RLS
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- 2. Test a simple query
SELECT 
    'Test Query with RLS Disabled' as test_name,
    COUNT(*) as admin_count
FROM admins;

-- 3. Test with a specific user ID (we'll need to replace this with an actual user ID)
-- First, let's see what users exist
SELECT 
    'Available Users' as info,
    id,
    email
FROM auth.users
ORDER BY created_at DESC
LIMIT 3;

-- 4. Test the exact query that the isAdmin function uses
-- Replace 'USER_ID_HERE' with an actual user ID from the above query
SELECT 
    'Exact isAdmin Query Test' as test_name,
    id,
    account_id
FROM admins
WHERE account_id = 'USER_ID_HERE'  -- Replace with actual user ID
LIMIT 1;

-- 5. Re-enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 6. Test the same query with RLS enabled
SELECT 
    'Exact isAdmin Query Test with RLS' as test_name,
    id,
    account_id
FROM admins
WHERE account_id = 'USER_ID_HERE'  -- Replace with actual user ID
LIMIT 1; 