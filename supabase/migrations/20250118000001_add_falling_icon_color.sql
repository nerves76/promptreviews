-- Add falling_icon_color column to prompt_pages table
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS falling_icon_color text DEFAULT '#fbbf24';

-- Add comment to describe the column
COMMENT ON COLUMN prompt_pages.falling_icon_color IS 'Hex color value for the falling stars animation icons'; 