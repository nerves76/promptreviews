-- ============================================
-- ADD ALIAS MATCHING SUPPORT TO KEYWORD SYSTEM
--
-- This migration adds:
-- 1. alias_match_count column to keywords table (separate from review_usage_count)
-- 2. match_type column to keyword_review_matches_v2 to distinguish exact vs alias matches
-- 3. matched_phrase column to keyword_review_matches_v2 (was missing from original migration)
--
-- Design decisions:
-- - review_usage_count: Exact phrase matches only. Used for rotation/staleness detection.
-- - alias_match_count: Alias matches only. For SEO tracking. Does NOT affect rotation.
-- - These counts are kept separate intentionally to prevent alias matches from
--   triggering rotation of suggested phrases.
-- ============================================

-- Add alias_match_count to keywords table
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS alias_match_count INTEGER DEFAULT 0;

COMMENT ON COLUMN keywords.alias_match_count IS 'Count of reviews matching via aliases (for SEO tracking). Does not affect rotation.';

-- Add matched_phrase to keyword_review_matches_v2 (was missing from original migration)
-- This stores the actual phrase that was matched (could be the main phrase or an alias)
ALTER TABLE keyword_review_matches_v2 ADD COLUMN IF NOT EXISTS matched_phrase TEXT;

COMMENT ON COLUMN keyword_review_matches_v2.matched_phrase IS 'The actual phrase that was matched in the review text';

-- Add match_type to keyword_review_matches_v2
-- 'exact' = matched the normalized_phrase directly
-- 'alias' = matched one of the aliases
ALTER TABLE keyword_review_matches_v2 ADD COLUMN IF NOT EXISTS match_type TEXT DEFAULT 'exact';

ALTER TABLE keyword_review_matches_v2 ADD CONSTRAINT keyword_review_matches_v2_match_type_check
  CHECK (match_type IN ('exact', 'alias'));

COMMENT ON COLUMN keyword_review_matches_v2.match_type IS 'How the keyword was matched: exact (normalized_phrase) or alias';

-- Add index for efficient aggregation by match_type
CREATE INDEX IF NOT EXISTS idx_krm_v2_match_type ON keyword_review_matches_v2(keyword_id, match_type);
