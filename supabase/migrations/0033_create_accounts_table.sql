-- Create accounts table
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'community_grower',
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    is_free BOOLEAN DEFAULT false,
    custom_prompt_page_count INTEGER DEFAULT 0,
    contact_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own account"
    ON public.accounts FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own account"
    ON public.accounts FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own account"
    ON public.accounts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Allow service role to create accounts
CREATE POLICY "Service role can create accounts"
    ON public.accounts FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER handle_accounts_updated_at
    BEFORE UPDATE ON public.accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add comments
COMMENT ON TABLE public.accounts IS 'Stores user account information including plan and trial status';
COMMENT ON COLUMN public.accounts.plan IS 'The user''s subscription plan';
COMMENT ON COLUMN public.accounts.trial_start IS 'When the user''s trial started';
COMMENT ON COLUMN public.accounts.trial_end IS 'When the user''s trial ends';
COMMENT ON COLUMN public.accounts.is_free IS 'Whether the account is marked as free';
COMMENT ON COLUMN public.accounts.custom_prompt_page_count IS 'Number of custom prompt pages created';
COMMENT ON COLUMN public.accounts.contact_count IS 'Number of contacts created'; 