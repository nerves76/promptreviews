-- Make prompt_page_id nullable in review_submissions table
-- This allows imported reviews (from Google, etc.) to exist without being tied to a prompt page

ALTER TABLE review_submissions
  ALTER COLUMN prompt_page_id DROP NOT NULL;

-- Add comment explaining nullable prompt_page_id
COMMENT ON COLUMN review_submissions.prompt_page_id IS 'Foreign key to prompt_pages. Can be NULL for imported reviews that were not collected through a prompt page.';
