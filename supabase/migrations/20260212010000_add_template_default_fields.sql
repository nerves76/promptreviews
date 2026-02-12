-- Add customer-facing default title and description to survey templates
-- These are used when creating surveys from templates (not the internal template name/description)

ALTER TABLE survey_templates
  ADD COLUMN IF NOT EXISTS default_survey_title TEXT,
  ADD COLUMN IF NOT EXISTS default_survey_description TEXT;

-- Set defaults for existing templates
UPDATE survey_templates
SET default_survey_title = 'Customer satisfaction survey',
    default_survey_description = 'Share your feedback with us'
WHERE name = 'Customer satisfaction (CSAT)';

UPDATE survey_templates
SET default_survey_title = 'New client survey',
    default_survey_description = 'Tell us about your business'
WHERE name = 'Agency onboarding';
