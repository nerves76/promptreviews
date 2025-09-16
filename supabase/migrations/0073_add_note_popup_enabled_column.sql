-- Add note_popup_enabled column to prompt_pages table
-- This column controls whether the personalized note pop-up feature is enabled

ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS note_popup_enabled boolean DEFAULT false; 