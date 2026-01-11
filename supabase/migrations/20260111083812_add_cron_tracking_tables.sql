-- ============================================
-- Add Missing Tables/Columns for Cron Jobs
-- ============================================
-- This migration adds:
-- 1. comeback_email_logs table for tracking comeback win-back emails
-- 2. low_balance_warning_count column on accounts for credit warning tracking
-- ============================================

-- ============================================
-- Table: comeback_email_logs
-- Tracks comeback/win-back emails sent to cancelled accounts
-- ============================================
CREATE TABLE IF NOT EXISTS comeback_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  email_type TEXT NOT NULL,  -- e.g., 'comeback_3_months'
  success BOOLEAN NOT NULL DEFAULT false,
  resend_email_id TEXT,  -- ID from Resend API
  days_since_cancel INTEGER,
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_comeback_email_logs_account_id ON comeback_email_logs(account_id);
CREATE INDEX IF NOT EXISTS idx_comeback_email_logs_email_type ON comeback_email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_comeback_email_logs_sent_at ON comeback_email_logs(sent_at DESC);

-- Unique constraint to prevent duplicate emails of same type to same account
CREATE UNIQUE INDEX IF NOT EXISTS idx_comeback_email_logs_unique_send
  ON comeback_email_logs(account_id, email_type);

-- Enable RLS
ALTER TABLE comeback_email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role only (cron jobs use service role)
CREATE POLICY "Service role can manage comeback_email_logs"
  ON comeback_email_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Column: accounts.low_balance_warning_count
-- Tracks number of low balance warnings sent per billing period
-- Reset to 0 on monthly credit refresh
-- ============================================
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS low_balance_warning_count INTEGER DEFAULT 0;

-- ============================================
-- Success message
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Cron tracking tables/columns created successfully';
  RAISE NOTICE 'Tables: comeback_email_logs';
  RAISE NOTICE 'Columns: accounts.low_balance_warning_count';
END $$;
