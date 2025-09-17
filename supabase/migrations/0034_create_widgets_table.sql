-- Create widgets table (was missing from migration history)
CREATE TABLE IF NOT EXISTS public.widgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'multi',
    title TEXT,
    description TEXT,
    display_count INTEGER DEFAULT 3,
    link_text TEXT,
    link_url TEXT,
    theme_color TEXT DEFAULT '#6366f1',
    font_family TEXT DEFAULT 'Inter',
    corner_radius TEXT DEFAULT 'rounded',
    show_photos BOOLEAN DEFAULT true,
    show_names BOOLEAN DEFAULT true,
    show_ratings BOOLEAN DEFAULT true,
    show_dates BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for account lookups
CREATE INDEX IF NOT EXISTS idx_widgets_account_id ON public.widgets(account_id);

-- Enable RLS
ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;