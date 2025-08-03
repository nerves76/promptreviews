-- Fix Friendly Note Default Values and Inconsistent Data
-- This migration addresses issues where show_friendly_note was enabled by default
-- but friendly_note content was empty, causing confusion in the UI

-- 1. Disable friendly note display for pages with no content
UPDATE prompt_pages 
SET show_friendly_note = false 
WHERE show_friendly_note = true 
AND (friendly_note IS NULL OR friendly_note = '');

-- 2. Change the default value for new pages to false
ALTER TABLE prompt_pages 
ALTER COLUMN show_friendly_note SET DEFAULT false;

-- 3. Add comment for clarity
COMMENT ON COLUMN prompt_pages.show_friendly_note IS 'Whether to display the friendly note popup. Should only be true when friendly_note has content.';

-- 4. Ensure business_locations table also has correct defaults
UPDATE business_locations 
SET show_friendly_note = false 
WHERE show_friendly_note = true 
AND (friendly_note IS NULL OR friendly_note = '');

ALTER TABLE business_locations 
ALTER COLUMN show_friendly_note SET DEFAULT false;

COMMENT ON COLUMN business_locations.show_friendly_note IS 'Whether to display the friendly note popup for this location. Should only be true when friendly_note has content.';