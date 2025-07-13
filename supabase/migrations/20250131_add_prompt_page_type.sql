-- Add type column to prompt_pages table
-- This allows distinguishing between different types of prompt pages (universal, product, service, etc.)

-- Create prompt_page_type enum if it doesn't exist, otherwise add missing values
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prompt_page_type') THEN
        CREATE TYPE prompt_page_type AS ENUM ('universal', 'product', 'service', 'custom');
    ELSE
        -- Add 'custom' if it doesn't exist
        BEGIN
            ALTER TYPE prompt_page_type ADD VALUE IF NOT EXISTS 'custom';
        EXCEPTION
            WHEN duplicate_object THEN null;
        END;
    END IF;
END $$;

-- Add type column to prompt_pages table
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS type prompt_page_type DEFAULT 'service';

-- Update existing universal prompt pages to have type 'universal'
UPDATE prompt_pages 
SET type = 'universal' 
WHERE is_universal = true;

-- Add index for faster type queries
CREATE INDEX IF NOT EXISTS idx_prompt_pages_type ON prompt_pages(type);
CREATE INDEX IF NOT EXISTS idx_prompt_pages_account_type ON prompt_pages(account_id, type);

-- Add comment to describe the column
COMMENT ON COLUMN prompt_pages.type IS 'Type of prompt page (universal, product, service, custom)'; 