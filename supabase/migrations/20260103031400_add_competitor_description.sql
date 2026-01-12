-- Add description field to competitors table for hover bio cards
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS description TEXT;

-- Add a comment explaining the field
COMMENT ON COLUMN competitors.description IS 'Brief company description (4-5 sentences) shown on hover in comparison tables';
