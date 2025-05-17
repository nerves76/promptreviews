-- Add slug field to prompt_pages
ALTER TABLE public.prompt_pages
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Add review text fields to review_platforms
ALTER TABLE public.prompt_pages
ALTER COLUMN review_platforms TYPE JSONB USING review_platforms::JSONB;

-- Create a function to generate a unique slug
CREATE OR REPLACE FUNCTION generate_unique_slug(business_name TEXT, existing_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    slug TEXT;
    counter INTEGER := 1;
BEGIN
    -- Convert business name to slug
    base_slug := LOWER(REGEXP_REPLACE(business_name, '[^a-zA-Z0-9\s-]', '', 'g'));
    base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
    slug := base_slug;

    -- Check if slug exists and append number if needed
    WHILE EXISTS (
        SELECT 1 FROM public.prompt_pages 
        WHERE slug = slug 
        AND (existing_id IS NULL OR id != existing_id)
    ) LOOP
        slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;

    RETURN slug;
END;
$$ LANGUAGE plpgsql; 