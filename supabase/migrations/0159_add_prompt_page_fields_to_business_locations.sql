-- Add prompt page fields to business_locations table
-- These columns link locations to their automatically created prompt pages

ALTER TABLE business_locations 
ADD COLUMN IF NOT EXISTS prompt_page_slug TEXT;

ALTER TABLE business_locations 
ADD COLUMN IF NOT EXISTS prompt_page_id UUID REFERENCES prompt_pages(id) ON DELETE SET NULL;

-- Add comments for documentation
COMMENT ON COLUMN business_locations.prompt_page_slug IS 'Slug of the automatically created prompt page for this location';
COMMENT ON COLUMN business_locations.prompt_page_id IS 'ID of the automatically created prompt page for this location'; 