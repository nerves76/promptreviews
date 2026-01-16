-- Add fun_facts_button_label column to prompt_pages table
-- Allows users to customize the button text shown on their Prompt Page

ALTER TABLE prompt_pages
ADD COLUMN IF NOT EXISTS fun_facts_button_label TEXT DEFAULT 'Fun facts';

COMMENT ON COLUMN prompt_pages.fun_facts_button_label IS 'Custom label for the fun facts button (e.g., "Fast Facts", "Did You Know", "At a Glance", "Fun facts", "Business Info")';
