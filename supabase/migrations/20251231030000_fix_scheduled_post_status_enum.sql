-- Fix the google_business_scheduled_post_status enum
-- This ensures all required values exist in the enum

-- Add 'pending' if it doesn't exist (it should be there from original migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'google_business_scheduled_post_status'
    AND e.enumlabel = 'pending'
  ) THEN
    ALTER TYPE public.google_business_scheduled_post_status ADD VALUE IF NOT EXISTS 'pending';
  END IF;
END $$;

-- Add 'processing' if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'google_business_scheduled_post_status'
    AND e.enumlabel = 'processing'
  ) THEN
    ALTER TYPE public.google_business_scheduled_post_status ADD VALUE IF NOT EXISTS 'processing';
  END IF;
END $$;

-- Add 'completed' if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'google_business_scheduled_post_status'
    AND e.enumlabel = 'completed'
  ) THEN
    ALTER TYPE public.google_business_scheduled_post_status ADD VALUE IF NOT EXISTS 'completed';
  END IF;
END $$;

-- Add 'partial_success' if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'google_business_scheduled_post_status'
    AND e.enumlabel = 'partial_success'
  ) THEN
    ALTER TYPE public.google_business_scheduled_post_status ADD VALUE IF NOT EXISTS 'partial_success';
  END IF;
END $$;

-- Add 'failed' if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'google_business_scheduled_post_status'
    AND e.enumlabel = 'failed'
  ) THEN
    ALTER TYPE public.google_business_scheduled_post_status ADD VALUE IF NOT EXISTS 'failed';
  END IF;
END $$;

-- Add 'cancelled' if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'google_business_scheduled_post_status'
    AND e.enumlabel = 'cancelled'
  ) THEN
    ALTER TYPE public.google_business_scheduled_post_status ADD VALUE IF NOT EXISTS 'cancelled';
  END IF;
END $$;

-- Show current enum values for verification
DO $$
DECLARE
  enum_vals text;
BEGIN
  SELECT string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder)
  INTO enum_vals
  FROM pg_enum e
  JOIN pg_type t ON e.enumtypid = t.oid
  WHERE t.typname = 'google_business_scheduled_post_status';
  
  RAISE NOTICE 'Current enum values for google_business_scheduled_post_status: %', enum_vals;
END $$;
