-- Migration: Add Invitation Analytics
-- Creates tracking for invitation events to understand user engagement

-- Create invitation_events table for tracking analytics
CREATE TABLE IF NOT EXISTS invitation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES account_invitations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'resent', 'opened', 'clicked', 'accepted', 'expired')),
  event_data JSONB DEFAULT '{}',
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_invitation_events_invitation_id ON invitation_events(invitation_id);
CREATE INDEX IF NOT EXISTS idx_invitation_events_type_date ON invitation_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_invitation_events_created_at ON invitation_events(created_at);

-- Enable RLS for invitation_events
ALTER TABLE invitation_events ENABLE ROW LEVEL SECURITY;

-- Allow account owners to view events for their invitations
CREATE POLICY "Account owners can view invitation events" ON invitation_events
  FOR SELECT USING (
    invitation_id IN (
      SELECT ai.id FROM account_invitations ai
      JOIN account_users au ON ai.account_id = au.account_id
      WHERE au.user_id = auth.uid() AND au.role = 'owner'
    )
  );

-- Allow service role to insert events (for tracking)
CREATE POLICY "Service role can manage invitation events" ON invitation_events
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Function to log invitation events
CREATE OR REPLACE FUNCTION log_invitation_event(
  p_invitation_id UUID,
  p_event_type TEXT,
  p_event_data JSONB DEFAULT '{}',
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO invitation_events (
    invitation_id,
    event_type,
    event_data,
    user_agent,
    ip_address
  ) VALUES (
    p_invitation_id,
    p_event_type,
    p_event_data,
    p_user_agent,
    p_ip_address
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get invitation analytics for an account
CREATE OR REPLACE FUNCTION get_invitation_analytics(p_account_id UUID)
RETURNS TABLE (
  invitation_id UUID,
  email TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  sent_count BIGINT,
  opened_count BIGINT,
  clicked_count BIGINT,
  last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ai.id as invitation_id,
    ai.email,
    ai.role,
    ai.created_at,
    ai.expires_at,
    ai.accepted_at,
    COALESCE(sent.count, 0) as sent_count,
    COALESCE(opened.count, 0) as opened_count,
    COALESCE(clicked.count, 0) as clicked_count,
    events.last_activity
  FROM account_invitations ai
  LEFT JOIN (
    SELECT invitation_id, COUNT(*) as count
    FROM invitation_events 
    WHERE event_type IN ('sent', 'resent')
    GROUP BY invitation_id
  ) sent ON ai.id = sent.invitation_id
  LEFT JOIN (
    SELECT invitation_id, COUNT(*) as count
    FROM invitation_events 
    WHERE event_type = 'opened'
    GROUP BY invitation_id
  ) opened ON ai.id = opened.invitation_id
  LEFT JOIN (
    SELECT invitation_id, COUNT(*) as count
    FROM invitation_events 
    WHERE event_type = 'clicked'
    GROUP BY invitation_id
  ) clicked ON ai.id = clicked.invitation_id
  LEFT JOIN (
    SELECT invitation_id, MAX(created_at) as last_activity
    FROM invitation_events
    GROUP BY invitation_id
  ) events ON ai.id = events.invitation_id
  WHERE ai.account_id = p_account_id
  ORDER BY ai.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comments
COMMENT ON TABLE invitation_events IS 'Tracks invitation engagement events for analytics';
COMMENT ON COLUMN invitation_events.event_type IS 'Type of event: sent, resent, opened, clicked, accepted, expired';
COMMENT ON COLUMN invitation_events.event_data IS 'Additional event metadata (email provider, referrer, etc.)';
COMMENT ON FUNCTION log_invitation_event IS 'Logs invitation events for analytics tracking';
COMMENT ON FUNCTION get_invitation_analytics IS 'Returns invitation analytics summary for an account'; 