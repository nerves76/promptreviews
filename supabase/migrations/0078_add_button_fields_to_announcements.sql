-- Add button fields to announcements table
-- This migration adds button_text and button_url columns to support button functionality in announcements

-- Add button columns to announcements table
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS button_text TEXT,
ADD COLUMN IF NOT EXISTS button_url TEXT;

-- Add comment to document the new columns
COMMENT ON COLUMN public.announcements.button_text IS 'Optional button text for the announcement';
COMMENT ON COLUMN public.announcements.button_url IS 'Optional button URL for the announcement'; 