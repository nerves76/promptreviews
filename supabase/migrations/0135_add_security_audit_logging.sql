-- Migration: Add Security Audit Logging
-- Creates comprehensive audit logging for security events and invitation activities

-- Create audit_logs table for security event tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL CHECK (event_category IN ('auth', 'invitation', 'team', 'permission', 'security')),
  resource_type TEXT, -- e.g., 'invitation', 'account_user', 'business'
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_account_id ON audit_logs(account_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_category ON audit_logs(event_category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Enable RLS for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow account owners to view audit logs for their account
CREATE POLICY "Account owners can view their audit logs" ON audit_logs
  FOR SELECT USING (
    account_id IN (
      SELECT au.account_id FROM account_users au
      WHERE au.user_id = auth.uid() AND au.role = 'owner'
    )
  );

-- Allow service role to insert audit logs
CREATE POLICY "Service role can manage audit logs" ON audit_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_account_id UUID,
  p_user_id UUID,
  p_event_type TEXT,
  p_event_category TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT TRUE,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO audit_logs (
    account_id,
    user_id,
    event_type,
    event_category,
    resource_type,
    resource_id,
    details,
    ip_address,
    user_agent,
    success,
    error_message
  ) VALUES (
    p_account_id,
    p_user_id,
    p_event_type,
    p_event_category,
    p_resource_type,
    p_resource_id,
    p_details,
    p_ip_address,
    p_user_agent,
    p_success,
    p_error_message
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get audit logs for an account with pagination
CREATE OR REPLACE FUNCTION get_audit_logs(
  p_account_id UUID,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_event_category TEXT DEFAULT NULL,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  event_type TEXT,
  event_category TEXT,
  resource_type TEXT,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  user_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.user_id,
    al.event_type,
    al.event_category,
    al.resource_type,
    al.resource_id,
    al.details,
    al.ip_address,
    al.user_agent,
    al.success,
    al.error_message,
    al.created_at,
    au.email as user_email
  FROM audit_logs al
  LEFT JOIN auth.users au ON al.user_id = au.id
  WHERE al.account_id = p_account_id
    AND (p_event_category IS NULL OR al.event_category = p_event_category)
    AND (p_start_date IS NULL OR al.created_at >= p_start_date)
    AND (p_end_date IS NULL OR al.created_at <= p_end_date)
  ORDER BY al.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add email domain restrictions table for enhanced security
CREATE TABLE IF NOT EXISTS email_domain_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  policy_type TEXT NOT NULL CHECK (policy_type IN ('whitelist', 'blacklist')),
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id, domain, policy_type)
);

-- Add indexes for email domain policies
CREATE INDEX IF NOT EXISTS idx_email_domain_policies_account_id ON email_domain_policies(account_id);
CREATE INDEX IF NOT EXISTS idx_email_domain_policies_domain ON email_domain_policies(domain);

-- Enable RLS for email_domain_policies
ALTER TABLE email_domain_policies ENABLE ROW LEVEL SECURITY;

-- Allow account owners to manage email domain policies
CREATE POLICY "Account owners can manage email domain policies" ON email_domain_policies
  FOR ALL USING (
    account_id IN (
      SELECT au.account_id FROM account_users au
      WHERE au.user_id = auth.uid() AND au.role = 'owner'
    )
  );

-- Function to check if email domain is allowed for an account
CREATE OR REPLACE FUNCTION is_email_domain_allowed(
  p_account_id UUID,
  p_email TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  email_domain TEXT;
  has_whitelist BOOLEAN;
  is_whitelisted BOOLEAN DEFAULT FALSE;
  is_blacklisted BOOLEAN DEFAULT FALSE;
BEGIN
  -- Extract domain from email
  email_domain := split_part(p_email, '@', 2);
  
  -- Check if account has any whitelist policies
  SELECT EXISTS(
    SELECT 1 FROM email_domain_policies 
    WHERE account_id = p_account_id 
      AND policy_type = 'whitelist' 
      AND is_active = TRUE
  ) INTO has_whitelist;
  
  -- If whitelist exists, check if domain is whitelisted
  IF has_whitelist THEN
    SELECT EXISTS(
      SELECT 1 FROM email_domain_policies 
      WHERE account_id = p_account_id 
        AND domain = email_domain 
        AND policy_type = 'whitelist' 
        AND is_active = TRUE
    ) INTO is_whitelisted;
    
    -- If whitelist exists but domain is not whitelisted, reject
    IF NOT is_whitelisted THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check if domain is blacklisted
  SELECT EXISTS(
    SELECT 1 FROM email_domain_policies 
    WHERE account_id = p_account_id 
      AND domain = email_domain 
      AND policy_type = 'blacklist' 
      AND is_active = TRUE
  ) INTO is_blacklisted;
  
  -- If blacklisted, reject
  IF is_blacklisted THEN
    RETURN FALSE;
  END IF;
  
  -- If we get here, email is allowed
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to automatically update updated_at for email_domain_policies
CREATE OR REPLACE FUNCTION update_email_domain_policies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_email_domain_policies_updated_at ON email_domain_policies;
CREATE TRIGGER trigger_email_domain_policies_updated_at
    BEFORE UPDATE ON email_domain_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_email_domain_policies_updated_at();

-- Add helpful comments
COMMENT ON TABLE audit_logs IS 'Comprehensive audit logging for security events and user activities';
COMMENT ON COLUMN audit_logs.event_category IS 'Category of event: auth, invitation, team, permission, security';
COMMENT ON COLUMN audit_logs.details IS 'Additional event details and context as JSON';
COMMENT ON FUNCTION log_audit_event IS 'Logs security and audit events for tracking and compliance';
COMMENT ON FUNCTION get_audit_logs IS 'Retrieves audit logs for an account with filtering and pagination';

COMMENT ON TABLE email_domain_policies IS 'Email domain whitelist/blacklist policies for account security';
COMMENT ON FUNCTION is_email_domain_allowed IS 'Checks if an email domain is allowed based on account policies'; 