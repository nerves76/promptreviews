-- Create Kickstarters System Migration
-- This migration creates the kickstarters table and adds kickstarters configuration columns to existing tables

-- =====================================================
-- 1. CREATE KICKSTARTERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS kickstarters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('PROCESS', 'EXPERIENCE', 'OUTCOMES', 'PEOPLE')),
    is_default BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_kickstarters_category ON kickstarters(category);
CREATE INDEX IF NOT EXISTS idx_kickstarters_default ON kickstarters(is_default);

-- =====================================================
-- 2. ADD KICKSTARTERS COLUMNS TO BUSINESSES TABLE
-- =====================================================

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS kickstarters_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS selected_kickstarters JSONB DEFAULT '[]'::jsonb;

-- Add comments
COMMENT ON COLUMN businesses.kickstarters_enabled IS 'Whether kickstarters feature is enabled for this business';
COMMENT ON COLUMN businesses.selected_kickstarters IS 'Array of selected kickstarter IDs for this business';

-- =====================================================
-- 3. ADD KICKSTARTERS COLUMNS TO PROMPT_PAGES TABLE
-- =====================================================

ALTER TABLE prompt_pages 
ADD COLUMN IF NOT EXISTS kickstarters_enabled BOOLEAN,
ADD COLUMN IF NOT EXISTS selected_kickstarters JSONB;

-- Add comments
COMMENT ON COLUMN prompt_pages.kickstarters_enabled IS 'Whether kickstarters feature is enabled for this prompt page (overrides business setting if not null)';
COMMENT ON COLUMN prompt_pages.selected_kickstarters IS 'Array of selected kickstarter IDs for this prompt page (overrides business setting if not null)';

-- =====================================================
-- 4. ADD KICKSTARTERS COLUMNS TO BUSINESS_LOCATIONS TABLE
-- =====================================================

ALTER TABLE business_locations 
ADD COLUMN IF NOT EXISTS kickstarters_enabled BOOLEAN,
ADD COLUMN IF NOT EXISTS selected_kickstarters JSONB;

-- Add comments
COMMENT ON COLUMN business_locations.kickstarters_enabled IS 'Whether kickstarters feature is enabled for this location (overrides business setting if not null)';
COMMENT ON COLUMN business_locations.selected_kickstarters IS 'Array of selected kickstarter IDs for this location (overrides business setting if not null)';

-- =====================================================
-- 5. POPULATE DEFAULT KICKSTARTERS
-- =====================================================

-- Insert PROCESS category kickstarters
INSERT INTO kickstarters (question, category, is_default) VALUES
('How easy was the process with [Business Name] from start to finish?', 'PROCESS', true),
('Was everything handled smoothly and efficiently by [Business Name]?', 'PROCESS', true),
('What made the experience with [Business Name] feel simple or stress-free?', 'PROCESS', true),
('Was there a moment when you felt especially taken care of by [Business Name]?', 'PROCESS', true),
('What small detail made the process more enjoyable for you?', 'PROCESS', true),
('What stood out about how organized or thoughtful [Business Name]''s process was?', 'PROCESS', true),
('Did anything [Business Name] did make things easier for you?', 'PROCESS', true),
('How did [Business Name] make things simple or clear along the way?', 'PROCESS', true),
('What was your first impression, and what confirmed [Business Name] was the right choice?', 'PROCESS', true),
('Did anything about [Business Name]''s flexibility or approach stand out in a positive way?', 'PROCESS', true);

-- Insert EXPERIENCE category kickstarters
INSERT INTO kickstarters (question, category, is_default) VALUES
('What was the highlight of your experience with [Business Name]?', 'EXPERIENCE', true),
('How would you describe the vibe or energy at [Business Name]?', 'EXPERIENCE', true),
('How did your experience with [Business Name] make you feel in the best way?', 'EXPERIENCE', true),
('What surprised you, in a good way, during your time with [Business Name]?', 'EXPERIENCE', true),
('What''s a small detail you really appreciated about your experience?', 'EXPERIENCE', true),
('What''s one word you''d use to describe [Business Name], and why?', 'EXPERIENCE', true),
('What would you tell a friend who''s thinking about trying [Business Name]?', 'EXPERIENCE', true),
('Was there a moment at [Business Name] that made you smile or say "wow"?', 'EXPERIENCE', true),
('Did anything feel especially thoughtful or caring during your visit with [Business Name]?', 'EXPERIENCE', true),
('What would you say to someone curious about what it''s like to work with [Business Name]?', 'EXPERIENCE', true);

-- Insert OUTCOMES category kickstarters
INSERT INTO kickstarters (question, category, is_default) VALUES
('How did [Business Name]''s product or service help you?', 'OUTCOMES', true),
('What goal did [Business Name] help you achieve?', 'OUTCOMES', true),
('What''s changed for the better since working with [Business Name]?', 'OUTCOMES', true),
('How did [Business Name] meet, or exceed, your expectations?', 'OUTCOMES', true),
('What difference has [Business Name] made in your day-to-day life?', 'OUTCOMES', true),
('What made you choose [Business Name] over other options?', 'OUTCOMES', true),
('Was it worth it? What made working with [Business Name] feel like a great decision?', 'OUTCOMES', true),
('What made [Business Name] stand out from other experiences you''ve had?', 'OUTCOMES', true),
('What keeps you coming back to [Business Name]?', 'OUTCOMES', true),
('Would you recommend [Business Name] to someone else? Why?', 'OUTCOMES', true);

-- Insert PEOPLE category kickstarters
INSERT INTO kickstarters (question, category, is_default) VALUES
('Is there someone at [Business Name] you''d like to thank by name?', 'PEOPLE', true),
('How would you describe the people you met or worked with at [Business Name]?', 'PEOPLE', true),
('Did anyone at [Business Name] go above and beyond? What did they do?', 'PEOPLE', true),
('How did the team at [Business Name] make you feel supported or welcomed?', 'PEOPLE', true),
('What''s one thing someone at [Business Name] did that made it feel personal?', 'PEOPLE', true),
('Who helped you, and how did they make your day better?', 'PEOPLE', true),
('Was anyone at [Business Name] especially helpful, kind, or knowledgeable?', 'PEOPLE', true),
('What stood out about how the team at [Business Name] treated you?', 'PEOPLE', true),
('Did their passion or care come through in your experience with [Business Name]?', 'PEOPLE', true),
('Was there a moment when you felt truly appreciated or cared for at [Business Name]?', 'PEOPLE', true);

-- =====================================================
-- 6. ENABLE RLS AND POLICIES
-- =====================================================

-- Enable RLS on kickstarters table
ALTER TABLE kickstarters ENABLE ROW LEVEL SECURITY;

-- Policy for reading kickstarters (everyone can read default kickstarters)
CREATE POLICY "Everyone can view default kickstarters" ON kickstarters
    FOR SELECT USING (is_default = true);

-- Policy for authenticated users to create custom kickstarters
CREATE POLICY "Authenticated users can create custom kickstarters" ON kickstarters
    FOR INSERT TO authenticated WITH CHECK (is_default = false);

-- Policy for users to view their own custom kickstarters
CREATE POLICY "Users can view their own custom kickstarters" ON kickstarters
    FOR SELECT TO authenticated USING (
        is_default = false AND 
        EXISTS (
            SELECT 1 FROM businesses b 
            WHERE b.account_id = auth.uid() 
            AND (
                b.selected_kickstarters ? kickstarters.id::text OR
                EXISTS (
                    SELECT 1 FROM prompt_pages pp 
                    WHERE pp.account_id = b.account_id 
                    AND pp.selected_kickstarters ? kickstarters.id::text
                ) OR
                EXISTS (
                    SELECT 1 FROM business_locations bl 
                    WHERE bl.account_id = b.account_id 
                    AND bl.selected_kickstarters ? kickstarters.id::text
                )
            )
        )
    );

-- Policy for users to update their own custom kickstarters
CREATE POLICY "Users can update their own custom kickstarters" ON kickstarters
    FOR UPDATE TO authenticated USING (
        is_default = false AND 
        EXISTS (
            SELECT 1 FROM businesses b 
            WHERE b.account_id = auth.uid() 
            AND (
                b.selected_kickstarters ? kickstarters.id::text OR
                EXISTS (
                    SELECT 1 FROM prompt_pages pp 
                    WHERE pp.account_id = b.account_id 
                    AND pp.selected_kickstarters ? kickstarters.id::text
                ) OR
                EXISTS (
                    SELECT 1 FROM business_locations bl 
                    WHERE bl.account_id = b.account_id 
                    AND bl.selected_kickstarters ? kickstarters.id::text
                )
            )
        )
    );

-- Policy for users to delete their own custom kickstarters
CREATE POLICY "Users can delete their own custom kickstarters" ON kickstarters
    FOR DELETE TO authenticated USING (
        is_default = false AND 
        EXISTS (
            SELECT 1 FROM businesses b 
            WHERE b.account_id = auth.uid() 
            AND (
                b.selected_kickstarters ? kickstarters.id::text OR
                EXISTS (
                    SELECT 1 FROM prompt_pages pp 
                    WHERE pp.account_id = b.account_id 
                    AND pp.selected_kickstarters ? kickstarters.id::text
                ) OR
                EXISTS (
                    SELECT 1 FROM business_locations bl 
                    WHERE bl.account_id = b.account_id 
                    AND bl.selected_kickstarters ? kickstarters.id::text
                )
            )
        )
    ); 