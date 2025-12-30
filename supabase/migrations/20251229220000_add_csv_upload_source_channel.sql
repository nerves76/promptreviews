-- Add csv_upload to source_channel enum for tracking spreadsheet imports
-- Note: gbp_import already exists for Google Business Profile imports

-- Add csv_upload value if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'csv_upload' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'review_source_channel')) THEN
    ALTER TYPE review_source_channel ADD VALUE 'csv_upload';
  END IF;
END $$;

-- Backfill source_channel for existing Google imports that don't have it set
UPDATE review_submissions
SET source_channel = 'gbp_import'
WHERE imported_from_google = true
  AND (source_channel IS NULL OR source_channel = 'unknown');

-- Note: Existing CSV uploads will retain 'unknown' source_channel since we can't 
-- reliably distinguish them from other sources. New uploads will have 'csv_upload'.
