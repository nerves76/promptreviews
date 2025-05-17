-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    category TEXT,
    notes TEXT,
    google_url TEXT,
    yelp_url TEXT,
    facebook_url TEXT,
    google_review TEXT,
    yelp_review TEXT,
    facebook_review TEXT,
    google_instructions TEXT,
    yelp_instructions TEXT,
    facebook_instructions TEXT,
    review_rewards TEXT,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create prompt_pages table
CREATE TABLE IF NOT EXISTS prompt_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    client_name TEXT,
    category TEXT,
    notes TEXT,
    google_url TEXT,
    yelp_url TEXT,
    facebook_url TEXT,
    review_platforms JSONB,
    custom_incentive TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    services_offered JSONB,
    outcomes JSONB,
    project_type TEXT,
    offer_enabled BOOLEAN DEFAULT false,
    offer_title TEXT,
    offer_body TEXT,
    is_universal BOOLEAN DEFAULT false,
    team_member TEXT,
    title TEXT,
    location TEXT,
    tone_of_voice TEXT,
    date_completed TIMESTAMP WITH TIME ZONE,
    assigned_team_members JSONB,
    qr_code_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS contacts_account_id_idx ON contacts(account_id);
CREATE INDEX IF NOT EXISTS contacts_email_idx ON contacts(email);
CREATE INDEX IF NOT EXISTS contacts_phone_idx ON contacts(phone);
CREATE INDEX IF NOT EXISTS prompt_pages_account_id_idx ON prompt_pages(account_id);
CREATE INDEX IF NOT EXISTS prompt_pages_email_idx ON prompt_pages(email);
CREATE INDEX IF NOT EXISTS prompt_pages_phone_idx ON prompt_pages(phone);

-- Add RLS policies
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_pages ENABLE ROW LEVEL SECURITY;

-- Contacts policies
CREATE POLICY "Users can view their own contacts"
    ON contacts FOR SELECT
    USING (auth.uid() = account_id);

CREATE POLICY "Users can insert their own contacts"
    ON contacts FOR INSERT
    WITH CHECK (auth.uid() = account_id);

CREATE POLICY "Users can update their own contacts"
    ON contacts FOR UPDATE
    USING (auth.uid() = account_id)
    WITH CHECK (auth.uid() = account_id);

CREATE POLICY "Users can delete their own contacts"
    ON contacts FOR DELETE
    USING (auth.uid() = account_id);

-- Prompt pages policies
CREATE POLICY "Users can view their own prompt pages"
    ON prompt_pages FOR SELECT
    USING (account_id = auth.uid());

CREATE POLICY "Users can insert their own prompt pages"
    ON prompt_pages FOR INSERT
    WITH CHECK (account_id = auth.uid());

CREATE POLICY "Users can update their own prompt pages"
    ON prompt_pages FOR UPDATE
    USING (account_id = auth.uid())
    WITH CHECK (account_id = auth.uid());

CREATE POLICY "Users can delete their own prompt pages"
    ON prompt_pages FOR DELETE
    USING (account_id = auth.uid());

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 