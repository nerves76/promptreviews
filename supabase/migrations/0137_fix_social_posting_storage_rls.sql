-- Fix storage RLS policies for social media uploads
-- Allow authenticated users to upload images to social-posts folder in testimonial-photos bucket

-- Add policy for authenticated users to upload to social-posts folder
CREATE POLICY "Authenticated users can upload social media images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'testimonial-photos'::text
        AND (name LIKE 'social-posts/%')
    );

-- Allow authenticated users to read their uploaded social media images  
CREATE POLICY "Authenticated users can read social media images"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'testimonial-photos'::text
        AND (name LIKE 'social-posts/%')
    );

-- Allow public read access to social media images (for Google Business Profile to access)
CREATE POLICY "Public read access for social media images"
    ON storage.objects
    FOR SELECT
    TO public
    USING (
        bucket_id = 'testimonial-photos'::text
        AND (name LIKE 'social-posts/%')
    );

-- Allow authenticated users to delete their social media images
CREATE POLICY "Authenticated users can delete social media images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'testimonial-photos'::text
        AND (name LIKE 'social-posts/%')
    ); 