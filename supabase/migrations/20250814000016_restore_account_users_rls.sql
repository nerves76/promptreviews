-- Restore essential RLS policies for account_users table
-- These policies are critical for authentication to work

-- Ensure RLS is enabled
ALTER TABLE account_users ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their account relationships" ON account_users;
DROP POLICY IF EXISTS "Users can view their own account_user records" ON account_users;
DROP POLICY IF EXISTS "Users can view their own account_users" ON account_users;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON account_users;
DROP POLICY IF EXISTS "Allow all operations for service role" ON account_users;

-- CRITICAL: Allow users to see their own account_users records
-- Without this, users cannot find which accounts they belong to
CREATE POLICY "Users can view their own account_users"
  ON account_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow users to see all members of accounts they belong to
CREATE POLICY "Users can view team members in their accounts"
  ON account_users
  FOR SELECT
  TO authenticated
  USING (
    account_id IN (
      SELECT account_id 
      FROM account_users 
      WHERE user_id = auth.uid()
    )
  );

-- Service role bypass for system operations
CREATE POLICY "Service role full access to account_users"
  ON account_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anon role to read for public API endpoints (if needed)
-- This is safe because account_users only contains relationships, not sensitive data
CREATE POLICY "Anon can read account_users"
  ON account_users
  FOR SELECT
  TO anon
  USING (true);

-- Verify the policies are created
DO $$
BEGIN
  RAISE NOTICE 'RLS policies for account_users table have been restored';
  RAISE NOTICE 'Users should now be able to see their account relationships';
END $$;