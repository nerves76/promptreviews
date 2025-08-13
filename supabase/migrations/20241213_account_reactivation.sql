-- ============================================
-- Account Reactivation Support
-- Tracks when users return after cancellation
-- ============================================

-- Add reactivation tracking fields to accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS reactivated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reactivation_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_cancellation_reason TEXT;

-- Create index for finding recently deleted accounts
CREATE INDEX IF NOT EXISTS idx_accounts_deleted_at 
ON accounts(deleted_at) 
WHERE deleted_at IS NOT NULL;

-- ============================================
-- Account Events Table for Analytics
-- ============================================
CREATE TABLE IF NOT EXISTS account_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes separately
CREATE INDEX IF NOT EXISTS idx_account_events_account ON account_events(account_id);
CREATE INDEX IF NOT EXISTS idx_account_events_type ON account_events(event_type);
CREATE INDEX IF NOT EXISTS idx_account_events_created ON account_events(created_at DESC);

-- Enable RLS
ALTER TABLE account_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own events
CREATE POLICY "Users can view own account events" ON account_events
  FOR SELECT
  TO authenticated
  USING (account_id = auth.uid());

-- ============================================
-- Function to automatically reactivate account on login
-- ============================================
CREATE OR REPLACE FUNCTION check_account_reactivation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has a deleted account
  IF EXISTS (
    SELECT 1 FROM accounts 
    WHERE id = NEW.user_id 
    AND deleted_at IS NOT NULL
  ) THEN
    -- Check if within retention period (90 days)
    IF EXISTS (
      SELECT 1 FROM accounts 
      WHERE id = NEW.user_id 
      AND deleted_at > NOW() - INTERVAL '90 days'
    ) THEN
      -- Reactivate account
      UPDATE accounts 
      SET 
        deleted_at = NULL,
        reactivated_at = NOW(),
        reactivation_count = COALESCE(reactivation_count, 0) + 1,
        plan = 'no_plan', -- Force plan selection
        subscription_status = NULL
      WHERE id = NEW.user_id;
      
      -- Log reactivation event
      INSERT INTO account_events (account_id, event_type, event_data)
      VALUES (
        NEW.user_id, 
        'auto_reactivation',
        jsonb_build_object(
          'session_id', NEW.id,
          'ip', NEW.ip,
          'user_agent', NEW.user_agent
        )
      );
      
      RAISE NOTICE 'Account % reactivated on login', NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on session creation
DROP TRIGGER IF EXISTS trigger_check_account_reactivation ON auth.sessions;
CREATE TRIGGER trigger_check_account_reactivation
  AFTER INSERT ON auth.sessions
  FOR EACH ROW
  EXECUTE FUNCTION check_account_reactivation();

-- ============================================
-- View for admin dashboard - reactivation metrics
-- ============================================
CREATE OR REPLACE VIEW reactivation_metrics AS
SELECT 
  COUNT(DISTINCT id) as total_reactivations,
  AVG(EXTRACT(EPOCH FROM (reactivated_at - deleted_at))/86400)::INT as avg_days_to_return,
  MAX(reactivation_count) as max_reactivations_per_user,
  COUNT(DISTINCT id) FILTER (WHERE reactivated_at > NOW() - INTERVAL '30 days') as reactivations_last_30_days,
  COUNT(DISTINCT id) FILTER (WHERE reactivated_at > NOW() - INTERVAL '7 days') as reactivations_last_7_days
FROM accounts
WHERE reactivated_at IS NOT NULL;

-- Grant access to authenticated users (for admin dashboard)
GRANT SELECT ON reactivation_metrics TO authenticated;

-- ============================================
-- Function to purge old deleted accounts (>90 days)
-- Should be called by a scheduled job
-- ============================================
CREATE OR REPLACE FUNCTION purge_old_deleted_accounts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  purged_count INTEGER;
BEGIN
  -- Delete accounts that have been soft-deleted for >90 days
  WITH deleted_accounts AS (
    DELETE FROM accounts
    WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '90 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO purged_count FROM deleted_accounts;
  
  -- Log purge event
  IF purged_count > 0 THEN
    INSERT INTO account_events (account_id, event_type, event_data)
    VALUES (
      NULL, 
      'accounts_purged',
      jsonb_build_object(
        'count', purged_count,
        'timestamp', NOW()
      )
    );
  END IF;
  
  RETURN purged_count;
END;
$$;

-- ============================================
-- Add comment for documentation
-- ============================================
COMMENT ON COLUMN accounts.deleted_at IS 'Soft deletion timestamp. Account can be reactivated within 90 days.';
COMMENT ON COLUMN accounts.reactivated_at IS 'Last reactivation timestamp for tracking returning users.';
COMMENT ON COLUMN accounts.reactivation_count IS 'Number of times account has been reactivated.';
COMMENT ON FUNCTION check_account_reactivation() IS 'Automatically reactivates soft-deleted accounts when user logs in within 90 days.';