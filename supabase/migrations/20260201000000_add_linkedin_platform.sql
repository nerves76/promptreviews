-- Add LinkedIn to social_platform_type enum
-- This enables LinkedIn as a social posting platform

DO $$
BEGIN
  -- Check if 'linkedin' value already exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'linkedin'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'social_platform_type')
  ) THEN
    ALTER TYPE public.social_platform_type ADD VALUE 'linkedin';
  END IF;
END
$$;

COMMENT ON TYPE public.social_platform_type IS 'Supported social platforms: bluesky, twitter, slack, linkedin';
