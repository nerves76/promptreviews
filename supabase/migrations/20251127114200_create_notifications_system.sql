-- Create notifications system
-- Centralized notification system for in-app alerts (bell icon) and email preferences

-- Notification types enum
CREATE TYPE notification_type AS ENUM (
  'gbp_change_detected',     -- GBP Profile Protection: change detected
  'new_review_received',     -- New review submitted via widget
  'team_invitation',         -- Team member invited
  'subscription_update',     -- Plan changes, billing alerts
  'system_announcement'      -- System-wide announcements
);

-- Main notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = all users on account

  -- Notification content
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Optional link to related resource
  action_url TEXT,
  action_label TEXT,

  -- Metadata for type-specific data (e.g., location_id, alert_id for GBP changes)
  metadata JSONB DEFAULT '{}',

  -- Status tracking
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ,

  -- Email tracking
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_notifications_account_id ON notifications(account_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(account_id, read) WHERE NOT read;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view notifications for their accounts
CREATE POLICY "Users can view their account notifications"
  ON notifications FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- Users can update (mark as read/dismissed) their notifications
CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- Service role can insert notifications (for cron jobs, webhooks, etc.)
CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Notification preferences table (per account)
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

  -- In-app notification preferences (bell icon)
  in_app_gbp_changes BOOLEAN DEFAULT TRUE,
  in_app_new_reviews BOOLEAN DEFAULT TRUE,
  in_app_team_updates BOOLEAN DEFAULT TRUE,
  in_app_subscription_updates BOOLEAN DEFAULT TRUE,
  in_app_announcements BOOLEAN DEFAULT TRUE,

  -- Email notification preferences
  email_gbp_changes BOOLEAN DEFAULT TRUE,
  email_new_reviews BOOLEAN DEFAULT TRUE,  -- Maps to existing email_review_notifications
  email_team_updates BOOLEAN DEFAULT TRUE,
  email_subscription_updates BOOLEAN DEFAULT TRUE,
  email_announcements BOOLEAN DEFAULT FALSE,

  -- Email frequency for non-urgent notifications
  email_digest_frequency TEXT DEFAULT 'immediate' CHECK (email_digest_frequency IN ('immediate', 'daily', 'weekly', 'none')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(account_id)
);

-- RLS for notification preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their account notification preferences"
  ON notification_preferences FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their account notification preferences"
  ON notification_preferences FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert notification preferences for their accounts"
  ON notification_preferences FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- Function to auto-create notification preferences when account is created
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (account_id)
  VALUES (NEW.id)
  ON CONFLICT (account_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create preferences for new accounts
DROP TRIGGER IF EXISTS create_notification_preferences_trigger ON accounts;
CREATE TRIGGER create_notification_preferences_trigger
  AFTER INSERT ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- Create default preferences for existing accounts
INSERT INTO notification_preferences (account_id)
SELECT id FROM accounts
WHERE id NOT IN (SELECT account_id FROM notification_preferences)
ON CONFLICT (account_id) DO NOTHING;

-- Updated_at trigger for notifications
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Add index for unread count queries
CREATE INDEX idx_notifications_unread_count
  ON notifications(account_id, created_at DESC)
  WHERE NOT read AND NOT dismissed;
