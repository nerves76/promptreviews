-- Create review_submissions table
CREATE TABLE IF NOT EXISTS public.review_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt_page_id UUID NOT NULL REFERENCES public.prompt_pages(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('clicked', 'submitted')),
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.review_submissions ENABLE ROW LEVEL SECURITY;

-- Allow select for authenticated users
CREATE POLICY "Allow select for authenticated users"
    ON public.review_submissions
    FOR SELECT
    TO authenticated
    USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_review_submissions_prompt_page_id 
    ON public.review_submissions(prompt_page_id);

CREATE INDEX IF NOT EXISTS idx_review_submissions_submitted_at 
    ON public.review_submissions(submitted_at); 