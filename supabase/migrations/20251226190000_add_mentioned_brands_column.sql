-- Add mentioned_brands column to store brand entities found in LLM responses
ALTER TABLE llm_visibility_checks
ADD COLUMN IF NOT EXISTS mentioned_brands jsonb DEFAULT NULL;

COMMENT ON COLUMN llm_visibility_checks.mentioned_brands IS 'Array of brand entities mentioned in the AI response (from DataForSEO brand_entities field)';
