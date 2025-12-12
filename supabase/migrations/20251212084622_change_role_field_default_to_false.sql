-- Change role_field_enabled default from true to false
-- Role field should be off by default, especially for universal/catch-all pages

ALTER TABLE prompt_pages
ALTER COLUMN role_field_enabled SET DEFAULT false;

-- Also ensure any existing universal pages have it disabled
UPDATE prompt_pages SET role_field_enabled = false WHERE is_universal = true;
