-- Fix Admin Analytics Redirect Issue
-- 
-- This script fixes the issue where clicking on analytics in admin area 
-- redirects to dashboard instead of showing analytics.
--
-- The problem is typically:
-- 1. No admin users exist in the admins table
-- 2. RLS policies prevent browser client from reading admins table
--
-- Run this in your Supabase SQL Editor

-- Step 1: Check current state
SELECT 'Current admins count:' as check_type, COUNT(*) as count FROM admins;
SELECT 'Current users count:' as check_type, COUNT(*) as count FROM auth.users;

-- Step 2: Show existing admins and their corresponding users
SELECT 
  a.id as admin_id,
  a.account_id,
  u.email
FROM admins a
LEFT JOIN auth.users u ON u.id = a.account_id;

-- Step 3: Temporarily disable RLS to fix access issues
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- Step 4: If no admins exist, add the first user as admin
-- (Replace 'your-email@example.com' with your actual email)
INSERT INTO admins (account_id)
SELECT id FROM auth.users 
WHERE email = 'your-email@example.com'  -- CHANGE THIS TO YOUR EMAIL
AND NOT EXISTS (SELECT 1 FROM admins WHERE account_id = auth.users.id)
LIMIT 1;

-- Alternative: Add the first user (regardless of email) if no admins exist
-- Uncomment the lines below if you don't know your email or the above didn't work
/*
INSERT INTO admins (account_id)
SELECT id FROM auth.users 
WHERE NOT EXISTS (SELECT 1 FROM admins)
ORDER BY created_at ASC
LIMIT 1;
*/

-- Step 5: Create proper RLS policy for admin checking
DROP POLICY IF EXISTS "Allow admin checking" ON admins;
DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON admins;
DROP POLICY IF EXISTS "Allow authenticated users to check admin status" ON admins;

-- Create a policy that allows authenticated users to read admins table
CREATE POLICY "Allow authenticated users to check admin status" ON admins
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Step 6: Re-enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Step 7: Verify the fix
SELECT 'Final verification:' as check_type;
SELECT 
  'Admin users created:' as status,
  COUNT(*) as count,
  STRING_AGG(u.email, ', ') as admin_emails
FROM admins a
LEFT JOIN auth.users u ON u.id = a.account_id;

-- Step 8: Test query (this simulates what the analytics page does)
SELECT 
  'Test admin check:' as test_type,
  CASE 
    WHEN COUNT(*) > 0 THEN 'PASS - Admin access should work'
    ELSE 'FAIL - No admin users found'
  END as result
FROM admins a
JOIN auth.users u ON u.id = a.account_id
LIMIT 1;

/* 
INSTRUCTIONS:
1. Copy this entire script
2. Go to your Supabase dashboard > SQL Editor
3. Paste and run this script
4. Look for the line that says 'your-email@example.com' and replace it with your actual email
5. Run the script
6. Try accessing /admin/analytics again

If you're still having issues:
- Check the results of the verification queries
- Make sure you're logged in as the user you made admin
- If needed, you can keep RLS disabled temporarily by running:
  ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
*/