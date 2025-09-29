-- Create optimizer_email_sends table for tracking email automation

CREATE TABLE IF NOT EXISTS optimizer_email_sends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES optimizer_leads(id) ON DELETE CASCADE,
  email_type VARCHAR(50) NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_optimizer_email_sends_lead_id ON optimizer_email_sends(lead_id);
CREATE INDEX IF NOT EXISTS idx_optimizer_email_sends_email_type ON optimizer_email_sends(email_type);
CREATE INDEX IF NOT EXISTS idx_optimizer_email_sends_sent_at ON optimizer_email_sends(sent_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_optimizer_email_sends_unique ON optimizer_email_sends(lead_id, email_type, success) WHERE success = true;

-- Enable RLS and restrict access to service role
ALTER TABLE optimizer_email_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "optimizer_email_sends_service_role_full" ON optimizer_email_sends;
CREATE POLICY "optimizer_email_sends_service_role_full" ON optimizer_email_sends
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE optimizer_email_sends IS 'Tracks automated email sends for Google Biz Optimizer leads';
COMMENT ON COLUMN optimizer_email_sends.lead_id IS 'References the optimizer lead who received the email';
COMMENT ON COLUMN optimizer_email_sends.email_type IS 'Type of email sent (welcome, followup, nurture_tips, nurture_case_study, trial_offer)';
COMMENT ON COLUMN optimizer_email_sends.sent_at IS 'When the email was sent';
COMMENT ON COLUMN optimizer_email_sends.success IS 'Whether the email was sent successfully';
COMMENT ON COLUMN optimizer_email_sends.error_message IS 'Error message if send failed';