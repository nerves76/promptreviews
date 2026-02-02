-- Add review_import_completed notification type and preference columns

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'review_import_completed';

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS in_app_review_import BOOLEAN DEFAULT true;

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS email_review_import BOOLEAN DEFAULT true;
