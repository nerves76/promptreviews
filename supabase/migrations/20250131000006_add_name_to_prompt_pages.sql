-- Add name column for public campaigns (if it doesn't exist)
ALTER TABLE prompt_pages 
ADD COLUMN IF NOT EXISTS name text;

-- Add comment
COMMENT ON COLUMN prompt_pages.name IS 'Name of the campaign (required for public campaigns)'; 