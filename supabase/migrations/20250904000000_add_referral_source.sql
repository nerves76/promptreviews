-- Add referral source columns to businesses table
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS referral_source VARCHAR(50),
ADD COLUMN IF NOT EXISTS referral_source_other TEXT;

-- Add comment to explain the columns
COMMENT ON COLUMN public.businesses.referral_source IS 'How the user heard about Prompt Reviews (google_search, chatgpt, social_media, podcast_blog, online_community, word_of_mouth, conference_event, other)';
COMMENT ON COLUMN public.businesses.referral_source_other IS 'Additional details when referral_source is "other"';