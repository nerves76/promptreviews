-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can import reviews for their accounts" ON public.review_submissions;
DROP POLICY IF EXISTS "Users can view reviews for their accounts" ON public.review_submissions;
DROP POLICY IF EXISTS "Users can update reviews for their accounts" ON public.review_submissions;

-- Create a simple policy that allows authenticated users to do everything with review_submissions
-- for their own business accounts
CREATE POLICY "Users manage their reviews" ON public.review_submissions
    FOR ALL
    TO authenticated
    USING (
        -- For SELECT operations
        business_id IN (
            SELECT account_id FROM public.account_users
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        -- For INSERT/UPDATE operations
        business_id IN (
            SELECT account_id FROM public.account_users
            WHERE user_id = auth.uid()
        )
    );

-- Add comment to document the policy
COMMENT ON POLICY "Users manage their reviews" ON public.review_submissions 
    IS 'Allows authenticated users full access to reviews for their business accounts';