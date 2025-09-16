-- Add missing columns to widget_reviews table
ALTER TABLE public.widget_reviews 
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS first_name CHARACTER VARYING NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS last_name CHARACTER VARYING NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS star_rating NUMERIC DEFAULT 5;

-- Add missing columns to widgets table
ALTER TABLE public.widgets 
ADD COLUMN IF NOT EXISTS theme JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS widget_type TEXT DEFAULT 'multi',
ADD COLUMN IF NOT EXISTS submit_reviews_enabled BOOLEAN NOT NULL DEFAULT true;

-- Update existing widgets to have the correct widget_type if type column exists
-- This maps the old 'type' column to the new 'widget_type' column
UPDATE public.widgets 
SET widget_type = type 
WHERE widget_type = 'multi' AND type IS NOT NULL;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_widget_reviews_photo_url ON public.widget_reviews(photo_url);
CREATE INDEX IF NOT EXISTS idx_widget_reviews_star_rating ON public.widget_reviews(star_rating);
CREATE INDEX IF NOT EXISTS idx_widgets_theme ON public.widgets USING GIN(theme);
CREATE INDEX IF NOT EXISTS idx_widgets_review_count ON public.widgets(review_count);
CREATE INDEX IF NOT EXISTS idx_widgets_widget_type ON public.widgets(widget_type);
CREATE INDEX IF NOT EXISTS idx_widgets_submit_reviews_enabled ON public.widgets(submit_reviews_enabled);

-- Add constraints for star_rating (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'widget_reviews_star_rating_check') THEN
        ALTER TABLE public.widget_reviews 
        ADD CONSTRAINT widget_reviews_star_rating_check 
        CHECK (star_rating >= 1 AND star_rating <= 5);
    END IF;
END $$;

-- Add constraint for widget_type (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'widgets_widget_type_check') THEN
        ALTER TABLE public.widgets 
        ADD CONSTRAINT widgets_widget_type_check 
        CHECK (widget_type IN ('single', 'multi', 'photo'));
    END IF;
END $$; 