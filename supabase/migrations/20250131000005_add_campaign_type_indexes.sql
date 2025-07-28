-- Add campaign_type indexes after the column has been created
-- This migration runs after 20250131_add_campaign_type.sql

-- Add index for campaign type queries
CREATE INDEX IF NOT EXISTS idx_prompt_pages_campaign_type 
ON prompt_pages(campaign_type, account_id, created_at DESC);

-- Update the dashboard index to include campaign_type
-- First drop the existing index if it exists
DROP INDEX IF EXISTS idx_prompt_pages_dashboard;

-- Recreate the dashboard index with campaign_type included
CREATE INDEX IF NOT EXISTS idx_prompt_pages_dashboard 
ON prompt_pages(account_id, is_universal, status, created_at DESC)
INCLUDE (slug, type, review_type, campaign_type);

-- Add comment to document the expanded enum values
COMMENT ON COLUMN prompt_pages.campaign_type IS 'Type of campaign: public, individual, universal, or location';

-- Update existing universal prompt pages to have campaign_type 'universal'
UPDATE prompt_pages 
SET campaign_type = 'universal' 
WHERE is_universal = true AND campaign_type != 'universal';

-- Log the migration completion
DO $$
BEGIN
  RAISE NOTICE 'Successfully added campaign_type indexes and updated existing data';
END $$; 