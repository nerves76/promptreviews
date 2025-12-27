-- Add a dedicated 'name' field for keyword concepts
-- This is the editable display name, separate from phrase/search terms

-- Add the name column
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS name text;

-- Backfill from phrase for existing records
UPDATE keywords SET name = phrase WHERE name IS NULL;

-- Make it NOT NULL after backfill
ALTER TABLE keywords ALTER COLUMN name SET NOT NULL;

-- Add comment
COMMENT ON COLUMN keywords.name IS 'Editable display name for the keyword concept';
