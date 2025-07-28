-- Create visibility type enum
DO $$ BEGIN
    CREATE TYPE prompt_page_visibility AS ENUM ('public', 'individual');
END $$;

-- Add visibility column to prompt_pages table
ALTER TABLE prompt_pages 
ADD COLUMN visibility prompt_page_visibility DEFAULT 'individual';

-- Update existing universal pages to be public
UPDATE prompt_pages 
SET visibility = 'public' 
WHERE type = 'universal';

-- Ensure type enum includes all page types
DO $$ BEGIN
    -- Add missing types if they don't exist
    BEGIN
        ALTER TYPE prompt_page_type ADD VALUE IF NOT EXISTS 'photo';
    EXCEPTION
        WHEN duplicate_object THEN null;
    END;
END $$;

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_prompt_pages_visibility ON prompt_pages(visibility);
CREATE INDEX IF NOT EXISTS idx_prompt_pages_type_visibility ON prompt_pages(type, visibility);

-- Add comment
COMMENT ON COLUMN prompt_pages.visibility IS 'Whether the prompt page is public or individual (personal)'; 