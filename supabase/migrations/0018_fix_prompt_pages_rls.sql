-- Temporarily disable RLS for prompt_pages table
ALTER TABLE prompt_pages DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own prompt pages" ON prompt_pages;
DROP POLICY IF EXISTS "Users can insert their own prompt pages" ON prompt_pages;
DROP POLICY IF EXISTS "Users can update their own prompt pages" ON prompt_pages;
DROP POLICY IF EXISTS "Users can delete their own prompt pages" ON prompt_pages;

-- Recreate policies with explicit TO authenticated
CREATE POLICY "Users can view their own prompt pages"
    ON prompt_pages FOR SELECT
    TO authenticated
    USING (auth.uid() = account_id);

CREATE POLICY "Users can insert their own prompt pages"
    ON prompt_pages FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = account_id);

CREATE POLICY "Users can update their own prompt pages"
    ON prompt_pages FOR UPDATE
    TO authenticated
    USING (auth.uid() = account_id)
    WITH CHECK (auth.uid() = account_id);

CREATE POLICY "Users can delete their own prompt pages"
    ON prompt_pages FOR DELETE
    TO authenticated
    USING (auth.uid() = account_id); 