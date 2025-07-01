-- Add type column to prompt_pages table
-- This allows distinguishing between different types of prompt pages (universal, product, service, etc.)

-- Create prompt_page_type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE prompt_page_type AS ENUM ('universal', 'product', 'service', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add type column to prompt_pages table
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS type prompt_page_type DEFAULT 'custom';

-- Update existing universal prompt pages to have type 'universal'
UPDATE prompt_pages 
SET type = 'universal' 
WHERE is_universal = true;

-- Add index for faster type queries
CREATE INDEX IF NOT EXISTS idx_prompt_pages_type ON prompt_pages(type);
CREATE INDEX IF NOT EXISTS idx_prompt_pages_account_type ON prompt_pages(account_id, type);

-- Add comment to describe the column
COMMENT ON COLUMN prompt_pages.type IS 'Type of prompt page (universal, product, service, custom)'; 