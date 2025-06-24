-- Test the admin query directly
SELECT * FROM admins WHERE account_id = 'f3fa0bb0-feab-4501-8644-c0ca579da96d';

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'admins';

-- Check current RLS policies
SELECT * FROM pg_policies WHERE tablename = 'admins';

-- Temporarily disable RLS to test
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- Test query again
SELECT * FROM admins WHERE account_id = 'f3fa0bb0-feab-4501-8644-c0ca579da96d';

-- Re-enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY; 