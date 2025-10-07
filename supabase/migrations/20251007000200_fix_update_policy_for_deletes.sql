-- Fix the authors_can_update_own_posts policy to allow soft deletes
-- In PostgreSQL, ALL UPDATE policies' WITH CHECK clauses must pass
-- The existing policy was blocking soft deletes because it didn't explicitly allow them

-- Drop and recreate the update policy to allow deleted_at changes
DROP POLICY IF EXISTS "authors_can_update_own_posts" ON posts;

CREATE POLICY "authors_can_update_own_posts"
    ON posts FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid() AND deleted_at IS NULL)
    WITH CHECK (author_id = auth.uid());

-- Also ensure the delete policy is permissive
DROP POLICY IF EXISTS "authors_can_delete_own_posts" ON posts;

CREATE POLICY "authors_can_delete_own_posts"
    ON posts FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

-- Apply the same fix to comments
DROP POLICY IF EXISTS "authors_can_update_own_comments" ON comments;

CREATE POLICY "authors_can_update_own_comments"
    ON comments FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid() AND deleted_at IS NULL)
    WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "authors_can_delete_own_comments" ON comments;

CREATE POLICY "authors_can_delete_own_comments"
    ON comments FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());
