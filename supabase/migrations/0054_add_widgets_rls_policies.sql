-- Add RLS policies for widgets table
-- Enable RLS if not already enabled
ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;

-- Allow select for authenticated users - check if user owns the widget
CREATE POLICY "Allow select for authenticated users"
    ON public.widgets
    FOR SELECT
    TO authenticated
    USING (account_id = auth.uid());

-- Allow insert for authenticated users
CREATE POLICY "Allow insert for authenticated users"
    ON public.widgets
    FOR INSERT
    TO authenticated
    WITH CHECK (account_id = auth.uid());

-- Allow update for authenticated users - check if user owns the widget
CREATE POLICY "Allow update for authenticated users"
    ON public.widgets
    FOR UPDATE
    TO authenticated
    USING (account_id = auth.uid())
    WITH CHECK (account_id = auth.uid());

-- Allow delete for authenticated users - check if user owns the widget
CREATE POLICY "Allow delete for authenticated users"
    ON public.widgets
    FOR DELETE
    TO authenticated
    USING (account_id = auth.uid());

-- Allow public read access for widget embedding (widgets need to be readable by anyone)
CREATE POLICY "Allow public read access"
    ON public.widgets
    FOR SELECT
    TO anon
    USING (true);

-- Add RLS policies for widget_reviews table
-- Enable RLS
ALTER TABLE public.widget_reviews ENABLE ROW LEVEL SECURITY;

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

-- Allow public read access for widget embedding (reviews need to be readable by anyone)
CREATE POLICY "Allow public read access"
    ON public.widget_reviews
    FOR SELECT
    TO anon
    USING (true); 