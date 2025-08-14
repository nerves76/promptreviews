-- Fix missing tables and columns that are causing errors in the application

-- Create onboarding_tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.onboarding_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    task_id TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, task_id)
);

-- Add missing columns to review_submissions table if they don't exist
DO $$ 
BEGIN
    -- Add first_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'review_submissions' 
                   AND column_name = 'first_name') THEN
        ALTER TABLE public.review_submissions ADD COLUMN first_name TEXT;
    END IF;

    -- Add last_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'review_submissions' 
                   AND column_name = 'last_name') THEN
        ALTER TABLE public.review_submissions ADD COLUMN last_name TEXT;
    END IF;

    -- Add verified column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'review_submissions' 
                   AND column_name = 'verified') THEN
        ALTER TABLE public.review_submissions ADD COLUMN verified BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_account_id ON public.onboarding_tasks(account_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_completed ON public.onboarding_tasks(completed);
CREATE INDEX IF NOT EXISTS idx_review_submissions_verified ON public.review_submissions(verified);

-- Add RLS policies for onboarding_tasks (disabled by default to match current approach)
ALTER TABLE public.onboarding_tasks DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.onboarding_tasks IS 'Tracks onboarding task completion for each account';
COMMENT ON COLUMN public.review_submissions.first_name IS 'First name of the reviewer';
COMMENT ON COLUMN public.review_submissions.last_name IS 'Last name of the reviewer';
COMMENT ON COLUMN public.review_submissions.verified IS 'Whether the review has been verified';