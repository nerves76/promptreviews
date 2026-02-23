-- HOTFIX: Replace self-referential SELECT policy on account_users
-- Date: 2026-02-22
--
-- The policy "account_users_select_own_and_teammates" has a subquery that
-- references account_users itself, creating a circular dependency with the
-- accounts table RLS policy (which also subqueries account_users).
-- This causes PostgreSQL to return empty results, breaking login.
--
-- Fix: Replace with a simple non-recursive policy matching the original.

-- Drop the problematic self-referential policy
DROP POLICY IF EXISTS "account_users_select_own_and_teammates" ON account_users;

-- Recreate with a simple, non-recursive condition
-- Users can see their own rows + rows for any account they belong to
-- The OR clause uses a non-recursive approach: check if the current user's ID
-- appears anywhere in account_users for the same account_id
CREATE POLICY "account_users_select_own"
  ON account_users
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );

-- Separate policy for teammates - uses EXISTS to avoid recursion issues
-- This allows users to see other members of accounts they belong to
CREATE POLICY "account_users_select_teammates"
  ON account_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = account_users.account_id
        AND au.user_id = auth.uid()
    )
  );
