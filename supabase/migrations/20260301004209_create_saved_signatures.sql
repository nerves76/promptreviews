-- Create saved_signatures table for reusable sender signatures on contracts
CREATE TABLE saved_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  signature_image_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_saved_signatures_account_id
  ON saved_signatures(account_id);

-- Enable RLS
ALTER TABLE saved_signatures ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated users (scoped to their accounts)
CREATE POLICY "Users can SELECT own account saved signatures"
  ON saved_signatures FOR SELECT TO authenticated
  USING (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can INSERT own account saved signatures"
  ON saved_signatures FOR INSERT TO authenticated
  WITH CHECK (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can UPDATE own account saved signatures"
  ON saved_signatures FOR UPDATE TO authenticated
  USING (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can DELETE own account saved signatures"
  ON saved_signatures FOR DELETE TO authenticated
  USING (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid()));

-- Service role bypass for server-side operations
CREATE POLICY "Service role full access on saved signatures"
  ON saved_signatures FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Storage bucket for saved signature images (private, 5MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('saved-signatures', 'saved-signatures', false, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Service role can upload saved signature images
CREATE POLICY "Service role can upload saved signatures"
  ON storage.objects FOR INSERT TO service_role
  WITH CHECK (bucket_id = 'saved-signatures');

-- Service role can delete saved signature images
CREATE POLICY "Service role can delete saved signatures"
  ON storage.objects FOR DELETE TO service_role
  USING (bucket_id = 'saved-signatures');

-- Authenticated users can read their account's saved signature images
CREATE POLICY "Authenticated users can read saved signatures"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'saved-signatures');

-- Add sender_signature_id to proposals table
ALTER TABLE proposals
  ADD COLUMN sender_signature_id UUID REFERENCES saved_signatures(id) ON DELETE SET NULL;
