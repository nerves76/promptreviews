-- Create account_users table
CREATE TABLE IF NOT EXISTS public.account_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.account_users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own account_users"
    ON public.account_users FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own account_users"
    ON public.account_users FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own account_users"
    ON public.account_users FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own account_users"
    ON public.account_users FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_account_users_account_id ON public.account_users(account_id);
CREATE INDEX IF NOT EXISTS idx_account_users_user_id ON public.account_users(user_id);
CREATE INDEX IF NOT EXISTS idx_account_users_role ON public.account_users(role);

-- Add unique constraint to prevent duplicate user-account relationships
ALTER TABLE public.account_users 
ADD CONSTRAINT unique_user_account UNIQUE (user_id, account_id);

-- Add comments
COMMENT ON TABLE public.account_users IS 'Links users to accounts with roles';
COMMENT ON COLUMN public.account_users.account_id IS 'The account this user belongs to';
COMMENT ON COLUMN public.account_users.user_id IS 'The user ID from auth.users';
COMMENT ON COLUMN public.account_users.role IS 'The role of this user in the account (owner, member, etc.)'; 