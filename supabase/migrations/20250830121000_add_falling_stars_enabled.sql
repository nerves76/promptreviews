-- Add falling_stars_enabled column to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS falling_stars_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN businesses.falling_stars_enabled IS 'Default: Whether falling stars animation is enabled for new prompt pages';