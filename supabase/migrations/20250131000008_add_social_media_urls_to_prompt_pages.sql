-- Add social media URL columns to prompt_pages table
-- This migration adds the missing social media URL columns that exist in the businesses table
-- but are missing from the prompt_pages table for inheritance purposes

ALTER TABLE prompt_pages 
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS bluesky_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS pinterest_url TEXT;

-- Add comments for the new columns
COMMENT ON COLUMN prompt_pages.instagram_url IS 'URL to the business Instagram profile (inherited from business profile)';
COMMENT ON COLUMN prompt_pages.bluesky_url IS 'URL to the business Bluesky profile (inherited from business profile)';
COMMENT ON COLUMN prompt_pages.tiktok_url IS 'URL to the business TikTok profile (inherited from business profile)';
COMMENT ON COLUMN prompt_pages.youtube_url IS 'URL to the business YouTube channel (inherited from business profile)';
COMMENT ON COLUMN prompt_pages.linkedin_url IS 'URL to the business LinkedIn page (inherited from business profile)';
COMMENT ON COLUMN prompt_pages.pinterest_url IS 'URL to the business Pinterest profile (inherited from business profile)';
COMMENT ON COLUMN prompt_pages.facebook_url IS 'URL to the business Facebook page (inherited from business profile)'; 