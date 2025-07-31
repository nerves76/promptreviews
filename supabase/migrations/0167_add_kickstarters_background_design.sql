-- Migration: Add background design option to kickstarters feature
-- Date: 2025-01-27

-- Add background design column to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS kickstarters_background_design BOOLEAN DEFAULT false;

-- Add background design column to prompt_pages table  
ALTER TABLE prompt_pages 
ADD COLUMN IF NOT EXISTS kickstarters_background_design BOOLEAN DEFAULT false;

-- Add background design column to business_locations table
ALTER TABLE business_locations 
ADD COLUMN IF NOT EXISTS kickstarters_background_design BOOLEAN DEFAULT false;

-- Add comments
COMMENT ON COLUMN businesses.kickstarters_background_design IS 'Design style for kickstarters: false for no background (default), true for background';
COMMENT ON COLUMN prompt_pages.kickstarters_background_design IS 'Design style for kickstarters: false for no background (default), true for background';
COMMENT ON COLUMN business_locations.kickstarters_background_design IS 'Design style for kickstarters: false for no background (default), true for background'; 