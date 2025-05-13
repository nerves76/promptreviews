-- Add style-related fields to businesses table
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS primary_font text DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS secondary_font text DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#4F46E5',
ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#818CF8',
ADD COLUMN IF NOT EXISTS background_color text DEFAULT '#FFFFFF',
ADD COLUMN IF NOT EXISTS text_color text DEFAULT '#1F2937';

-- Add comment to explain the fields
COMMENT ON COLUMN public.businesses.primary_font IS 'The main font used for headings and important text';
COMMENT ON COLUMN public.businesses.secondary_font IS 'The font used for body text and secondary content';
COMMENT ON COLUMN public.businesses.primary_color IS 'The main brand color used for primary elements';
COMMENT ON COLUMN public.businesses.secondary_color IS 'The secondary brand color used for accents';
COMMENT ON COLUMN public.businesses.background_color IS 'The background color of the prompt page';
COMMENT ON COLUMN public.businesses.text_color IS 'The main text color used throughout the prompt page'; 