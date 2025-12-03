-- Add role_field_enabled column to prompt_pages table
-- This controls whether the "Role or occupation" input field is shown on prompt pages
-- Default is true for backwards compatibility, but should be false for catch-all/universal pages

ALTER TABLE prompt_pages
ADD COLUMN IF NOT EXISTS role_field_enabled BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN prompt_pages.role_field_enabled IS 'Whether to show the Role/Occupation input field on the prompt page';

-- Set role_field_enabled to false for existing universal/catch-all pages
UPDATE prompt_pages SET role_field_enabled = false WHERE is_universal = true AND role_field_enabled IS NULL;
UPDATE prompt_pages SET role_field_enabled = false WHERE is_universal = true;
