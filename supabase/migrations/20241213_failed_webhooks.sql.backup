-- ============================================
-- Failed Webhooks Recovery Table
-- CRITICAL: Stores webhooks that couldn't be processed
-- Enables manual recovery and prevents lost payment data
-- ============================================

CREATE TABLE IF NOT EXISTS failed_webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Webhook identification
  event_id TEXT NOT NULL UNIQUE,  -- Stripe event ID to prevent duplicates
  event_type TEXT NOT NULL,        -- e.g., 'customer.subscription.updated'
  
  -- Customer identification (multiple methods for recovery)
  customer_id TEXT NOT NULL,       -- Stripe customer ID
  subscription_id TEXT,             -- Stripe subscription ID if applicable
  
  -- Full webhook payload for recovery
  payload JSONB NOT NULL,           -- Complete webhook data
  
  -- Error tracking
  error_message TEXT NOT NULL,      -- Why the webhook failed
  retry_count INTEGER DEFAULT 0,    -- Number of retry attempts
  max_retries INTEGER DEFAULT 5,    -- Maximum retries allowed
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'retrying', 'failed', 'recovered')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_retry_at TIMESTAMPTZ,
  recovered_at TIMESTAMPTZ
);

-- Create indexes separately
CREATE INDEX IF NOT EXISTS idx_failed_webhooks_status ON failed_webhooks(status);
CREATE INDEX IF NOT EXISTS idx_failed_webhooks_customer ON failed_webhooks(customer_id);
CREATE INDEX IF NOT EXISTS idx_failed_webhooks_created ON failed_webhooks(created_at DESC);

-- ============================================
-- Add RLS policies for admin access only
-- ============================================
ALTER TABLE failed_webhooks ENABLE ROW LEVEL SECURITY;

-- Only service role can access (for webhook processing)
CREATE POLICY "Service role can manage failed webhooks" ON failed_webhooks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Create function to auto-retry failed webhooks
-- ============================================
CREATE OR REPLACE FUNCTION retry_failed_webhooks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark webhooks ready for retry
  UPDATE failed_webhooks
  SET status = 'pending'
  WHERE status = 'failed'
    AND retry_count < max_retries
    AND created_at > NOW() - INTERVAL '7 days';  -- Only retry recent failures
END;
$$;

-- ============================================
-- Create alert view for admin dashboard
-- ============================================
CREATE OR REPLACE VIEW webhook_failures_summary AS
SELECT 
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest_failure,
  MAX(created_at) as newest_failure,
  AVG(retry_count) as avg_retries
FROM failed_webhooks
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY status;

-- Grant access to authenticated users (for admin dashboard)
GRANT SELECT ON webhook_failures_summary TO authenticated;

-- ============================================
-- Add payment tracking columns to accounts
-- ============================================
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS last_payment_status TEXT,
ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_cancel_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_retry_count INTEGER DEFAULT 0;

-- ============================================
-- Create payment events table for audit trail
-- ============================================
CREATE TABLE IF NOT EXISTS payment_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  
  -- Event details
  event_type TEXT NOT NULL,
  event_source TEXT NOT NULL, -- 'stripe', 'manual', 'system'
  
  -- Payment details
  amount INTEGER,              -- Amount in cents
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL,
  
  -- Stripe references
  stripe_event_id TEXT UNIQUE,
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  
  -- Additional data
  metadata JSONB,
  error_message TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes separately
CREATE INDEX IF NOT EXISTS idx_payment_events_account ON payment_events(account_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_created ON payment_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_events_stripe_event ON payment_events(stripe_event_id);

-- Enable RLS
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

-- Users can see their own payment events
CREATE POLICY "Users can view own payment events" ON payment_events
  FOR SELECT
  TO authenticated
  USING (account_id = auth.uid());

-- Service role has full access
CREATE POLICY "Service role can manage payment events" ON payment_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Add comment for documentation
-- ============================================
COMMENT ON TABLE failed_webhooks IS 'Critical table for webhook failure recovery. Stores webhooks that could not be processed for manual recovery and retry.';
COMMENT ON TABLE payment_events IS 'Audit trail of all payment-related events for debugging and customer support.';