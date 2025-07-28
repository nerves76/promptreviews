-- Migration: Add photo-specific fields for photo prompt pages
-- Date: 2025-01-31
-- Purpose: Add photo-specific database fields that are missing for photo prompt pages

-- Add photo-specific fields for photo prompt pages
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS photo_context TEXT;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS photo_description TEXT;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS photo_upload_url TEXT;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS photo_display_settings JSONB DEFAULT '{}';

-- Add indexes for photo-specific queries
CREATE INDEX IF NOT EXISTS idx_prompt_pages_photo_context ON prompt_pages(photo_context);
CREATE INDEX IF NOT EXISTS idx_prompt_pages_photo_description ON prompt_pages(photo_description);

-- Add comments to document the new fields
COMMENT ON COLUMN prompt_pages.photo_context IS 'Context or instructions for photo capture';
COMMENT ON COLUMN prompt_pages.photo_description IS 'Description of the photo being requested';
COMMENT ON COLUMN prompt_pages.photo_upload_url IS 'URL where the captured photo is stored';
COMMENT ON COLUMN prompt_pages.photo_display_settings IS 'Settings for how the photo should be displayed (size, position, etc.)'; 