-- Simple approach to make prompt_page_id nullable
-- This is needed for importing reviews from external sources

-- Make the column nullable
ALTER TABLE public.review_submissions 
ALTER COLUMN prompt_page_id DROP NOT NULL;