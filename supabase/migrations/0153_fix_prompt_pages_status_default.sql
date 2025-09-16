-- Fix the default status for prompt_pages to be 'draft' instead of 'in_queue'
-- This ensures new individual prompt pages start as drafts by default

-- Update the default value for the status column
ALTER TABLE prompt_pages 
ALTER COLUMN status SET DEFAULT 'draft'::prompt_page_status;

-- Add a comment to document the change
COMMENT ON COLUMN prompt_pages.status IS 'Status of the prompt page. Default is draft for new individual prompt pages.'; 