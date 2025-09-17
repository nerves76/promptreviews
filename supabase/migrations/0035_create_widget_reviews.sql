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

-- Enable RLS
ALTER TABLE public.widget_reviews ENABLE ROW LEVEL SECURITY;

-- Create index for widget lookups
CREATE INDEX IF NOT EXISTS idx_widget_reviews_widget_id ON public.widget_reviews(widget_id);