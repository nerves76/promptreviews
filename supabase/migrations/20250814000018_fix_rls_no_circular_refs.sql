-- Complete fix for infinite recursion in RLS policies
-- This migration removes ALL circular references between tables

-- First, drop ALL existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their own account_users" ON account_users;
DROP POLICY IF EXISTS "Users can view their own account_user records" ON account_users;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON account_users;
DROP POLICY IF EXISTS "Allow all operations for service role" ON account_users;

DROP POLICY IF EXISTS "Users can view businesses" ON businesses;
DROP POLICY IF EXISTS "Users can create businesses" ON businesses;
DROP POLICY IF EXISTS "Users can update businesses" ON businesses;
DROP POLICY IF EXISTS "Users can delete businesses" ON businesses;
DROP POLICY IF EXISTS "Users can view their account's businesses" ON businesses;
DROP POLICY IF EXISTS "Users can create businesses for their account" ON businesses;
DROP POLICY IF EXISTS "Users can update their account's businesses" ON businesses;
DROP POLICY IF EXISTS "Users can delete their account's businesses" ON businesses;

DROP POLICY IF EXISTS "Users can view accounts" ON accounts;
DROP POLICY IF EXISTS "Users can view own account" ON accounts;
DROP POLICY IF EXISTS "Users can update own account" ON accounts;

DROP POLICY IF EXISTS "Public users can view active announcements" ON announcements;

-- Now create completely independent policies with NO cross-table references

-- 1. account_users table - Simple policy based only on user_id
CREATE POLICY "account_users_select_own"
  ON account_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2. accounts table - Only check if the account ID matches the user ID
-- This works because initially account.id = user.id for owned accounts
CREATE POLICY "accounts_select_own"
  ON accounts
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- 3. businesses table - Only check if the account_id matches the user ID
-- This works for owner accounts where account.id = user.id
CREATE POLICY "businesses_select_own"
  ON businesses
  FOR SELECT
  TO authenticated
  USING (account_id = auth.uid());

CREATE POLICY "businesses_insert_own"
  ON businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (account_id = auth.uid());

CREATE POLICY "businesses_update_own"
  ON businesses
  FOR UPDATE
  TO authenticated
  USING (account_id = auth.uid());

CREATE POLICY "businesses_delete_own"
  ON businesses
  FOR DELETE
  TO authenticated
  USING (account_id = auth.uid());

-- 4. announcements table - Simple public policy
CREATE POLICY "announcements_public_active"
  ON announcements
  FOR SELECT
  TO public
  USING (is_active = true);

-- For tables that need multi-account support, we'll handle access in the application layer
-- by using service role client when needed, rather than complex RLS policies

DO $$
BEGIN
  RAISE NOTICE 'RLS policies have been simplified to avoid circular references';
  RAISE NOTICE 'Multi-account access will be handled at the application layer';
  RAISE NOTICE 'This should resolve the infinite recursion errors';
END $$;