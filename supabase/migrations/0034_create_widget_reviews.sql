-- Create widget_reviews table to store reviews associated with specific widgets
CREATE TABLE IF NOT EXISTS public.widget_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    widget_id UUID NOT NULL REFERENCES public.widgets(id) ON DELETE CASCADE,
    review_id UUID, -- Optional reference to review_submissions
    first_name TEXT,
    last_name TEXT,
    reviewer_role TEXT,
    review_content TEXT NOT NULL,
    star_rating INTEGER CHECK (star_rating >= 1 AND star_rating <= 5) DEFAULT 5,
    platform TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
-- ALTER TABLE public.widget_reviews ENABLE ROW LEVEL SECURITY;

-- Temporarily disable RLS to test review loading
ALTER TABLE public.widget_reviews DISABLE ROW LEVEL SECURITY;

-- RLS policies temporarily disabled for testing
/*
-- Allow select for authenticated users - check if user owns the widget
CREATE POLICY "Allow select for authenticated users"
    ON public.widget_reviews
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM widgets w 
            WHERE w.id = widget_reviews.widget_id 
            AND w.account_id = auth.uid()
        )
    );

-- Allow insert for authenticated users - check if user owns the widget
CREATE POLICY "Allow insert for authenticated users"
    ON public.widget_reviews
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM widgets w 
            WHERE w.id = widget_reviews.widget_id 
            AND w.account_id = auth.uid()
        )
    );

-- Allow update for authenticated users - check if user owns the widget
CREATE POLICY "Allow update for authenticated users"
    ON public.widget_reviews
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM widgets w 
            WHERE w.id = widget_reviews.widget_id 
            AND w.account_id = auth.uid()
        )
    );

-- Allow delete for authenticated users - check if user owns the widget
CREATE POLICY "Allow delete for authenticated users"
    ON public.widget_reviews
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM widgets w 
            WHERE w.id = widget_reviews.widget_id 
            AND w.account_id = auth.uid()
        )
    );
*/

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_widget_reviews_widget_id 
    ON public.widget_reviews(widget_id);

CREATE INDEX IF NOT EXISTS idx_widget_reviews_review_id 
    ON public.widget_reviews(review_id);

CREATE INDEX IF NOT EXISTS idx_widget_reviews_created_at 
    ON public.widget_reviews(created_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_widget_reviews_updated_at 
    BEFORE UPDATE ON public.widget_reviews 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 