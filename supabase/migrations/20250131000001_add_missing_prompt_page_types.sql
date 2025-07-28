-- Migration: Add missing prompt page types (event, employee, video) to prompt_page type enum
-- Date: 2025-01-31
-- Purpose: Extend the prompt_page_type enum to support additional page types

-- First, ensure the type column exists
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS type prompt_page_type DEFAULT 'service';

-- Add the missing enum values to prompt_page_type
DO $$
DECLARE
  new_enum_values text[] := ARRAY['universal', 'photo', 'product', 'service', 'event', 'employee', 'video'];
BEGIN
  -- Check if the enum exists and add missing values
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prompt_page_type') THEN
    -- Add missing values one by one
    BEGIN
      ALTER TYPE prompt_page_type ADD VALUE IF NOT EXISTS 'photo';
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;
    
    BEGIN
      ALTER TYPE prompt_page_type ADD VALUE IF NOT EXISTS 'event';
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;
    
    BEGIN
      ALTER TYPE prompt_page_type ADD VALUE IF NOT EXISTS 'employee';
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;
    
    BEGIN
      ALTER TYPE prompt_page_type ADD VALUE IF NOT EXISTS 'video';
    EXCEPTION
      WHEN duplicate_object THEN null;
    END;
  ELSE
    -- Create the enum if it doesn't exist
    CREATE TYPE prompt_page_type AS ENUM ('universal', 'photo', 'product', 'service', 'event', 'employee', 'video');
  END IF;
END $$;

-- Note: UPDATE statements removed to avoid unsafe enum usage during migration
-- These updates should be done in a separate migration after the enum is fully committed

-- Add comment to document the expanded enum values
COMMENT ON COLUMN prompt_pages.type IS 'Type of prompt page (universal, photo, product, service, event, employee, video)';

-- Log the migration completion
DO $$
BEGIN
  RAISE NOTICE 'Successfully added event, employee, and video to prompt_page_type enum';
END $$; 