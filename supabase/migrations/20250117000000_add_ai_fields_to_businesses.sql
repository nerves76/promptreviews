-- Add AI fields to businesses table
-- These fields are used for AI-generated content preferences

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS ai_dos text,
ADD COLUMN IF NOT EXISTS ai_donts text;

-- Add comments to document the purpose of these columns
COMMENT ON COLUMN businesses.ai_dos IS 'AI-generated content preferences - what the business wants AI to do';
COMMENT ON COLUMN businesses.ai_donts IS 'AI-generated content preferences - what the business does not want AI to do'; 