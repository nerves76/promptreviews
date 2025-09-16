-- Add falling_enabled column to prompt_pages table
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS falling_enabled boolean DEFAULT false;

-- Add comment to describe the column
COMMENT ON COLUMN prompt_pages.falling_enabled IS 'Whether the falling stars animation is enabled for this prompt page';
