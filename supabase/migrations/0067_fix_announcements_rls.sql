-- Fix announcements table RLS policies and ensure proper access
-- This migration ensures the announcements table is accessible to all authenticated users

-- =====================================================
-- ENSURE ANNOUNCEMENTS TABLE EXISTS
-- =====================================================

-- Create announcements table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.admins(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FIX RLS POLICIES FOR ANNOUNCEMENTS
-- =====================================================

-- Enable RLS on announcements table
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all users to read active announcements" ON public.announcements;
DROP POLICY IF EXISTS "Allow admins to manage announcements" ON public.announcements;

-- Create policy to allow all authenticated users to read active announcements
CREATE POLICY "Allow all users to read active announcements" ON public.announcements
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Create policy to allow admins to manage announcements
CREATE POLICY "Allow admins to manage announcements" ON public.announcements
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE account_id = auth.uid() 
            AND admins.id = announcements.created_by
        )
    );

-- =====================================================
-- ENSURE QUOTES TABLE EXISTS AND HAS PROPER RLS
-- =====================================================

-- Create quotes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    text TEXT NOT NULL,
    author TEXT,
    button_text TEXT,
    button_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.admins(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on quotes table
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all users to read active quotes" ON public.quotes;
DROP POLICY IF EXISTS "Allow admins to manage quotes" ON public.quotes;

-- Create policy to allow all authenticated users to read active quotes
CREATE POLICY "Allow all users to read active quotes" ON public.quotes
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Create policy to allow admins to manage quotes
CREATE POLICY "Allow admins to manage quotes" ON public.quotes
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE account_id = auth.uid() 
            AND admins.id = quotes.created_by
        )
    );

-- =====================================================
-- ADD SOME SAMPLE DATA IF TABLES ARE EMPTY
-- =====================================================

-- Insert a sample announcement if none exist
INSERT INTO public.announcements (message, is_active, created_by)
SELECT 
    'Welcome to PromptReviews! We''re excited to help you collect and manage customer reviews.',
    true,
    (SELECT id FROM public.admins LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.announcements WHERE is_active = true);

-- Insert a sample quote if none exist
INSERT INTO public.quotes (text, author, is_active, created_by)
SELECT 
    'Customer reviews are the lifeblood of any business.',
    'Business Wisdom',
    true,
    (SELECT id FROM public.admins LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.quotes WHERE is_active = true); 