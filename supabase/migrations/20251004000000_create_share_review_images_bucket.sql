-- Create storage bucket for share review images
-- This bucket stores generated quote card images for social media sharing

-- Create the bucket if it doesn't exist
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'share-review-images',
        'share-review-images',
        true,
        5242880, -- 5MB limit
        ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    )
    ON CONFLICT (id) DO NOTHING;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Bucket share-review-images might already exist: %', SQLERRM;
END $$;

-- Allow authenticated users to upload images to share-review-images bucket
-- Images must be stored in account-scoped folders: {account_id}/{filename}
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname = 'Authenticated users can upload share images'
    ) THEN
        CREATE POLICY "Authenticated users can upload share images"
            ON storage.objects
            FOR INSERT
            TO authenticated
            WITH CHECK (
                bucket_id = 'share-review-images'::text
                AND (storage.foldername(name))[1] IN (
                    SELECT account_id::text
                    FROM account_users
                    WHERE user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Allow public read access to share images (needed for social media previews)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname = 'Public read access for share images'
    ) THEN
        CREATE POLICY "Public read access for share images"
            ON storage.objects
            FOR SELECT
            TO public
            USING (
                bucket_id = 'share-review-images'::text
            );
    END IF;
END $$;

-- Allow authenticated users to update their own account's share images only
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname = 'Authenticated users can update share images'
    ) THEN
        CREATE POLICY "Authenticated users can update share images"
            ON storage.objects
            FOR UPDATE
            TO authenticated
            USING (
                bucket_id = 'share-review-images'::text
                AND (storage.foldername(name))[1] IN (
                    SELECT account_id::text
                    FROM account_users
                    WHERE user_id = auth.uid()
                )
            )
            WITH CHECK (
                bucket_id = 'share-review-images'::text
                AND (storage.foldername(name))[1] IN (
                    SELECT account_id::text
                    FROM account_users
                    WHERE user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Allow authenticated users to delete their own account's share images only
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname = 'Authenticated users can delete share images'
    ) THEN
        CREATE POLICY "Authenticated users can delete share images"
            ON storage.objects
            FOR DELETE
            TO authenticated
            USING (
                bucket_id = 'share-review-images'::text
                AND (storage.foldername(name))[1] IN (
                    SELECT account_id::text
                    FROM account_users
                    WHERE user_id = auth.uid()
                )
            );
    END IF;
END $$;
