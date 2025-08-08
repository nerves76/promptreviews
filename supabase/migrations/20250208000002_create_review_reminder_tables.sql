-- Migration: Create Review Reminder Tables
-- Description: Adds tables for tracking review reminder preferences and sent reminders

-- Create review reminder settings table
CREATE TABLE IF NOT EXISTS review_reminder_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  frequency TEXT DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'disabled')),
  last_reminder_sent TIMESTAMP,
  last_review_check TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create review reminder logs table
CREATE TABLE IF NOT EXISTS review_reminder_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  location_id TEXT, -- Google Business Profile location ID
  review_ids TEXT[], -- Array of review IDs included in reminder
  reminder_type TEXT DEFAULT 'monthly_review',
  sent_at TIMESTAMP DEFAULT NOW(),
  success BOOLEAN,
  error_message TEXT,
  email_sent_to TEXT,
  review_count INTEGER DEFAULT 0
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_review_reminder_settings_user_id ON review_reminder_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_review_reminder_logs_user_id ON review_reminder_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_review_reminder_logs_sent_at ON review_reminder_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_review_reminder_logs_account_id ON review_reminder_logs(account_id);

-- Add RLS policies
ALTER TABLE review_reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_reminder_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for review_reminder_settings
CREATE POLICY "Users can view their own reminder settings" ON review_reminder_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminder settings" ON review_reminder_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminder settings" ON review_reminder_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for review_reminder_logs (read-only for users, full access for service role)
CREATE POLICY "Users can view their own reminder logs" ON review_reminder_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage reminder logs" ON review_reminder_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_review_reminder_settings_updated_at 
  BEFORE UPDATE ON review_reminder_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 