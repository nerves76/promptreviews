-- Create keyword_research_results table for storing per-term volume data
-- This table stores research results independently from keyword concepts,
-- allowing multiple terms with their own volume data to be linked to a single concept.

CREATE TABLE IF NOT EXISTS keyword_research_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

  -- The researched term
  term TEXT NOT NULL,
  normalized_term TEXT NOT NULL,

  -- Volume metrics from DataForSEO
  search_volume INTEGER,
  cpc NUMERIC(10,2),
  competition NUMERIC(5,4),
  competition_level TEXT,  -- 'LOW', 'MEDIUM', 'HIGH'

  -- Trend data (JSONB for flexible storage)
  search_volume_trend JSONB,
  monthly_searches JSONB,

  -- Location context
  location_code INTEGER NOT NULL,
  location_name TEXT NOT NULL,

  -- Link to keyword concept (optional)
  keyword_id UUID REFERENCES keywords(id) ON DELETE SET NULL,
  linked_at TIMESTAMPTZ,

  -- Metadata
  researched_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Unique constraint: one result per term+location per account
  UNIQUE(account_id, normalized_term, location_code)
);

-- Indexes for efficient lookups
CREATE INDEX idx_krr_account ON keyword_research_results(account_id);
CREATE INDEX idx_krr_keyword ON keyword_research_results(keyword_id) WHERE keyword_id IS NOT NULL;
CREATE INDEX idx_krr_term ON keyword_research_results(normalized_term);

-- Row Level Security
ALTER TABLE keyword_research_results ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their account's research results
CREATE POLICY "Users can manage their account research results"
  ON keyword_research_results
  FOR ALL
  USING (
    account_id IN (
      SELECT account_id FROM account_users WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_keyword_research_results_updated_at
  BEFORE UPDATE ON keyword_research_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
