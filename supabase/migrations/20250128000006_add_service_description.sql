-- Add service_description column to prompt_pages table
-- This column is used for service-specific prompt pages

ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS service_description text;

-- Add comment for clarity
COMMENT ON COLUMN prompt_pages.service_description IS 'Description of the service for service-specific prompt pages';

-- Create index for commonly queried field
CREATE INDEX IF NOT EXISTS idx_prompt_pages_service_description ON prompt_pages(service_description); 