-- Add service_name column to prompt_pages table
-- This column is used for service-specific prompt pages

ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS service_name text;

-- Add comment for clarity
COMMENT ON COLUMN prompt_pages.service_name IS 'Name of the service for service-specific prompt pages';

-- Create index for commonly queried field
CREATE INDEX IF NOT EXISTS idx_prompt_pages_service_name ON prompt_pages(service_name); 