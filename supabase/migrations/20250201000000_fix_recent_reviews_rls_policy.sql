-- Fix RLS policy for Recent Reviews feature
-- This allows public read access to submitted reviews for the Recent Reviews feature

-- Enable RLS on review_submissions table if not already enabled
ALTER TABLE public.review_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access for submitted reviews" ON public.review_submissions;

-- Create policy for public read access to submitted reviews only
-- This allows the Recent Reviews API to work for anonymous users
CREATE POLICY "Allow public read access for submitted reviews" ON public.review_submissions
FOR SELECT USING (status = 'submitted');

-- Verify the policy was created (this is just for logging during migration)
-- The actual verification will be done by testing the API endpoint