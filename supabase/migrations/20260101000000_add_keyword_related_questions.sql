-- Add related_questions column to keywords table
-- Stores AI-generated and user-added questions related to the keyword
-- Used for "People Also Ask" tracking and LLM search optimization

ALTER TABLE keywords
ADD COLUMN IF NOT EXISTS related_questions text[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN keywords.related_questions IS 'Questions/queries related to this keyword (e.g., "Where can I find X?"). AI generates 3-5, users can add up to 10 total.';
