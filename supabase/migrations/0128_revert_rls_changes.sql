/**
 * Migration: Revert RLS Changes That Broke The App
 * 
 * This migration reverts the overly restrictive RLS policies that
 * prevented normal app functionality.
 */

-- Drop the problematic policies that broke the app
DROP POLICY IF EXISTS "Users can view their account relationships" ON account_users;
DROP POLICY IF EXISTS "Account owners can view team members" ON account_users;
DROP POLICY IF EXISTS "Account owners can manage team members" ON account_users;
DROP POLICY IF EXISTS "Users can accept invitations" ON account_users;
DROP POLICY IF EXISTS "Service role can manage all account_users" ON account_users;

-- Disable RLS on account_users temporarily to restore functionality
ALTER TABLE account_users DISABLE ROW LEVEL SECURITY;

-- Grant broad permissions to restore functionality
GRANT ALL ON account_users TO authenticated;
GRANT ALL ON account_users TO anon;

-- Add a simple policy that allows all operations for now
-- We'll implement proper security later after the app is working
ALTER TABLE account_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users" ON account_users
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for service role" ON account_users
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure permissions are properly granted
GRANT SELECT, INSERT, UPDATE, DELETE ON account_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON account_users TO anon;

-- Add comment explaining this is a temporary fix
COMMENT ON TABLE account_users IS 'TEMPORARY: Permissive RLS policies until we can implement proper security without breaking app functionality'; 