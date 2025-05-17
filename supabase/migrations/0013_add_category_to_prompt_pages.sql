-- Add category column to prompt_pages table
ALTER TABLE prompt_pages
ADD COLUMN IF NOT EXISTS category TEXT;

-- Update RLS policies to include category
DROP POLICY IF EXISTS "Users can view their own prompt pages" ON prompt_pages;
DROP POLICY IF EXISTS "Users can insert their own prompt pages" ON prompt_pages;
DROP POLICY IF EXISTS "Users can update their own prompt pages" ON prompt_pages;
DROP POLICY IF EXISTS "Users can delete their own prompt pages" ON prompt_pages;

CREATE POLICY "Users can view their own prompt pages"
ON prompt_pages FOR SELECT
TO authenticated
USING (account_id = auth.uid());

CREATE POLICY "Users can insert their own prompt pages"
ON prompt_pages FOR INSERT
TO authenticated
WITH CHECK (account_id = auth.uid());

CREATE POLICY "Users can update their own prompt pages"
ON prompt_pages FOR UPDATE
TO authenticated
USING (account_id = auth.uid())
WITH CHECK (account_id = auth.uid());

CREATE POLICY "Users can delete their own prompt pages"
ON prompt_pages FOR DELETE
TO authenticated
USING (account_id = auth.uid()); 