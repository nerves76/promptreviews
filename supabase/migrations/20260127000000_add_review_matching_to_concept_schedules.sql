-- Migration: Add review matching to concept schedules
-- Adds support for scheduled review keyword matching checks

-- Add review_matching_enabled column to concept_schedules
ALTER TABLE concept_schedules
ADD COLUMN IF NOT EXISTS review_matching_enabled boolean NOT NULL DEFAULT false;

-- Add comment explaining the feature
COMMENT ON COLUMN concept_schedules.review_matching_enabled IS 'When true, scheduled runs will scan all reviews for keyword matches and update usage counts';
