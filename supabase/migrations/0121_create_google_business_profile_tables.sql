-- Create Google Business Profile OAuth tokens table
CREATE TABLE IF NOT EXISTS google_business_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    scopes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create Google Business Locations table
CREATE TABLE IF NOT EXISTS google_business_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    location_id TEXT NOT NULL,
    location_name TEXT NOT NULL,
    address TEXT,
    primary_phone TEXT,
    website_uri TEXT,
    status TEXT DEFAULT 'UNKNOWN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, location_id)
);

-- Enable Row Level Security
ALTER TABLE google_business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_business_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for google_business_profiles
CREATE POLICY "Users can view their own Google Business Profile data" 
    ON google_business_profiles FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Google Business Profile data" 
    ON google_business_profiles FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Google Business Profile data" 
    ON google_business_profiles FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Google Business Profile data" 
    ON google_business_profiles FOR DELETE 
    USING (auth.uid() = user_id);

-- RLS Policies for google_business_locations  
CREATE POLICY "Users can view their own Google Business locations" 
    ON google_business_locations FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Google Business locations" 
    ON google_business_locations FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Google Business locations" 
    ON google_business_locations FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Google Business locations" 
    ON google_business_locations FOR DELETE 
    USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_google_business_profiles_user_id ON google_business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_google_business_locations_user_id ON google_business_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_google_business_locations_location_id ON google_business_locations(location_id); 