-- Add google_reviewer_name field for Google Business Profile imports
-- This allows us to store the Google display name separately from first_name
-- making it easier to merge contacts later

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS google_reviewer_name text;