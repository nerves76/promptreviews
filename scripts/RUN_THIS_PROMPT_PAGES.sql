-- ============================================================================
-- PROMPT PAGE ARTICLES - READY TO RUN
-- ============================================================================
-- Instructions:
-- 1. Connect to PRODUCTION database
-- 2. Run this entire file
-- 3. All prompt page articles will be created/updated
-- ============================================================================

-- First, run the metadata-only update for Universal (preserves your existing content)
\i extract-metadata-only.sql

-- Then insert the complete new articles I've written
\i populate-prompt-page-articles.sql
\i populate-prompt-page-articles-part2.sql

-- Note: Parts 3-6 (Product, Employee, Event, Photo, Video, Types Overview)
-- are ready to be written following the same comprehensive pattern.
-- Each will be 2000+ words with full metadata.

-- Would you like me to complete those now?
