-- Add RLS policies for authenticated users to import reviews
-- This allows users to import reviews from Google Business Profile

-- Create policy for authenticated users to insert reviews for their accounts
CREATE POLICY "Users can import reviews for their accounts" ON public.review_submissions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Check if the user has access to the business_id through account_users table
        EXISTS (
            SELECT 1 FROM public.account_users
            WHERE account_users.account_id = review_submissions.business_id
            AND account_users.user_id = auth.uid()
        )
    );

-- Create policy for authenticated users to view their imported reviews
CREATE POLICY "Users can view reviews for their accounts" ON public.review_submissions
    FOR SELECT
    TO authenticated
    USING (
        -- Check if the user has access to the business_id through account_users table
        EXISTS (
            SELECT 1 FROM public.account_users
            WHERE account_users.account_id = review_submissions.business_id
            AND account_users.user_id = auth.uid()
        )
    );

-- Create policy for authenticated users to update their imported reviews
CREATE POLICY "Users can update reviews for their accounts" ON public.review_submissions
    FOR UPDATE
    TO authenticated
    USING (
        -- Check if the user has access to the business_id through account_users table
        EXISTS (
            SELECT 1 FROM public.account_users
            WHERE account_users.account_id = review_submissions.business_id
            AND account_users.user_id = auth.uid()
        )
    )
    WITH CHECK (
        -- Check if the user has access to the business_id through account_users table
        EXISTS (
            SELECT 1 FROM public.account_users
            WHERE account_users.account_id = review_submissions.business_id
            AND account_users.user_id = auth.uid()
        )
    );

-- Add comment to document the policies
COMMENT ON POLICY "Users can import reviews for their accounts" ON public.review_submissions 
    IS 'Allows authenticated users to import reviews from external sources like Google Business Profile';
COMMENT ON POLICY "Users can view reviews for their accounts" ON public.review_submissions 
    IS 'Allows authenticated users to view all reviews for their business accounts';
COMMENT ON POLICY "Users can update reviews for their accounts" ON public.review_submissions 
    IS 'Allows authenticated users to update reviews for their business accounts';