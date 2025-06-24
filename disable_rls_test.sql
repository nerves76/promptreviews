-- Temporarily disable RLS to test admin functionality
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- Test the query directly
SELECT * FROM admins WHERE account_id = 'f3fa0bb0-feab-4501-8644-c0ca579da96d';

-- If this works, we'll re-enable RLS with a simpler policy
-- ALTER TABLE admins ENABLE ROW LEVEL SECURITY; 