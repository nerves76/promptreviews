-- Migration: Create business_locations table for location-specific prompt pages
-- This enables Maven tier accounts to create location-specific universal prompt pages

-- =====================================================
-- CREATE BUSINESS_LOCATIONS TABLE
-- =====================================================

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
    
    -- Location-specific styling override (optional)
    logo_url TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_location_name_per_account UNIQUE (account_id, name)
);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_business_locations_account_id ON business_locations(account_id);
CREATE INDEX IF NOT EXISTS idx_business_locations_active ON business_locations(account_id, is_active);
CREATE INDEX IF NOT EXISTS idx_business_locations_created_at ON business_locations(created_at);

-- =====================================================
-- ADD LOCATION REFERENCE TO PROMPT_PAGES
-- =====================================================

-- Add location reference to prompt_pages table
ALTER TABLE prompt_pages 
ADD COLUMN IF NOT EXISTS business_location_id UUID REFERENCES business_locations(id) ON DELETE CASCADE;

-- Add index for location-based queries
CREATE INDEX IF NOT EXISTS idx_prompt_pages_location ON prompt_pages(business_location_id);

-- =====================================================
-- ADD LOCATION TRACKING TO ACCOUNTS
-- =====================================================

-- Add location count tracking to accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS location_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_locations INTEGER DEFAULT 0;

-- Update existing accounts based on plan
UPDATE accounts 
SET max_locations = CASE 
    WHEN plan = 'maven' THEN 10
    WHEN plan = 'builder' THEN 0
    WHEN plan = 'grower' THEN 0
    ELSE 0
END
WHERE max_locations = 0; -- Only update if not already set

-- =====================================================
-- CREATE CONSTRAINTS
-- =====================================================

-- Add constraint to ensure logical consistency
-- Either is_universal=true OR business_location_id is not null (but not both for universal)
ALTER TABLE prompt_pages 
ADD CONSTRAINT IF NOT EXISTS check_universal_or_location 
CHECK (
    (is_universal = true AND business_location_id IS NULL) OR 
    (is_universal = false)
);

-- =====================================================
-- ENABLE RLS AND CREATE POLICIES
-- =====================================================

-- Enable RLS on business_locations table
ALTER TABLE business_locations ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own locations
CREATE POLICY "Users can view their account locations" ON business_locations
    FOR SELECT 
    USING (
        account_id IN (
            SELECT account_id FROM account_users 
            WHERE user_id = auth.uid()
        )
    );

-- Allow users to create locations for their account
CREATE POLICY "Users can create locations for their account" ON business_locations
    FOR INSERT 
    WITH CHECK (
        account_id IN (
            SELECT account_id FROM account_users 
            WHERE user_id = auth.uid()
        )
    );

-- Allow users to update their account locations
CREATE POLICY "Users can update their account locations" ON business_locations
    FOR UPDATE 
    USING (
        account_id IN (
            SELECT account_id FROM account_users 
            WHERE user_id = auth.uid()
        )
    );

-- Allow users to delete their account locations
CREATE POLICY "Users can delete their account locations" ON business_locations
    FOR DELETE 
    USING (
        account_id IN (
            SELECT account_id FROM account_users 
            WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- CREATE TRIGGER FUNCTIONS
-- =====================================================

-- Function to enforce location limits
CREATE OR REPLACE FUNCTION check_location_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    max_allowed INTEGER;
BEGIN
    SELECT location_count, max_locations INTO current_count, max_allowed
    FROM accounts WHERE id = NEW.account_id;
    
    IF current_count >= max_allowed THEN
        RAISE EXCEPTION 'Location limit exceeded for this account tier. Current: %, Max: %', current_count, max_allowed;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update location count
CREATE OR REPLACE FUNCTION update_location_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE accounts 
        SET location_count = location_count + 1 
        WHERE id = NEW.account_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE accounts 
        SET location_count = location_count - 1 
        WHERE id = OLD.account_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION handle_business_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

-- Trigger to enforce location limits
CREATE TRIGGER enforce_location_limit
    BEFORE INSERT ON business_locations
    FOR EACH ROW EXECUTE FUNCTION check_location_limit();

-- Trigger to update location count
CREATE TRIGGER update_account_location_count
    AFTER INSERT OR DELETE ON business_locations
    FOR EACH ROW EXECUTE FUNCTION update_location_count();

-- Trigger for updated_at timestamp
CREATE TRIGGER handle_business_locations_updated_at
    BEFORE UPDATE ON business_locations
    FOR EACH ROW EXECUTE FUNCTION handle_business_locations_updated_at();

-- =====================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE business_locations IS 'Business locations for Maven tier multi-location prompt pages';
COMMENT ON COLUMN business_locations.name IS 'Display name for the location (e.g., "Downtown Store")';
COMMENT ON COLUMN business_locations.business_name IS 'Full business name for this location (e.g., "Acme Corp - Downtown")';
COMMENT ON COLUMN business_locations.business_description IS 'Location-specific business description for AI training';
COMMENT ON COLUMN business_locations.unique_aspects IS 'What makes this specific location unique';
COMMENT ON COLUMN business_locations.ai_dos IS 'Location-specific AI generation preferences (what to include)';
COMMENT ON COLUMN business_locations.ai_donts IS 'Location-specific AI generation preferences (what to avoid)';
COMMENT ON COLUMN business_locations.review_platforms IS 'Location-specific review platform configurations';
COMMENT ON COLUMN business_locations.is_active IS 'Whether this location is active and available for use';

COMMENT ON COLUMN prompt_pages.business_location_id IS 'Reference to business location for location-specific prompt pages';
COMMENT ON COLUMN accounts.location_count IS 'Current number of business locations for this account';
COMMENT ON COLUMN accounts.max_locations IS 'Maximum allowed business locations based on plan tier';

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- Verify the migration was successful
SELECT 
    'Migration completed successfully. Business locations table created.' as status,
    COUNT(*) as initial_location_count
FROM business_locations;