-- Multi-Account Decoupling Migration
-- Goal: Allow many accounts per auth user without creating new auth users.

DO $$ BEGIN
  -- Drop legacy FK if present (name may differ across environments)
  ALTER TABLE public.accounts DROP CONSTRAINT IF EXISTS accounts_id_fkey;
EXCEPTION WHEN others THEN NULL; END $$;

-- Helpful columns if not present
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS is_additional_account BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS had_paid_plan BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID;

-- RLS: Use membership via account_users for reads/updates
-- Note: Names may vary; create additive policies rather than dropping blindly.
DROP POLICY IF EXISTS accounts_select_by_membership ON public.accounts;
CREATE POLICY accounts_select_by_membership ON public.accounts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.account_users au
      WHERE au.account_id = accounts.id
        AND au.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS accounts_update_by_role ON public.accounts;
CREATE POLICY accounts_update_by_role ON public.accounts
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.account_users au
      WHERE au.account_id = accounts.id
        AND au.user_id = auth.uid()
        AND au.role IN ('owner','admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.account_users au
      WHERE au.account_id = accounts.id
        AND au.user_id = auth.uid()
        AND au.role IN ('owner','admin')
    )
  );

-- Ensure service role can insert accounts
DROP POLICY IF EXISTS accounts_insert_service ON public.accounts;
CREATE POLICY accounts_insert_service ON public.accounts
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Example child-table policy for reference (no-op if table/policy already configured)
-- CREATE POLICY IF NOT EXISTS businesses_select_by_membership ON public.businesses
--   FOR SELECT TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.account_users au
--       WHERE au.account_id = businesses.account_id
--         AND au.user_id = auth.uid()
--     )
--   );

-- Backfill helper (idempotent): ensure each account has an owner link for primary accounts
-- INSERT INTO public.account_users (account_id, user_id, role, created_at)
-- SELECT a.id, a.id, 'owner', NOW()
-- FROM public.accounts a
-- LEFT JOIN public.account_users au ON au.account_id = a.id AND au.user_id = a.id
-- WHERE au.account_id IS NULL;