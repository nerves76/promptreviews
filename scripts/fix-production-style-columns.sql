-- ============================================================================
-- PRODUCTION FIX: Add Missing Style Columns to Businesses Table
-- ============================================================================
-- Run this in Supabase SQL Editor to add all missing style columns
-- This script is safe to run multiple times - it only adds missing columns
-- ============================================================================

-- STEP 1: Verify what's missing (run this first to see current state)
-- ----------------------------------------------------------------------------
SELECT
    'Current columns in businesses table:' as info;

SELECT column_name
FROM information_schema.columns
WHERE table_name = 'businesses'
AND column_name IN (
    'gradient_middle', 'card_border_width', 'card_border_color',
    'card_border_transparency', 'card_shadow_color', 'card_shadow_intensity',
    'card_placeholder_color', 'kickstarters_background_design',
    'card_backdrop_blur', 'card_glassmorphism', 'card_inner_shadow'
)
ORDER BY column_name;

-- STEP 2: Add all missing style columns
-- ----------------------------------------------------------------------------

-- Core gradient columns (from migration 0027)
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS background_type text DEFAULT 'solid',
  ADD COLUMN IF NOT EXISTS gradient_start text,
  ADD COLUMN IF NOT EXISTS gradient_middle text,
  ADD COLUMN IF NOT EXISTS gradient_end text;

-- Glassmorphic settings (from migration 20250831220000)
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS card_backdrop_blur integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS card_glassmorphism boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS card_border_width numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS card_border_color text DEFAULT 'rgba(255, 255, 255, 0.2)';

-- Border transparency (from migration 20250901220000)
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS card_border_transparency numeric DEFAULT 1.00;

-- Shadow settings
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS card_inner_shadow boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS card_shadow_color text DEFAULT '#222222',
  ADD COLUMN IF NOT EXISTS card_shadow_intensity numeric DEFAULT 0.20;

-- Placeholder color (from migration 20250902233810)
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS card_placeholder_color text;

-- Card transparency (if missing)
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS card_transparency numeric DEFAULT 1.00;

-- Kickstarters background (from migration 20250830120000)
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS kickstarters_background_design boolean DEFAULT false;

-- Other style columns that might be missing
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS primary_font text DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS secondary_font text DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#6366F1',
  ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#8B5CF6',
  ADD COLUMN IF NOT EXISTS text_color text DEFAULT '#FFFFFF',
  ADD COLUMN IF NOT EXISTS background_color text DEFAULT '#1F2937',
  ADD COLUMN IF NOT EXISTS card_bg text,
  ADD COLUMN IF NOT EXISTS card_text text;

-- STEP 3: Add constraints (safe with IF NOT EXISTS checks)
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  -- Background type constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_background_type'
  ) THEN
    ALTER TABLE public.businesses
    ADD CONSTRAINT check_background_type
    CHECK (background_type IN ('solid', 'gradient'));
  END IF;

  -- Backdrop blur constraint (0-20)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_card_backdrop_blur'
  ) THEN
    ALTER TABLE public.businesses
    ADD CONSTRAINT check_card_backdrop_blur
    CHECK (card_backdrop_blur >= 0 AND card_backdrop_blur <= 20);
  END IF;

  -- Border width constraint (0-4)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_card_border_width'
  ) THEN
    ALTER TABLE public.businesses
    ADD CONSTRAINT check_card_border_width
    CHECK (card_border_width >= 0 AND card_border_width <= 4);
  END IF;

  -- Border transparency constraint (0-1)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_card_border_transparency'
  ) THEN
    ALTER TABLE public.businesses
    ADD CONSTRAINT check_card_border_transparency
    CHECK (card_border_transparency >= 0 AND card_border_transparency <= 1);
  END IF;

  -- Card transparency constraint (0-1)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_card_transparency'
  ) THEN
    ALTER TABLE public.businesses
    ADD CONSTRAINT check_card_transparency
    CHECK (card_transparency >= 0 AND card_transparency <= 1);
  END IF;

  -- Shadow intensity constraint (0-1)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_shadow_intensity'
  ) THEN
    ALTER TABLE public.businesses
    ADD CONSTRAINT check_shadow_intensity
    CHECK (card_shadow_intensity >= 0 AND card_shadow_intensity <= 1);
  END IF;
END $$;

-- STEP 4: Verify all columns were added successfully
-- ----------------------------------------------------------------------------

SELECT
    'Verification - these columns should now exist:' as info;

SELECT
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'businesses'
AND column_name IN (
    'background_type', 'gradient_start', 'gradient_middle', 'gradient_end',
    'card_backdrop_blur', 'card_glassmorphism', 'card_border_width',
    'card_border_color', 'card_border_transparency', 'card_inner_shadow',
    'card_shadow_color', 'card_shadow_intensity', 'card_placeholder_color',
    'card_transparency', 'kickstarters_background_design',
    'primary_font', 'secondary_font', 'primary_color', 'secondary_color',
    'text_color', 'background_color', 'card_bg', 'card_text'
)
ORDER BY column_name;

-- STEP 5: Test with a sample update (optional - uncomment to test)
-- ----------------------------------------------------------------------------
/*
-- Test that updates work with the new columns
UPDATE public.businesses
SET
    gradient_middle = '#FF00FF',
    card_border_width = 2,
    card_backdrop_blur = 10
WHERE id = (SELECT id FROM public.businesses LIMIT 1);
*/

-- ============================================================================
-- END OF SCRIPT
-- After running this, the Style modal should work correctly in production
-- ============================================================================