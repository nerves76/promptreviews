-- Allow anonymous visitors to view prompt pages that are explicitly public
-- Public pages should be accessible regardless of status (in_queue, sent, follow_up, in_progress, complete)
-- Only exclude draft pages from public access
CREATE POLICY "Public can view public prompt pages"
    ON public.prompt_pages
    FOR SELECT
    TO anon
    USING (
        visibility = 'public'
        AND status != 'draft'
    );
