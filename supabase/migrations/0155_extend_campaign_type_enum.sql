-- Extend prompt_page_campaign_type enum to include universal and location
-- This allows for better categorization of all prompt page types

-- Add the new enum values to prompt_page_campaign_type
DO $$
DECLARE
  new_enum_values text[] := ARRAY['public', 'individual', 'universal', 'location'];
BEGIN
  -- Check if the enum exists and add missing values
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prompt_page_campaign_type') THEN
    -- Add missing values one by one
    BEGIN
      ALTER TYPE prompt_page_campaign_type ADD VALUE IF NOT EXISTS 'universal';
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;
    
    BEGIN
      ALTER TYPE prompt_page_campaign_type ADD VALUE IF NOT EXISTS 'location';
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;
  ELSE
    -- Create the enum if it doesn't exist
    CREATE TYPE prompt_page_campaign_type AS ENUM ('public', 'individual', 'universal', 'location');
  END IF;
END $$;

-- Note: UPDATE statements removed since campaign_type column may not exist yet
-- These updates should be done in a separate migration after the column is confirmed to exist

-- Note: Comment removed since campaign_type column may not exist yet
-- This comment should be added in a separate migration after the column is confirmed to exist

-- Log the migration completion
DO $$
BEGIN
  RAISE NOTICE 'Successfully added universal and location to prompt_page_campaign_type enum';
END $$; 