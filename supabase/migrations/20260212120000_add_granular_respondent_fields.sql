-- Add granular respondent field controls to surveys
-- Replaces the 2-toggle system (collect_respondent_info + require_respondent_email)
-- with per-field collect/require booleans for: name, email, phone, business_name

-- Add new columns to surveys table
ALTER TABLE surveys
  ADD COLUMN IF NOT EXISTS collect_name BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS require_name BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS collect_email BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS require_email BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS collect_phone BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS require_phone BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS collect_business_name BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS require_business_name BOOLEAN NOT NULL DEFAULT false;

-- Add respondent_business_name to survey_responses
ALTER TABLE survey_responses
  ADD COLUMN IF NOT EXISTS respondent_business_name TEXT;

-- Migrate existing data: map old toggles to new granular fields
UPDATE surveys
SET
  collect_name = collect_respondent_info,
  collect_email = collect_respondent_info,
  require_email = require_respondent_email
WHERE collect_respondent_info = true;
