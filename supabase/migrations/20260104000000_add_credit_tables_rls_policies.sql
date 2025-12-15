-- Migration: Add INSERT and UPDATE RLS policies for credit tables
--
-- The credit_ledger and credit_balances tables had RLS enabled but only SELECT policies.
-- This prevented credit operations (debit/credit) from working through authenticated API endpoints.
--
-- This migration adds INSERT and UPDATE policies so that:
-- - Users can insert ledger entries for accounts they belong to
-- - Users can upsert/update balance records for accounts they belong to

-- ============================================================================
-- credit_ledger INSERT policy
-- Allows authenticated users to insert entries for accounts they belong to
-- ============================================================================
CREATE POLICY "Users can insert credit ledger entries for own accounts"
  ON credit_ledger FOR INSERT
  TO authenticated
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- credit_balances INSERT policy
-- Allows authenticated users to insert balance records for accounts they belong to
-- ============================================================================
CREATE POLICY "Users can insert credit balance for own accounts"
  ON credit_balances FOR INSERT
  TO authenticated
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- credit_balances UPDATE policy
-- Allows authenticated users to update balance records for accounts they belong to
-- ============================================================================
CREATE POLICY "Users can update credit balance for own accounts"
  ON credit_balances FOR UPDATE
  TO authenticated
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );
