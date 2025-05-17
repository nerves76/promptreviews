-- Add social media URL columns to businesses table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS bluesky_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS pinterest_url TEXT;

-- Add comments to describe the new columns
COMMENT ON COLUMN businesses.facebook_url IS 'URL to the business Facebook page';
COMMENT ON COLUMN businesses.instagram_url IS 'URL to the business Instagram profile';
COMMENT ON COLUMN businesses.bluesky_url IS 'URL to the business Bluesky profile';
COMMENT ON COLUMN businesses.tiktok_url IS 'URL to the business TikTok profile';
COMMENT ON COLUMN businesses.youtube_url IS 'URL to the business YouTube channel';
COMMENT ON COLUMN businesses.linkedin_url IS 'URL to the business LinkedIn page';
COMMENT ON COLUMN businesses.pinterest_url IS 'URL to the business Pinterest profile';