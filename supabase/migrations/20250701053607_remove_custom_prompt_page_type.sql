-- Migration: Remove 'custom' from prompt_page_type enum and set default to 'service'
-- 1. Update any existing rows with type 'custom' to 'service'
UPDATE prompt_pages SET type = 'service' WHERE type = 'custom';

-- 2. Drop the default value before changing the column type
ALTER TABLE prompt_pages ALTER COLUMN type DROP DEFAULT;

-- 3. Update metadata_templates table to use text instead of enum
ALTER TABLE metadata_templates ALTER COLUMN page_type TYPE text;

-- 4. Alter the enum to remove 'custom'
DO $$
DECLARE
  new_enum_values text[] := ARRAY['universal', 'photo', 'product', 'service'];
BEGIN
  -- Rename the old enum
  ALTER TYPE prompt_page_type RENAME TO prompt_page_type_old;
  -- Create the new enum
  EXECUTE 'CREATE TYPE prompt_page_type AS ENUM (' || array_to_string(ARRAY(SELECT quote_literal(val) FROM unnest(new_enum_values) val), ',') || ')';
  -- Alter the column to use text temporarily
  ALTER TABLE prompt_pages ALTER COLUMN type TYPE text;
  -- Update the column to use the new enum
  ALTER TABLE prompt_pages ALTER COLUMN type TYPE prompt_page_type USING type::prompt_page_type;
  -- Set default value to 'service'
  ALTER TABLE prompt_pages ALTER COLUMN type SET DEFAULT 'service';
  -- Drop the old enum
  DROP TYPE prompt_page_type_old;
END $$;

-- 5. Update metadata_templates to use the new enum
ALTER TABLE metadata_templates ALTER COLUMN page_type TYPE prompt_page_type USING page_type::prompt_page_type;
