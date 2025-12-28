-- Add pricing_notes field to comparison_tables for freeform pricing text
-- Structure: { "promptreviews": "Free plan. Paid from $49/mo", "competitor-slug": "From $299/mo" }

ALTER TABLE comparison_tables
ADD COLUMN IF NOT EXISTS pricing_notes jsonb DEFAULT '{}'::jsonb;

-- Add comment
COMMENT ON COLUMN comparison_tables.pricing_notes IS 'Freeform pricing text per competitor. Keys are competitor slugs or "promptreviews"';
