-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can insert their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON contacts;

-- Recreate policies with explicit TO authenticated
CREATE POLICY "Users can view their own contacts"
    ON contacts FOR SELECT
    TO authenticated
    USING (auth.uid() = account_id);

CREATE POLICY "Users can insert their own contacts"
    ON contacts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = account_id);

CREATE POLICY "Users can update their own contacts"
    ON contacts FOR UPDATE
    TO authenticated
    USING (auth.uid() = account_id)
    WITH CHECK (auth.uid() = account_id);

CREATE POLICY "Users can delete their own contacts"
    ON contacts FOR DELETE
    TO authenticated
    USING (auth.uid() = account_id); 