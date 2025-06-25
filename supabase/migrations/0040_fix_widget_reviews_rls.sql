-- Fix RLS policies for widget_reviews table
-- This migration adds the necessary RLS policies to allow users to manage their widget reviews

-- Enable RLS on widget_reviews table if not already enabled
ALTER TABLE widget_reviews ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to insert widget reviews (associate reviews with widgets)
CREATE POLICY "Users can associate reviews with their widgets" ON widget_reviews
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM widgets w
            JOIN accounts a ON w.account_id = a.id
            WHERE w.id = widget_reviews.widget_id
            AND a.user_id = auth.uid()
        )
    );

-- Policy for authenticated users to view their widget reviews
CREATE POLICY "Users can view their widget reviews" ON widget_reviews
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM widgets w
            JOIN accounts a ON w.account_id = a.id
            WHERE w.id = widget_reviews.widget_id
            AND a.user_id = auth.uid()
        )
    );

-- Policy for authenticated users to delete their widget reviews
CREATE POLICY "Users can remove reviews from their widgets" ON widget_reviews
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM widgets w
            JOIN accounts a ON w.account_id = a.id
            WHERE w.id = widget_reviews.widget_id
            AND a.user_id = auth.uid()
        )
    );

-- Policy for public read access to widget reviews (for widget display)
CREATE POLICY "Public can view widget reviews" ON widget_reviews
    FOR SELECT TO anon
    USING (true);

-- Policy for authenticated users to view all widget reviews (for widget display)
CREATE POLICY "Authenticated users can view all widget reviews" ON widget_reviews
    FOR SELECT TO authenticated
    USING (true); 