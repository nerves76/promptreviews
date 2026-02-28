-- Add optional subtitle column to proposal_section_templates
ALTER TABLE proposal_section_templates
  ADD COLUMN IF NOT EXISTS subtitle TEXT;
