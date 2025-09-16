-- Create business_locations table for location-specific prompt pages
CREATE TABLE IF NOT EXISTS business_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., "Downtown Seattle Location"
    business_name TEXT, -- e.g., "Acme Dental - Downtown"
    
    -- Address Information
    address_street TEXT,
    address_city TEXT,
    address_state TEXT,
    address_zip TEXT,
    address_country TEXT,
    
    -- Location-Specific Business Details
    business_description TEXT, -- Location-specific description
    unique_aspects TEXT, -- What makes this location unique
    phone TEXT,
    email TEXT,
    website_url TEXT,
    
    -- AI Training Fields (location-specific)
    ai_dos TEXT, -- Location-specific AI dos
    ai_donts TEXT, -- Location-specific AI don'ts
    
    -- Location-specific review platforms override
    review_platforms JSONB,
    
    -- Location-specific styling override
    logo_url TEXT,
    
    -- Additional operational fields
    hours TEXT, -- Operating hours
    manager_name TEXT,
    manager_email TEXT,
    parking_info TEXT,
    accessibility_info TEXT,
    
    -- Custom styling overrides
    primary_color TEXT,
    secondary_color TEXT,
    custom_css TEXT,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_business_locations_account_id ON business_locations(account_id);
CREATE INDEX idx_business_locations_active ON business_locations(account_id, is_active);

-- Add location reference to prompt_pages
ALTER TABLE prompt_pages 
ADD COLUMN IF NOT EXISTS business_location_id UUID REFERENCES business_locations(id) ON DELETE CASCADE;

-- Add index for location-based queries
CREATE INDEX IF NOT EXISTS idx_prompt_pages_location ON prompt_pages(business_location_id);

-- Add constraint to ensure logical consistency
ALTER TABLE prompt_pages 
DROP CONSTRAINT IF EXISTS check_universal_or_location;

ALTER TABLE prompt_pages 
ADD CONSTRAINT check_universal_or_location 
CHECK (
    (is_universal = true AND business_location_id IS NULL) OR 
    (is_universal = false)
);

-- Create RLS policies for business_locations
ALTER TABLE business_locations ENABLE ROW LEVEL SECURITY;

-- Users can view locations for their account
CREATE POLICY "Users can view own business locations"
    ON business_locations
    FOR SELECT
    USING (
        account_id IN (
            SELECT account_id FROM account_users WHERE user_id = auth.uid()
        )
    );

-- Users can create locations for their account (if they have permission)
CREATE POLICY "Users can create business locations"
    ON business_locations
    FOR INSERT
    WITH CHECK (
        account_id IN (
            SELECT account_id FROM account_users WHERE user_id = auth.uid()
        )
    );

-- Users can update their own business locations
CREATE POLICY "Users can update own business locations"
    ON business_locations
    FOR UPDATE
    USING (
        account_id IN (
            SELECT account_id FROM account_users WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        account_id IN (
            SELECT account_id FROM account_users WHERE user_id = auth.uid()
        )
    );

-- Users can delete their own business locations
CREATE POLICY "Users can delete own business locations"
    ON business_locations
    FOR DELETE
    USING (
        account_id IN (
            SELECT account_id FROM account_users WHERE user_id = auth.uid()
        )
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_locations_updated_at
    BEFORE UPDATE ON business_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 

ALTER TABLE business_locations
ADD CONSTRAINT unique_location_name UNIQUE (name); 