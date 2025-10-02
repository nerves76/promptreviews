-- Migration: Add style_preset column to businesses table
-- Date: 2025-10-02
-- Description: Track which style preset is selected to prevent misidentification after save/reload

-- Add column to store the selected preset name
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS style_preset TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN businesses.style_preset IS 'Selected style preset name (glassy, solid, paper, snazzy, neon, or custom). Used to preserve preset selection across saves.';

-- Set existing records to NULL (will be detected as custom)
-- Users can re-select their preset and it will save correctly going forward
UPDATE businesses
SET style_preset = NULL
WHERE style_preset IS NULL;
