-- Add twitter_url column to businesses table for X/Twitter social media links
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS twitter_url text;

-- Add comment for documentation
COMMENT ON COLUMN businesses.twitter_url IS 'Twitter/X profile URL for the business';
