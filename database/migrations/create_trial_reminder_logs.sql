-- Create trial_reminder_logs table to track sent reminders
-- Run this script manually in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.trial_reminder_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('trial_reminder', 'trial_expired')),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.trial_reminder_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Service role can manage trial reminder logs"
    ON public.trial_reminder_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create index for efficient lookups
CREATE INDEX idx_trial_reminder_logs_account_id ON public.trial_reminder_logs(account_id);
CREATE INDEX idx_trial_reminder_logs_sent_at ON public.trial_reminder_logs(sent_at);
CREATE INDEX idx_trial_reminder_logs_reminder_type ON public.trial_reminder_logs(reminder_type);

-- Add comments
COMMENT ON TABLE public.trial_reminder_logs IS 'Tracks trial reminder emails sent to users to prevent duplicates';
COMMENT ON COLUMN public.trial_reminder_logs.account_id IS 'The account that received the reminder';
COMMENT ON COLUMN public.trial_reminder_logs.email IS 'The email address the reminder was sent to';
COMMENT ON COLUMN public.trial_reminder_logs.reminder_type IS 'Type of reminder (trial_reminder or trial_expired)';
COMMENT ON COLUMN public.trial_reminder_logs.sent_at IS 'When the reminder was sent';
COMMENT ON COLUMN public.trial_reminder_logs.success IS 'Whether the email was sent successfully';
COMMENT ON COLUMN public.trial_reminder_logs.error_message IS 'Error message if the email failed to send'; 