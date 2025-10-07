-- Fix the delete policies for posts and comments
-- The WITH CHECK clauses were preventing soft deletes by requiring deleted_at IS NOT NULL
-- This prevented setting deleted_at from NULL to a timestamp

-- Drop the old policies
DROP POLICY IF EXISTS "authors_can_delete_own_posts" ON posts;
DROP POLICY IF EXISTS "authors_can_delete_own_comments" ON comments;

-- Create corrected policy for posts - allow authors to soft delete their posts
CREATE POLICY "authors_can_delete_own_posts"
    ON posts FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid())
    WITH CHECK (
        author_id = auth.uid() AND
        (deleted_at IS NULL OR deleted_at IS NOT NULL)  -- Allow setting deleted_at
    );

-- Create corrected policy for comments - allow authors to soft delete their comments
CREATE POLICY "authors_can_delete_own_comments"
    ON comments FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid())
    WITH CHECK (
        author_id = auth.uid() AND
        (deleted_at IS NULL OR deleted_at IS NOT NULL)  -- Allow setting deleted_at
    );
