-- Create proposal_section_templates table for saving reusable contract sections
CREATE TABLE proposal_section_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_proposal_section_templates_account_id
  ON proposal_section_templates(account_id);

CREATE UNIQUE INDEX idx_proposal_section_templates_account_name
  ON proposal_section_templates(account_id, name);

-- Enable RLS
ALTER TABLE proposal_section_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated users (scoped to their accounts)
CREATE POLICY "Users can SELECT own account section templates"
  ON proposal_section_templates FOR SELECT TO authenticated
  USING (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can INSERT own account section templates"
  ON proposal_section_templates FOR INSERT TO authenticated
  WITH CHECK (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can UPDATE own account section templates"
  ON proposal_section_templates FOR UPDATE TO authenticated
  USING (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can DELETE own account section templates"
  ON proposal_section_templates FOR DELETE TO authenticated
  USING (account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid()));

-- Service role bypass for server-side operations
CREATE POLICY "Service role full access on section templates"
  ON proposal_section_templates FOR ALL TO service_role
  USING (true) WITH CHECK (true);
