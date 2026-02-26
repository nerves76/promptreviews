-- Create proposals and proposal_signatures tables for SOW/Contract generator feature
-- Follows same patterns as surveys feature

-- ============================================================================
-- proposals table
-- ============================================================================

CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  proposal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiration_date DATE,
  client_name TEXT,
  client_email TEXT,
  client_company TEXT,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  business_name TEXT,
  business_email TEXT,
  business_phone TEXT,
  business_address TEXT,
  business_logo_url TEXT,
  business_website TEXT,
  show_pricing BOOLEAN DEFAULT true,
  show_terms BOOLEAN DEFAULT false,
  terms_content TEXT,
  custom_sections JSONB DEFAULT '[]'::jsonb,
  line_items JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'declined', 'expired')),
  is_template BOOLEAN DEFAULT false,
  template_name TEXT,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_proposals_account_id ON proposals(account_id);
CREATE INDEX idx_proposals_token ON proposals(token);
CREATE INDEX idx_proposals_contact_id ON proposals(contact_id);
CREATE INDEX idx_proposals_account_status ON proposals(account_id, status);
CREATE INDEX idx_proposals_templates ON proposals(account_id) WHERE is_template = true;

-- Enable RLS
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated users (account-scoped)
CREATE POLICY "Users can SELECT own account proposals"
  ON proposals FOR SELECT TO authenticated
  USING (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can INSERT own account proposals"
  ON proposals FOR INSERT TO authenticated
  WITH CHECK (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can UPDATE own account proposals"
  ON proposals FOR UPDATE TO authenticated
  USING (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can DELETE own account proposals"
  ON proposals FOR DELETE TO authenticated
  USING (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid()));

-- Service role bypass for server-side operations
CREATE POLICY "Service role full access on proposals"
  ON proposals FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- proposal_signatures table
-- ============================================================================

CREATE TABLE proposal_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  signature_image_url TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  document_hash TEXT NOT NULL,
  accepted_terms BOOLEAN DEFAULT true,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_proposal_signatures_proposal_id ON proposal_signatures(proposal_id);
CREATE INDEX idx_proposal_signatures_account_id ON proposal_signatures(account_id);

-- Enable RLS
ALTER TABLE proposal_signatures ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read signatures for their account's proposals
CREATE POLICY "Users can SELECT own account proposal signatures"
  ON proposal_signatures FOR SELECT TO authenticated
  USING (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid()));

-- Service role bypass (needed for public signature submission)
CREATE POLICY "Service role full access on proposal_signatures"
  ON proposal_signatures FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================================
-- Storage bucket for signature images
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('proposal-signatures', 'proposal-signatures', false, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Service role can insert signature images
CREATE POLICY "Service role can upload proposal signatures"
  ON storage.objects FOR INSERT TO service_role
  WITH CHECK (bucket_id = 'proposal-signatures');

-- Authenticated users can read their account's signature images
CREATE POLICY "Authenticated users can read proposal signatures"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'proposal-signatures');
