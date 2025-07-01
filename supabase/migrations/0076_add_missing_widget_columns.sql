-- Add missing columns to widget_reviews table to match review_submissions structure
ALTER TABLE public.widget_reviews 
ADD COLUMN IF NOT EXISTS order_index INTEGER,
ADD COLUMN IF NOT EXISTS emoji_sentiment_selection CHARACTER VARYING(32),
ADD COLUMN IF NOT EXISTS email CHARACTER VARYING(255),
ADD COLUMN IF NOT EXISTS phone CHARACTER VARYING(50),
ADD COLUMN IF NOT EXISTS prompt_page_type TEXT,
ADD COLUMN IF NOT EXISTS review_type TEXT,
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS platform_url TEXT,
ADD COLUMN IF NOT EXISTS business_id UUID,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'submitted',
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS review_group_id UUID DEFAULT gen_random_uuid();

-- Create review_drafts table
CREATE TABLE IF NOT EXISTS public.review_drafts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    prompt_page_id UUID,
    platform TEXT,
    review_text TEXT,
    regeneration_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_widget_reviews_order_index ON public.widget_reviews(order_index);
CREATE INDEX IF NOT EXISTS idx_widget_reviews_verified ON public.widget_reviews(verified);
CREATE INDEX IF NOT EXISTS idx_widget_reviews_review_type ON public.widget_reviews(review_type);
CREATE INDEX IF NOT EXISTS idx_widget_reviews_business_id ON public.widget_reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_widget_reviews_review_group_id ON public.widget_reviews(review_group_id);

-- Add indexes for review_drafts
CREATE INDEX IF NOT EXISTS idx_review_drafts_prompt_page_id ON public.review_drafts(prompt_page_id);
CREATE INDEX IF NOT EXISTS idx_review_drafts_platform ON public.review_drafts(platform);
CREATE INDEX IF NOT EXISTS idx_review_drafts_created_at ON public.review_drafts(created_at);

-- Enable RLS on review_drafts
ALTER TABLE public.review_drafts ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for review_drafts
CREATE POLICY "Allow select for authenticated users" ON public.review_drafts
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert for authenticated users" ON public.review_drafts
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON public.review_drafts
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow delete for authenticated users" ON public.review_drafts
    FOR DELETE TO authenticated USING (true); 