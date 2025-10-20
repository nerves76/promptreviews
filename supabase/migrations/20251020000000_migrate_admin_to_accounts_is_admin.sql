-- Migration: Replace admins table with accounts.is_admin column
-- This migration consolidates admin checking to use a single source of truth

-- Step 1: Migrate existing admin entries to accounts.is_admin
-- Set is_admin = true for any accounts that exist in the admins table
UPDATE accounts
SET is_admin = true
WHERE id IN (
  SELECT account_id FROM admins
);

-- Step 2: Update RLS policies to use accounts.is_admin instead of admins table

-- Update channels policies
DROP POLICY IF EXISTS "admins_can_update_channels" ON channels;
DROP POLICY IF EXISTS "admins_can_delete_channels" ON channels;

CREATE POLICY "admins_can_update_channels" ON channels
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM accounts WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "admins_can_delete_channels" ON channels
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM accounts WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Update community_profiles policies
DROP POLICY IF EXISTS "admins_can_view_all_profiles" ON community_profiles;

CREATE POLICY "admins_can_view_all_profiles" ON community_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM accounts WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Update daily_stats policies
DROP POLICY IF EXISTS "Admins can view daily stats" ON daily_stats;

CREATE POLICY "Admins can view daily stats" ON daily_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM accounts WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Update feedback policies
DROP POLICY IF EXISTS "Admins can view all feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can delete feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can update feedback" ON feedback;

CREATE POLICY "Admins can view all feedback" ON feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM accounts WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete feedback" ON feedback
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM accounts WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update feedback" ON feedback
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM accounts WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Update mentions policies
DROP POLICY IF EXISTS "admins_can_delete_mentions" ON mentions;
DROP POLICY IF EXISTS "admins_can_view_all_mentions" ON mentions;

CREATE POLICY "admins_can_delete_mentions" ON mentions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM accounts WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "admins_can_view_all_mentions" ON mentions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM accounts WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Update platform_metrics policies
DROP POLICY IF EXISTS "Admins can view platform metrics" ON platform_metrics;

CREATE POLICY "Admins can view platform metrics" ON platform_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM accounts WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Update post_comments policies
DROP POLICY IF EXISTS "admins_can_update_comments" ON post_comments;
DROP POLICY IF EXISTS "admins_can_delete_comments" ON post_comments;

CREATE POLICY "admins_can_update_comments" ON post_comments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM accounts WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "admins_can_delete_comments" ON post_comments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM accounts WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Update posts policies
DROP POLICY IF EXISTS "admins_can_delete_posts" ON posts;
DROP POLICY IF EXISTS "admins_can_update_posts" ON posts;

CREATE POLICY "admins_can_delete_posts" ON posts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM accounts WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "admins_can_update_posts" ON posts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM accounts WHERE id = auth.uid() AND is_admin = true
    )
  );
