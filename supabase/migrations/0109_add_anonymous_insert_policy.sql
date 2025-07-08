-- Add missing INSERT policy for anonymous users to submit feedback and reviews
-- This allows anonymous users to submit feedback through prompt pages

-- Add policy to allow anonymous users to insert into review_submissions
CREATE POLICY "Allow anonymous users to insert reviews" ON public.review_submissions
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Add policy to allow anonymous users to insert into analytics_events
CREATE POLICY "Allow anonymous users to insert analytics events" ON public.analytics_events
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Add comment to document the policy
COMMENT ON POLICY "Allow anonymous users to insert reviews" ON public.review_submissions IS 'Allows anonymous users to submit feedback and reviews through prompt pages';
COMMENT ON POLICY "Allow anonymous users to insert analytics events" ON public.analytics_events IS 'Allows anonymous users to track analytics events like review submissions'; 