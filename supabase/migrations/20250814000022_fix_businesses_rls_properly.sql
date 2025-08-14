-- Fix businesses RLS policies properly without recursion
-- The nuclear fix allowed ALL users to update ANY business - we need to fix this

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "simple_businesses_select" ON businesses;

-- Create proper policies that check account ownership without recursion
-- These policies are carefully designed to avoid circular dependencies

-- 1. SELECT: Users can view businesses for accounts they belong to
CREATE POLICY "users_can_view_their_businesses"
  ON businesses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM account_users
      WHERE account_users.account_id = businesses.account_id
      AND account_users.user_id = auth.uid()
    )
  );

-- 2. INSERT: Users can create businesses for accounts where they are owner/admin
CREATE POLICY "users_can_create_businesses"
  ON businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM account_users
      WHERE account_users.account_id = businesses.account_id
      AND account_users.user_id = auth.uid()
      AND account_users.role IN ('owner', 'admin')
    )
  );

-- 3. UPDATE: Users can update businesses for accounts where they are owner/admin
CREATE POLICY "users_can_update_businesses"
  ON businesses
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM account_users
      WHERE account_users.account_id = businesses.account_id
      AND account_users.user_id = auth.uid()
      AND account_users.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM account_users
      WHERE account_users.account_id = businesses.account_id
      AND account_users.user_id = auth.uid()
      AND account_users.role IN ('owner', 'admin')
    )
  );

-- 4. DELETE: Users can delete businesses for accounts where they are owner
CREATE POLICY "users_can_delete_businesses"
  ON businesses
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM account_users
      WHERE account_users.account_id = businesses.account_id
      AND account_users.user_id = auth.uid()
      AND account_users.role = 'owner'
    )
  );

-- Verify the policies are working
DO $$
BEGIN
  RAISE NOTICE 'Businesses RLS policies have been properly restored';
  RAISE NOTICE 'Users can now only access businesses for their own accounts';
  RAISE NOTICE 'Only owners and admins can update businesses';
END $$;