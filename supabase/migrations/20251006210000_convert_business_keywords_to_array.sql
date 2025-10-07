-- Convert businesses.keywords from string to array
-- This allows the global keywords to be stored as individual items

-- First, convert existing comma-separated strings to arrays
UPDATE businesses
SET keywords = string_to_array(keywords, ',')
WHERE keywords IS NOT NULL AND keywords != '';

-- Now alter the column type
ALTER TABLE businesses
ALTER COLUMN keywords TYPE TEXT[] USING
  CASE
    WHEN keywords IS NULL THEN ARRAY[]::TEXT[]
    WHEN keywords = '' THEN ARRAY[]::TEXT[]
    ELSE string_to_array(keywords, ',')
  END;

-- Set default to empty array
ALTER TABLE businesses
ALTER COLUMN keywords SET DEFAULT ARRAY[]::TEXT[];

-- Add comment
COMMENT ON COLUMN businesses.keywords IS 'Global keywords array that pre-populates new prompt pages. Each prompt page can then customize their keywords independently.';
