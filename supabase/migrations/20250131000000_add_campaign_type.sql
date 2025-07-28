-- Create enum type for campaign types
DO $$ BEGIN
    CREATE TYPE prompt_page_campaign_type AS ENUM ('public', 'individual');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE prompt_page_type AS ENUM ('universal', 'service', 'product', 'photo');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add type column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE prompt_pages ADD COLUMN type prompt_page_type;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add campaign_type column with default value
ALTER TABLE prompt_pages 
ADD COLUMN campaign_type prompt_page_campaign_type NOT NULL DEFAULT 'individual';

-- Add name column for public campaigns
ALTER TABLE prompt_pages 
ADD COLUMN name text;

-- Add index for campaign_type
CREATE INDEX idx_prompt_pages_campaign_type ON prompt_pages(campaign_type);

-- Update existing universal pages to be public
UPDATE prompt_pages 
SET campaign_type = 'public' 
WHERE is_universal = true;

-- Add comment
COMMENT ON COLUMN prompt_pages.campaign_type IS 'Type of campaign: public or individual';
COMMENT ON COLUMN prompt_pages.name IS 'Name of the campaign (required for public campaigns)'; 