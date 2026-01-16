-- ============================================
-- Add full_response column to llm_visibility_checks
-- Stores the cleaned LLM response text (with fluff removed)
-- ============================================

-- Add full_response column
ALTER TABLE llm_visibility_checks
ADD COLUMN IF NOT EXISTS full_response TEXT;

COMMENT ON COLUMN llm_visibility_checks.full_response IS 'Cleaned full LLM response text (max 3000 chars, opening/closing fluff removed)';
