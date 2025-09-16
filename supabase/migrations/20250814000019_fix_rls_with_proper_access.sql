-- Fix RLS policies to allow proper multi-account access without recursion
-- This migration creates policies that work for both single and multi-account users

-- First, drop all existing policies
DROP POLICY IF EXISTS "account_users_select_own" ON account_users;
DROP POLICY IF EXISTS "accounts_select_own" ON accounts;
DROP POLICY IF EXISTS "businesses_select_own" ON businesses;
DROP POLICY IF EXISTS "businesses_insert_own" ON businesses;
DROP POLICY IF EXISTS "businesses_update_own" ON businesses;
DROP POLICY IF EXISTS "businesses_delete_own" ON businesses;
DROP POLICY IF EXISTS "announcements_public_active" ON announcements;

-- 1. account_users table - Users can see their own records
CREATE POLICY "users_view_own_account_users"
  ON account_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2. accounts table - Users can see accounts they belong to
-- Using EXISTS to avoid recursion by checking account_users directly
CREATE POLICY "users_view_accessible_accounts"
  ON accounts
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM account_users
      WHERE account_users.account_id = accounts.id
      AND account_users.user_id = auth.uid()
    )
  );

-- 3. businesses table - Users can access businesses for their accounts
-- Using EXISTS to check account_users without recursion
CREATE POLICY "users_view_accessible_businesses"
  ON businesses
  FOR SELECT
  TO authenticated
  USING (
    account_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM account_users
      WHERE account_users.account_id = businesses.account_id
      AND account_users.user_id = auth.uid()
    )
  );

CREATE POLICY "users_insert_businesses"
  ON businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    account_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM account_users
      WHERE account_users.account_id = businesses.account_id
      AND account_users.user_id = auth.uid()
      AND account_users.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "users_update_businesses"
  ON businesses
  FOR UPDATE
  TO authenticated
  USING (
    account_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM account_users
      WHERE account_users.account_id = businesses.account_id
      AND account_users.user_id = auth.uid()
      AND account_users.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "users_delete_businesses"
  ON businesses
  FOR DELETE
  TO authenticated
  USING (
    account_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM account_users
      WHERE account_users.account_id = businesses.account_id
      AND account_users.user_id = auth.uid()
      AND account_users.role = 'owner'
    )
  );

-- 4. announcements table - Public access for active announcements
CREATE POLICY "public_view_active_announcements"
  ON announcements
  FOR SELECT
  TO public
  USING (is_active = true);

-- Note: The key to avoiding recursion is:
-- 1. Never reference a table in its own policy
-- 2. Use EXISTS clauses that only check account_users table
-- 3. account_users itself only checks user_id = auth.uid()
-- This creates a clear hierarchy without circular dependencies

DO $$
BEGIN
  RAISE NOTICE 'RLS policies updated with proper multi-account support';
  RAISE NOTICE 'Policies now use EXISTS clauses to avoid recursion';
  RAISE NOTICE 'Users can access their own accounts and team accounts';
END $$;