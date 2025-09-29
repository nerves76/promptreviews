-- Add unsubscribe fields to optimizer_leads table

ALTER TABLE optimizer_leads
ADD COLUMN IF NOT EXISTS email_unsubscribed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_unsubscribed_at TIMESTAMPTZ NULL;

-- Create index for unsubscribe status
CREATE INDEX IF NOT EXISTS idx_optimizer_leads_email_unsubscribed ON optimizer_leads(email_unsubscribed);

-- Update the email service to check unsubscribe status
COMMENT ON COLUMN optimizer_leads.email_unsubscribed IS 'Whether the lead has unsubscribed from emails';
COMMENT ON COLUMN optimizer_leads.email_unsubscribed_at IS 'When the lead unsubscribed from emails';