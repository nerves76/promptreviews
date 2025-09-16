-- Create RLS policies for post-images storage bucket
-- This migration sets up the proper security policies for the post-images bucket
-- used by Google Business Profile post creation feature

-- Storage bucket creation and policies
-- Note: We need to ensure the bucket exists first
DO $$
BEGIN
  -- Check if bucket exists, create if not
  -- This requires the bucket to be created via dashboard or API first
  -- as SQL cannot directly create storage buckets
  
  -- Check if policies exist before creating them
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated users to upload post images'
  ) THEN
    -- Policy 1: Allow authenticated users to upload images to post-images bucket
    EXECUTE 'CREATE POLICY "Allow authenticated users to upload post images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = ''post-images''
    )';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow public to view post images'
  ) THEN
    -- Policy 2: Allow public to view images (since they need to be accessible via URL for Google API)
    EXECUTE 'CREATE POLICY "Allow public to view post images"
    ON storage.objects
    FOR SELECT
    TO public
    USING (
      bucket_id = ''post-images''
    )';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow users to update their own post images'
  ) THEN
    -- Policy 3: Allow authenticated users to update their own images
    EXECUTE 'CREATE POLICY "Allow users to update their own post images"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = ''post-images'' 
      AND auth.uid() = owner
    )
    WITH CHECK (
      bucket_id = ''post-images''
    )';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow users to delete their own post images'
  ) THEN
    -- Policy 4: Allow authenticated users to delete their own images
    EXECUTE 'CREATE POLICY "Allow users to delete their own post images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = ''post-images''
      AND auth.uid() = owner
    )';
  END IF;

  RAISE NOTICE 'Storage policies for post-images bucket have been configured';
  
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Cannot create storage policies - insufficient privileges. Please create these policies manually in Supabase dashboard:';
    RAISE NOTICE '1. Allow authenticated users to upload to post-images bucket';
    RAISE NOTICE '2. Allow public to view post-images';
    RAISE NOTICE '3. Allow users to update/delete their own images';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating storage policies: %', SQLERRM;
    RAISE NOTICE 'Please create storage policies manually in Supabase dashboard';
END;
$$;