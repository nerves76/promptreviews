-- Add SERP visibility summary columns to rank_checks table
-- These provide quick filtering without parsing the serp_features JSONB

-- PAA (People Also Ask) visibility
ALTER TABLE rank_checks
  ADD COLUMN IF NOT EXISTS paa_question_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paa_ours_count INT DEFAULT 0;

-- AI Overview visibility
ALTER TABLE rank_checks
  ADD COLUMN IF NOT EXISTS ai_overview_present BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_overview_ours_cited BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_overview_citation_count INT DEFAULT 0;

-- Featured Snippet visibility
ALTER TABLE rank_checks
  ADD COLUMN IF NOT EXISTS featured_snippet_present BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS featured_snippet_ours BOOLEAN DEFAULT FALSE;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_rank_checks_paa_ours
  ON rank_checks(account_id, paa_ours_count)
  WHERE paa_ours_count > 0;

CREATE INDEX IF NOT EXISTS idx_rank_checks_ai_cited
  ON rank_checks(account_id, ai_overview_ours_cited)
  WHERE ai_overview_ours_cited = TRUE;

CREATE INDEX IF NOT EXISTS idx_rank_checks_featured_snippet
  ON rank_checks(account_id, featured_snippet_ours)
  WHERE featured_snippet_ours = TRUE;

-- Add comments for documentation
COMMENT ON COLUMN rank_checks.paa_question_count IS 'Number of People Also Ask questions found in SERP';
COMMENT ON COLUMN rank_checks.paa_ours_count IS 'Number of PAA questions where our domain is the answer source';
COMMENT ON COLUMN rank_checks.ai_overview_present IS 'Whether AI Overview appeared in the SERP';
COMMENT ON COLUMN rank_checks.ai_overview_ours_cited IS 'Whether our domain is cited in the AI Overview';
COMMENT ON COLUMN rank_checks.ai_overview_citation_count IS 'Total number of citations in the AI Overview';
COMMENT ON COLUMN rank_checks.featured_snippet_present IS 'Whether a featured snippet appeared in the SERP';
COMMENT ON COLUMN rank_checks.featured_snippet_ours IS 'Whether our domain owns the featured snippet';
