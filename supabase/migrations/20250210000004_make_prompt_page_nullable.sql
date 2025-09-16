-- Make prompt_page_id nullable for imported reviews
-- Reviews imported from Google Business Profile don't have associated prompt pages

ALTER TABLE public.review_submissions 
ALTER COLUMN prompt_page_id DROP NOT NULL;

-- Add comment to document the change
COMMENT ON COLUMN public.review_submissions.prompt_page_id IS 'Reference to prompt page. NULL for reviews imported from external sources like Google Business Profile.';