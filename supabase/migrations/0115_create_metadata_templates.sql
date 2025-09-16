-- Create metadata templates table for managing SEO and social media metadata
-- This allows admins to create templates for different prompt page types

-- Update prompt_page_type enum to include new types
DO $$ BEGIN
    -- First check if the enum exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prompt_page_type') THEN
        CREATE TYPE prompt_page_type AS ENUM ('universal', 'service', 'product', 'photo');
    ELSE
        -- Add new values to existing enum if they don't exist
        BEGIN
            ALTER TYPE prompt_page_type ADD VALUE IF NOT EXISTS 'video';
            ALTER TYPE prompt_page_type ADD VALUE IF NOT EXISTS 'event';
            ALTER TYPE prompt_page_type ADD VALUE IF NOT EXISTS 'employee';
        EXCEPTION
            WHEN duplicate_object THEN null;
        END;
    END IF;
END $$;

-- Create metadata templates table
CREATE TABLE IF NOT EXISTS public.metadata_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_type prompt_page_type NOT NULL,
    title_template TEXT,
    description_template TEXT,
    og_title_template TEXT,
    og_description_template TEXT,
    og_image_template TEXT,
    twitter_title_template TEXT,
    twitter_description_template TEXT,
    twitter_image_template TEXT,
    keywords_template TEXT,
    canonical_url_template TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_metadata_templates_page_type ON public.metadata_templates(page_type);
CREATE INDEX IF NOT EXISTS idx_metadata_templates_active ON public.metadata_templates(is_active);

-- Ensure only one active template per page type using partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_metadata_templates_unique_active_per_type 
    ON public.metadata_templates(page_type) 
    WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.metadata_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view metadata templates" ON public.metadata_templates
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.accounts 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

CREATE POLICY "Admins can insert metadata templates" ON public.metadata_templates
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.accounts 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

CREATE POLICY "Admins can update metadata templates" ON public.metadata_templates
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.accounts 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.accounts 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

CREATE POLICY "Admins can delete metadata templates" ON public.metadata_templates
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.accounts 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_metadata_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_metadata_templates_updated_at
    BEFORE UPDATE ON public.metadata_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_metadata_templates_updated_at();

-- Insert default templates for each page type
INSERT INTO public.metadata_templates (page_type, title_template, description_template, og_title_template, og_description_template, keywords_template) VALUES
('universal', 
 'Leave a Review for [business_name]', 
 'Share your experience with [business_name]. Leave a review to help others discover great services.',
 'Review [business_name]',
 'Share your experience with [business_name]. Your feedback helps others make informed decisions.',
 '[business_name], reviews, customer feedback, testimonials'),

('service', 
 'Review [service_name] - [business_name]', 
 'Share your experience with [service_name] from [business_name]. Help others by leaving your honest review.',
 'Review [service_name] at [business_name]',
 'Tell others about your experience with [service_name] from [business_name]. Your review matters.',
 '[business_name], [service_name], service review, customer experience'),

('product', 
 'Review [product_name] - [business_name]', 
 'Share your thoughts on [product_name] from [business_name]. Help others with your honest product review.',
 'Review [product_name] from [business_name]',
 'What did you think of [product_name]? Share your experience to help other customers.',
 '[business_name], [product_name], product review, customer feedback'),

('photo', 
 'Share Your Experience with [business_name]', 
 'Upload a photo and share your experience with [business_name]. Visual reviews help others see what to expect.',
 'Share Your Photo Review of [business_name]',
 'Show others your experience with [business_name] through photos and feedback.',
 '[business_name], photo review, visual testimonial, customer experience');

-- Add comments
COMMENT ON TABLE public.metadata_templates IS 'Templates for SEO and social media metadata for different prompt page types';
COMMENT ON COLUMN public.metadata_templates.page_type IS 'Type of prompt page this template applies to';
COMMENT ON COLUMN public.metadata_templates.title_template IS 'Page title template with variable placeholders';
COMMENT ON COLUMN public.metadata_templates.description_template IS 'Meta description template with variable placeholders';
COMMENT ON COLUMN public.metadata_templates.og_title_template IS 'Open Graph title template';
COMMENT ON COLUMN public.metadata_templates.og_description_template IS 'Open Graph description template';
COMMENT ON COLUMN public.metadata_templates.keywords_template IS 'Meta keywords template with variable placeholders'; 