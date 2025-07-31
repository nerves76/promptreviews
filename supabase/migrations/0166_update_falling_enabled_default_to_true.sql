-- Update falling_enabled column default value to true for new prompt pages
ALTER TABLE prompt_pages ALTER COLUMN falling_enabled SET DEFAULT true;

-- Update business_locations falling_enabled column default value to true as well
ALTER TABLE business_locations ALTER COLUMN falling_enabled SET DEFAULT true;

-- Update existing NULL or false values to true for better user experience
UPDATE prompt_pages SET falling_enabled = true WHERE falling_enabled IS NULL OR falling_enabled = false;
UPDATE business_locations SET falling_enabled = true WHERE falling_enabled IS NULL OR falling_enabled = false;

-- Add comment explaining the change
COMMENT ON COLUMN prompt_pages.falling_enabled IS 'Whether the falling stars animation is enabled for this prompt page (default: true for better UX)';
COMMENT ON COLUMN business_locations.falling_enabled IS 'Whether the falling stars animation is enabled for this business location (default: true for better UX)'; 