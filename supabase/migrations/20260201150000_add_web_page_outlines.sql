-- Web Page Outlines table
-- Stores AI-generated web page content outlines based on keywords

CREATE TABLE IF NOT EXISTS web_page_outlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword_id UUID REFERENCES keywords(id) ON DELETE SET NULL,
  keyword_phrase TEXT NOT NULL,
  tone TEXT NOT NULL CHECK (tone IN ('professional', 'friendly', 'authoritative', 'casual')),
  business_name TEXT NOT NULL,
  business_info JSONB NOT NULL DEFAULT '{}',
  outline_json JSONB NOT NULL DEFAULT '{}',
  schema_markup JSONB NOT NULL DEFAULT '{}',
  page_title TEXT,
  meta_description TEXT,
  credit_cost INT NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for account-scoped listing (newest first)
CREATE INDEX idx_web_page_outlines_account_created
  ON web_page_outlines (account_id, created_at DESC);

-- RLS policies
ALTER TABLE web_page_outlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Account members can read own outlines"
  ON web_page_outlines FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Account members can insert outlines"
  ON web_page_outlines FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Account members can update own outlines"
  ON web_page_outlines FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- Credit pricing rules for web page outlines
INSERT INTO credit_pricing_rules (feature_type, rule_key, credit_cost, description, is_active)
VALUES
  ('web_page_outline', 'full_generation', 5, 'Full web page outline generation', true),
  ('web_page_outline', 'section_regeneration', 1, 'Regenerate individual section', true)
ON CONFLICT (feature_type, rule_key, active_from) DO NOTHING;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_web_page_outlines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_web_page_outlines_updated_at
  BEFORE UPDATE ON web_page_outlines
  FOR EACH ROW
  EXECUTE FUNCTION update_web_page_outlines_updated_at();
