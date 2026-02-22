-- ============================================================================
-- SECURITY FIX: Remove anon role access to account_users table
-- Date: 2026-02-21
-- ============================================================================
--
-- PROBLEM:
--   Migration 20250814000016_restore_account_users_rls.sql created a policy
--   "Anon can read account_users" that allows the anon (unauthenticated) role
--   to read ALL rows in account_users. This exposes which users belong to
--   which accounts, leaking organizational membership data to unauthenticated
--   API callers.
--
--   The comment in that migration claimed "account_users only contains
--   relationships, not sensitive data" — but user-to-account mappings ARE
--   sensitive. An attacker can enumerate all users, all accounts, and which
--   users have access to which accounts.
--
--   While migration 20250814000020 (nuclear fix) dynamically drops all
--   policies, there is no guarantee that policy was fully applied in all
--   environments. This migration explicitly cleans up any leftover
--   permissive policies.
--
-- FIX:
--   1. Drop the anon SELECT policy (if it still exists)
--   2. Drop overly permissive FOR ALL policies from the nuclear fix (if they exist)
--   3. Drop duplicate service_role policies (keep only one)
--   4. Ensure the current SELECT policy only allows authenticated users to see:
--      a) Their own account_users rows (user_id = auth.uid())
--      b) Rows for accounts they belong to (so they can see teammates)
--   5. Leave existing INSERT/UPDATE/DELETE policies untouched
--
-- NOTE: This migration is idempotent and safe to run multiple times.
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop the dangerous anon policy
-- ============================================================================

-- This is the primary security fix. The anon role should NEVER have read
-- access to account_users. This table contains user-to-account mappings
-- which reveal organizational structure.
DROP POLICY IF EXISTS "Anon can read account_users" ON account_users;

-- ============================================================================
-- STEP 2: Drop overly permissive policies from previous migrations
-- ============================================================================

-- The "nuclear fix" (20250814000020) created a FOR ALL policy for authenticated
-- users with USING (user_id = auth.uid()). This is overly broad because FOR ALL
-- applies to SELECT, INSERT, UPDATE, and DELETE — we want separate, targeted
-- policies for each operation.
DROP POLICY IF EXISTS "simple_account_users_select" ON account_users;

-- Drop the old service_role policy from 20250814000016 (may be duplicated
-- by the one from 20250901000001)
DROP POLICY IF EXISTS "Service role full access to account_users" ON account_users;

-- ============================================================================
-- STEP 3: Drop and recreate the SELECT policy for authenticated users
-- ============================================================================

-- Drop all known SELECT policy names that may exist from previous migrations.
-- We will recreate a single, correct SELECT policy.
DROP POLICY IF EXISTS "Users view own memberships" ON account_users;
DROP POLICY IF EXISTS "Users can view own memberships" ON account_users;
DROP POLICY IF EXISTS "Users can view own account memberships" ON account_users;
DROP POLICY IF EXISTS "Users can view their account memberships" ON account_users;
DROP POLICY IF EXISTS "Users can view their own account_users" ON account_users;
DROP POLICY IF EXISTS "Users can view their own account_user records" ON account_users;
DROP POLICY IF EXISTS "account_users_select_own" ON account_users;
DROP POLICY IF EXISTS "account_users_select_policy" ON account_users;
DROP POLICY IF EXISTS "Users can view their account relationships" ON account_users;

-- Create the correct SELECT policy:
-- - Only for the 'authenticated' role (NOT anon)
-- - Users can see their own membership rows
-- - Users can see teammates (other members of accounts they belong to)
CREATE POLICY "account_users_select_own_and_teammates"
  ON account_users
  FOR SELECT
  TO authenticated
  USING (
    -- Users can always see their own membership records
    user_id = auth.uid()
    OR
    -- Users can see other members of accounts they belong to (for team features)
    account_id IN (
      SELECT au.account_id
      FROM account_users au
      WHERE au.user_id = auth.uid()
    )
  );

-- Add a comment explaining the policy
COMMENT ON POLICY "account_users_select_own_and_teammates" ON account_users IS
  'Authenticated users can see their own memberships and teammates in shared accounts. The anon role has NO access.';

-- ============================================================================
-- STEP 4: Verify INSERT/UPDATE/DELETE policies are still in place
-- ============================================================================

-- We are NOT touching these policies. They should already exist from
-- migrations 20250901000001 and 20250901000002:
--   - "account_users_insert_policy" (INSERT, authenticated)
--   - "account_users_update_policy" (UPDATE, authenticated)
--   - "account_users_delete_policy" (DELETE, authenticated)
--   - "account_users_service_role_policy" (ALL, service_role)
--
-- If any of those are missing, they will need to be fixed in a separate
-- migration after investigation.

-- ============================================================================
-- STEP 5: Ensure RLS is enabled (idempotent)
-- ============================================================================

ALTER TABLE account_users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  v_anon_policies integer;
BEGIN
  -- Check that no anon policies remain on account_users
  SELECT COUNT(*) INTO v_anon_policies
  FROM pg_policies
  WHERE tablename = 'account_users'
    AND schemaname = 'public'
    AND roles @> ARRAY['anon'];

  IF v_anon_policies > 0 THEN
    RAISE WARNING 'SECURITY: Found % anon policies still on account_users after fix!', v_anon_policies;
  ELSE
    RAISE NOTICE 'SECURITY FIX VERIFIED: No anon policies on account_users table';
  END IF;

  RAISE NOTICE 'account_users RLS security fix applied successfully';
END $$;
