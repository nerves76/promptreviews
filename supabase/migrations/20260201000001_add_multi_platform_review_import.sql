-- Migration: Add multi-platform review import support
-- Adds generic external review ID columns for cross-platform dedup
-- Adds dataforseo_import source channel

-- 1a. Add generic external review ID for cross-platform dedup
ALTER TABLE review_submissions
  ADD COLUMN IF NOT EXISTS external_review_id TEXT,
  ADD COLUMN IF NOT EXISTS external_platform TEXT;

-- 1b. Create unique index for cross-platform dedup
-- Only enforces uniqueness where external_review_id is not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_review_submissions_external_dedup
  ON review_submissions(account_id, external_platform, external_review_id)
  WHERE external_review_id IS NOT NULL;

-- 1c. Backfill existing Google imports so they participate in dedup
UPDATE review_submissions
SET external_review_id = google_review_id,
    external_platform = 'google'
WHERE google_review_id IS NOT NULL
  AND external_review_id IS NULL;

-- 1d. Add new source_channel enum value for DataForSEO imports
ALTER TYPE review_source_channel ADD VALUE IF NOT EXISTS 'dataforseo_import';
