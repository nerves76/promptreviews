/**
 * Add kickstarters_primary_color to businesses table
 *
 * Creates a separate color field specifically for Kickstarters elements,
 * allowing them to have an independent color from the global primary_color.
 *
 * Migration Date: 2025-10-09
 * Related to: StyleModalPage.tsx kickstarters color picker issue
 */

-- Add kickstarters_primary_color column to businesses table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS kickstarters_primary_color text;

-- Comment on the new column
COMMENT ON COLUMN businesses.kickstarters_primary_color IS 'Dedicated color for Kickstarters elements (independent from primary_color)';

-- Set default value for existing records (use their current primary_color)
UPDATE businesses
SET kickstarters_primary_color = primary_color
WHERE kickstarters_primary_color IS NULL;
