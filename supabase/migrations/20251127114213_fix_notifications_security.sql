-- Fix notifications system security and add improvements
-- Addresses: RLS policy, duplicate alerts, cleanup job

-- ===========================================
-- 1. FIX: RLS policy for INSERT was too permissive
-- ===========================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;

-- Service role bypasses RLS entirely, so we don't need a special policy for it.
-- Instead, we need to ensure regular users cannot insert notifications directly.
-- The only way notifications should be created is via service role (cron jobs, webhooks).

-- For cases where we DO need users to create notifications (e.g., team invitations),
-- we can add a specific policy later. For now, no INSERT policy = no user inserts.

-- ===========================================
-- 2. FIX: Add unique constraint to prevent duplicate GBP alerts
-- ===========================================

-- Add unique constraint on pending alerts (same account, location, field)
-- Using a partial unique index to only apply to pending alerts
CREATE UNIQUE INDEX IF NOT EXISTS idx_gbp_change_alerts_unique_pending
ON gbp_change_alerts(account_id, location_id, field_changed)
WHERE status = 'pending';

-- ===========================================
-- 3. ADD: Notification cleanup function
-- ===========================================

-- Function to clean up old notifications (older than 30 days and already read/dismissed)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete notifications that are:
  -- 1. Older than 30 days AND (read OR dismissed)
  -- 2. OR older than 90 days (regardless of read status)
  WITH deleted AS (
    DELETE FROM notifications
    WHERE
      (created_at < NOW() - INTERVAL '30 days' AND (read = true OR dismissed = true))
      OR created_at < NOW() - INTERVAL '90 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role only
REVOKE ALL ON FUNCTION cleanup_old_notifications() FROM PUBLIC;

-- ===========================================
-- 4. ADD: Index for cleanup queries
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_notifications_cleanup
ON notifications(created_at, read, dismissed);

-- ===========================================
-- 5. FIX: Add index for user-specific notification queries
-- ===========================================

-- Composite index for the common query pattern (account + user filter)
CREATE INDEX IF NOT EXISTS idx_notifications_account_user
ON notifications(account_id, user_id, read, dismissed);
