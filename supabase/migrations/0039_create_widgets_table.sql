-- Create widgets table
CREATE TABLE IF NOT EXISTS public.widgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('single', 'multi', 'photo')),
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own widgets
CREATE POLICY "Users can view their own widgets"
    ON public.widgets
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM account_users au 
            WHERE au.account_id = widgets.account_id 
            AND au.user_id = auth.uid()
        )
    );

-- Allow users to insert their own widgets
CREATE POLICY "Users can insert their own widgets"
    ON public.widgets
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM account_users au 
            WHERE au.account_id = widgets.account_id 
            AND au.user_id = auth.uid()
        )
    );

-- Allow users to update their own widgets
CREATE POLICY "Users can update their own widgets"
    ON public.widgets
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM account_users au 
            WHERE au.account_id = widgets.account_id 
            AND au.user_id = auth.uid()
        )
    );

-- Allow users to delete their own widgets
CREATE POLICY "Users can delete their own widgets"
    ON public.widgets
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM account_users au 
            WHERE au.account_id = widgets.account_id 
            AND au.user_id = auth.uid()
        )
    );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_widgets_account_id 
    ON public.widgets(account_id);

CREATE INDEX IF NOT EXISTS idx_widgets_type 
    ON public.widgets(type);

CREATE INDEX IF NOT EXISTS idx_widgets_is_active 
    ON public.widgets(is_active);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_widgets_updated_at 
    BEFORE UPDATE ON public.widgets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 