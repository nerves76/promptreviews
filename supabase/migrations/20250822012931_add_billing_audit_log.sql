-- Create billing audit log table for tracking all billing-related events
CREATE TABLE IF NOT EXISTS billing_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  event_source VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  stripe_event_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  old_plan VARCHAR(50),
  new_plan VARCHAR(50),
  old_billing_period VARCHAR(20),
  new_billing_period VARCHAR(20),
  amount INTEGER,
  currency VARCHAR(3),
  error_message TEXT,
  ip_address INET,
  user_agent TEXT
);

-- Create indexes for common queries
CREATE INDEX idx_billing_audit_account_id ON billing_audit_log(account_id);
CREATE INDEX idx_billing_audit_created_at ON billing_audit_log(created_at);
CREATE INDEX idx_billing_audit_event_type ON billing_audit_log(event_type);
CREATE INDEX idx_billing_audit_stripe_customer ON billing_audit_log(stripe_customer_id);
CREATE INDEX idx_billing_audit_stripe_subscription ON billing_audit_log(stripe_subscription_id);

-- Enable RLS
ALTER TABLE billing_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policy for service role only (audit logs should not be directly accessible)
CREATE POLICY "Service role can manage billing audit logs" ON billing_audit_log
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Add comment
COMMENT ON TABLE billing_audit_log IS 'Audit log for all billing-related events including plan changes, payments, and errors';