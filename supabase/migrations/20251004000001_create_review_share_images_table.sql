-- Create table to track generated share images
-- This helps with cleanup and regeneration logic

CREATE TABLE IF NOT EXISTS review_share_images (
    id TEXT PRIMARY KEY,
    review_id UUID NOT NULL,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    image_type TEXT NOT NULL DEFAULT 'quote_card', -- 'quote_card' or 'existing_photo'
    generated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_review_share_images_review_id ON review_share_images(review_id);
CREATE INDEX IF NOT EXISTS idx_review_share_images_account_id ON review_share_images(account_id);
CREATE INDEX IF NOT EXISTS idx_review_share_images_generated_at ON review_share_images(generated_at);

-- Add RLS policies
ALTER TABLE review_share_images ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access images for their own account
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'review_share_images'
        AND policyname = 'Users can view their account''s share images'
    ) THEN
        CREATE POLICY "Users can view their account's share images"
            ON review_share_images
            FOR SELECT
            USING (
                account_id IN (
                    SELECT account_id
                    FROM account_users
                    WHERE user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Policy: Authenticated users can insert share images for their accounts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'review_share_images'
        AND policyname = 'Users can create share images for their account'
    ) THEN
        CREATE POLICY "Users can create share images for their account"
            ON review_share_images
            FOR INSERT
            WITH CHECK (
                account_id IN (
                    SELECT account_id
                    FROM account_users
                    WHERE user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Policy: Users can delete their account's share images
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'review_share_images'
        AND policyname = 'Users can delete their account''s share images'
    ) THEN
        CREATE POLICY "Users can delete their account's share images"
            ON review_share_images
            FOR DELETE
            USING (
                account_id IN (
                    SELECT account_id
                    FROM account_users
                    WHERE user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON TABLE review_share_images IS 'Tracks generated share images for reviews to enable caching and cleanup';
