-- Fix overly permissive RLS policies flagged by Supabase linter
--
-- review_drafts: Table is completely unused in app code (no references
--   in src/). Has no user_id or account_id column, making proper scoping
--   impossible. All 4 policies used USING(true), meaning any authenticated
--   user could read/modify any other user's drafts. Lock it down.
--
-- analytics_events: SELECT already fixed in 20251001000002. INSERT
--   policies are intentionally permissive (inserts use service role).
--   No changes needed.
--
-- Other flagged tables (accounts, ai_*_usage, cron_execution_logs,
--   game_scores, game_leaderboard, review_submissions): All reviewed
--   and either intentional or already properly scoped. No changes.

-- ============================================================
-- review_drafts - Lock down unused table
-- ============================================================

DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.review_drafts;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.review_drafts;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.review_drafts;
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.review_drafts;

-- Deny all access (table is unused, no ownership columns exist)
CREATE POLICY "Deny all select on review_drafts"
  ON public.review_drafts FOR SELECT
  TO authenticated
  USING (false);

CREATE POLICY "Deny all insert on review_drafts"
  ON public.review_drafts FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Deny all update on review_drafts"
  ON public.review_drafts FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny all delete on review_drafts"
  ON public.review_drafts FOR DELETE
  TO authenticated
  USING (false);
