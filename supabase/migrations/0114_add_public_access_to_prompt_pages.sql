-- Add public access to published prompt pages
-- This allows non-authenticated users to view prompt pages that are published (status = 'in_queue')

-- Add policy to allow public read access to published prompt pages
CREATE POLICY "Allow public read access to published prompt pages" ON public.prompt_pages
    FOR SELECT
    TO public
    USING (status = 'in_queue');

-- Add comment to document the policy
COMMENT ON POLICY "Allow public read access to published prompt pages" ON public.prompt_pages 
    IS 'Allows anonymous users to view prompt pages that are published (status = in_queue)'; 