-- HOTFIX: Restore missing INSERT/UPDATE/DELETE policies on account_users
-- Date: 2026-02-22
--
-- Migration 20260222130000 dropped "simple_account_users_select" which was a
-- FOR ALL policy covering SELECT + INSERT + UPDATE + DELETE. The replacement
-- only created a SELECT policy, breaking write access to account_users.
--
-- This migration restores the missing CRUD policies.

-- ============================================================================
-- 1. Restore INSERT policy for authenticated users
-- ============================================================================
-- Users should be able to add themselves to accounts (via invitations, etc.)
CREATE POLICY "account_users_insert_authenticated"
  ON account_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- ============================================================================
-- 2. Restore UPDATE policy for authenticated users
-- ============================================================================
-- Users should be able to update their own membership records
CREATE POLICY "account_users_update_authenticated"
  ON account_users
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR account_id IN (
      SELECT au.account_id FROM account_users au WHERE au.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. Restore DELETE policy for authenticated users
-- ============================================================================
-- Users should be able to remove themselves, or account owners can remove members
CREATE POLICY "account_users_delete_authenticated"
  ON account_users
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR account_id IN (
      SELECT au.account_id FROM account_users au WHERE au.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. Ensure service_role bypass exists
-- ============================================================================
-- service_role bypasses RLS by default in Supabase, but having an explicit
-- policy is belt-and-suspenders for any edge cases.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'account_users'
      AND schemaname = 'public'
      AND policyname = 'account_users_service_role_policy'
  ) THEN
    EXECUTE 'CREATE POLICY "account_users_service_role_policy"
      ON account_users FOR ALL TO service_role
      USING (true) WITH CHECK (true)';
    RAISE NOTICE 'Created service_role policy on account_users';
  ELSE
    RAISE NOTICE 'service_role policy already exists on account_users';
  END IF;
END $$;
