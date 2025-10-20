-- Create storage bucket for profile photos
-- This bucket stores user profile photos for community profiles

-- Create the bucket if it doesn't exist
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'profile-photos',
        'profile-photos',
        true,
        2097152, -- 2MB limit
        ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    )
    ON CONFLICT (id) DO NOTHING;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Bucket profile-photos might already exist: %', SQLERRM;
END $$;

-- Allow authenticated users to upload their own profile photo
-- Images must be stored in user-scoped folders: {user_id}/{filename}
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname = 'Users can upload their own profile photo'
    ) THEN
        CREATE POLICY "Users can upload their own profile photo"
            ON storage.objects
            FOR INSERT
            TO authenticated
            WITH CHECK (
                bucket_id = 'profile-photos'::text
                AND (storage.foldername(name))[1] = auth.uid()::text
            );
    END IF;
END $$;

-- Allow public read access to profile photos (needed for community display)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname = 'Public read access for profile photos'
    ) THEN
        CREATE POLICY "Public read access for profile photos"
            ON storage.objects
            FOR SELECT
            TO public
            USING (
                bucket_id = 'profile-photos'::text
            );
    END IF;
END $$;

-- Allow authenticated users to update their own profile photo only
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname = 'Users can update their own profile photo'
    ) THEN
        CREATE POLICY "Users can update their own profile photo"
            ON storage.objects
            FOR UPDATE
            TO authenticated
            USING (
                bucket_id = 'profile-photos'::text
                AND (storage.foldername(name))[1] = auth.uid()::text
            )
            WITH CHECK (
                bucket_id = 'profile-photos'::text
                AND (storage.foldername(name))[1] = auth.uid()::text
            );
    END IF;
END $$;

-- Allow authenticated users to delete their own profile photo only
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname = 'Users can delete their own profile photo'
    ) THEN
        CREATE POLICY "Users can delete their own profile photo"
            ON storage.objects
            FOR DELETE
            TO authenticated
            USING (
                bucket_id = 'profile-photos'::text
                AND (storage.foldername(name))[1] = auth.uid()::text
            );
    END IF;
END $$;
