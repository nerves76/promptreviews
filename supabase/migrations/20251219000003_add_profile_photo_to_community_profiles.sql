-- Add profile_photo_url column to community_profiles table
-- This allows users to upload a personal profile photo separate from their business logo

ALTER TABLE community_profiles
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

COMMENT ON COLUMN community_profiles.profile_photo_url IS 'URL to user''s uploaded profile photo in the profile-photos storage bucket. Takes precedence over business logo_url for display in community.';
