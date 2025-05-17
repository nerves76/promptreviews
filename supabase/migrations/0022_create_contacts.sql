-- Create contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    category TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own contacts"
    ON public.contacts FOR SELECT
    USING (auth.uid() = account_id);

CREATE POLICY "Users can insert their own contacts"
    ON public.contacts FOR INSERT
    WITH CHECK (auth.uid() = account_id);

CREATE POLICY "Users can update their own contacts"
    ON public.contacts FOR UPDATE
    USING (auth.uid() = account_id);

CREATE POLICY "Users can delete their own contacts"
    ON public.contacts FOR DELETE
    USING (auth.uid() = account_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contacts_account_id ON public.contacts(account_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_category ON public.contacts(category);

-- Add comments
COMMENT ON TABLE public.contacts IS 'Table for storing contact information for review requests';
COMMENT ON COLUMN public.contacts.account_id IS 'The ID of the account that owns this contact';
-- COMMENT ON COLUMN public.contacts.name IS 'The name of the contact';
COMMENT ON COLUMN public.contacts.email IS 'The email address of the contact';
COMMENT ON COLUMN public.contacts.phone IS 'The phone number of the contact';
COMMENT ON COLUMN public.contacts.category IS 'Optional category for organizing contacts';
COMMENT ON COLUMN public.contacts.notes IS 'Optional notes about the contact'; 