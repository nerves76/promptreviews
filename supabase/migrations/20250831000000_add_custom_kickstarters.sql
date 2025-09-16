-- Add custom_kickstarters field to store user-created kickstarter questions
-- This allows businesses to create and save their own custom questions

-- Add to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS custom_kickstarters JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN businesses.custom_kickstarters IS 'Array of custom kickstarter questions created by the business';

-- Add to prompt_pages table
ALTER TABLE prompt_pages 
ADD COLUMN IF NOT EXISTS custom_kickstarters JSONB DEFAULT NULL;

COMMENT ON COLUMN prompt_pages.custom_kickstarters IS 'Array of custom kickstarter questions for this prompt page (overrides business setting if not null)';

-- Add to business_locations table
ALTER TABLE business_locations 
ADD COLUMN IF NOT EXISTS custom_kickstarters JSONB DEFAULT NULL;

COMMENT ON COLUMN business_locations.custom_kickstarters IS 'Array of custom kickstarter questions for this location (overrides business setting if not null)';

-- Example structure for custom_kickstarters JSONB:
-- [
--   {
--     "id": "custom_1234567890_abc123",
--     "question": "What made your experience special?",
--     "category": "EXPERIENCE"
--   }
-- ]