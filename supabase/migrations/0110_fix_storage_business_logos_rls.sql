-- Fix storage bucket RLS policies for business logo uploads
-- The current policies don't properly handle the business-logos folder path

-- Drop conflicting policies for logos bucket
DROP POLICY IF EXISTS "Allow authenticated users to upload and read logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload and read logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update and read logos 1peuqw_0" ON storage.objects;
DROP POLICY IF EXISTS "allow authenticated users to delete logo 1peuqw_0" ON storage.objects;

-- Drop existing policies that we're about to recreate
DROP POLICY IF EXISTS "Authenticated users can upload business logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update business logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete business logos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read logos" ON storage.objects;

-- Create comprehensive policy for logos bucket that allows authenticated users to upload to business-logos folder
CREATE POLICY "Authenticated users can upload business logos"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'logos'::text
        AND (name LIKE 'business-logos/%' OR name LIKE 'logos/%')
    );

-- Allow authenticated users to update their business logos
CREATE POLICY "Authenticated users can update business logos"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'logos'::text
        AND (name LIKE 'business-logos/%' OR name LIKE 'logos/%')
    );

-- Allow authenticated users to delete their business logos
CREATE POLICY "Authenticated users can delete business logos"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'logos'::text
        AND (name LIKE 'business-logos/%' OR name LIKE 'logos/%')
    );

-- Allow public read access to logos
CREATE POLICY "Public read access for logos"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'logos'::text);

-- Allow authenticated users to read logos
CREATE POLICY "Authenticated users can read logos"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'logos'::text); 