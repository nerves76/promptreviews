-- Add name column for public campaigns
ALTER TABLE prompt_pages 
ADD COLUMN name text;

-- Add comment
COMMENT ON COLUMN prompt_pages.name IS 'Name of the campaign (required for public campaigns)'; 