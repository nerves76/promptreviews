-- Fix RLS and security issues flagged by Supabase dashboard
-- 1. Enable RLS on review_keyword_matches (account-scoped table)
-- 2. Enable RLS on rank_locations (reference/lookup table)
-- 3. Fix keyword_rotation_status view to use SECURITY INVOKER
-- NOTE: This migration is idempotent - safe to run multiple times

-- ============================================
-- 1. review_keyword_matches - Account-scoped table
-- ============================================

-- Enable RLS (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'review_keyword_matches') THEN
    ALTER TABLE review_keyword_matches ENABLE ROW LEVEL SECURITY;

    -- Policy: Users can select their own account's keyword matches
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'review_keyword_matches' AND policyname = 'Users can view own account keyword matches') THEN
      CREATE POLICY "Users can view own account keyword matches"
      ON review_keyword_matches
      FOR SELECT
      USING (
        account_id IN (
          SELECT au.account_id
          FROM account_users au
          WHERE au.user_id = auth.uid()
        )
      );
    END IF;

    -- Policy: Users can insert keyword matches for their own account
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'review_keyword_matches' AND policyname = 'Users can insert own account keyword matches') THEN
      CREATE POLICY "Users can insert own account keyword matches"
      ON review_keyword_matches
      FOR INSERT
      WITH CHECK (
        account_id IN (
          SELECT au.account_id
          FROM account_users au
          WHERE au.user_id = auth.uid()
        )
      );
    END IF;

    -- Policy: Users can update their own account's keyword matches
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'review_keyword_matches' AND policyname = 'Users can update own account keyword matches') THEN
      CREATE POLICY "Users can update own account keyword matches"
      ON review_keyword_matches
      FOR UPDATE
      USING (
        account_id IN (
          SELECT au.account_id
          FROM account_users au
          WHERE au.user_id = auth.uid()
        )
      );
    END IF;

    -- Policy: Users can delete their own account's keyword matches
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'review_keyword_matches' AND policyname = 'Users can delete own account keyword matches') THEN
      CREATE POLICY "Users can delete own account keyword matches"
      ON review_keyword_matches
      FOR DELETE
      USING (
        account_id IN (
          SELECT au.account_id
          FROM account_users au
          WHERE au.user_id = auth.uid()
        )
      );
    END IF;
  END IF;
END $$;

-- ============================================
-- 2. rank_locations - Reference/lookup table
-- ============================================

-- Enable RLS (only if table exists - may only be in production)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rank_locations') THEN
    ALTER TABLE rank_locations ENABLE ROW LEVEL SECURITY;

    -- Policy: All authenticated users can read location data (it's reference data)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rank_locations' AND policyname = 'Authenticated users can read rank locations') THEN
      CREATE POLICY "Authenticated users can read rank locations"
      ON rank_locations
      FOR SELECT
      TO authenticated
      USING (true);
    END IF;
  END IF;
END $$;

-- Policy: Only service role can modify location data (populated by system)
-- No insert/update/delete policies for regular users

-- ============================================
-- 3. keyword_rotation_status view - Fix SECURITY DEFINER
-- ============================================

-- Drop and recreate the view with SECURITY INVOKER
DROP VIEW IF EXISTS keyword_rotation_status;

CREATE VIEW keyword_rotation_status
WITH (security_invoker = true)
AS
SELECT
  kppu.prompt_page_id,
  kppu.account_id,
  pp.keyword_auto_rotate_enabled,
  pp.keyword_auto_rotate_threshold,
  pp.keyword_active_pool_size,
  count(*) FILTER (WHERE kppu.is_in_active_pool = true) AS active_pool_count,
  count(*) FILTER (WHERE kppu.is_in_active_pool = false) AS reserve_pool_count,
  count(*) FILTER (WHERE kppu.is_in_active_pool = true AND k.review_usage_count >= pp.keyword_auto_rotate_threshold) AS overused_active_count,
  count(*) FILTER (WHERE kppu.is_in_active_pool = false AND k.review_usage_count < pp.keyword_auto_rotate_threshold) AS available_reserve_count
FROM keyword_prompt_page_usage kppu
JOIN prompt_pages pp ON pp.id = kppu.prompt_page_id
JOIN keywords k ON k.id = kppu.keyword_id
GROUP BY
  kppu.prompt_page_id,
  kppu.account_id,
  pp.keyword_auto_rotate_enabled,
  pp.keyword_auto_rotate_threshold,
  pp.keyword_active_pool_size;

-- Add comment explaining the view
COMMENT ON VIEW keyword_rotation_status IS 'Aggregated keyword rotation status per prompt page. Uses SECURITY INVOKER to respect RLS on underlying tables.';
