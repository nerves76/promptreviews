-- Backfill advanced style columns for businesses table
-- This is safe to run multiple times in any environment.

-- Gradient middle stop (optional third color)
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS gradient_middle text;

-- Card placeholder text color
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS card_placeholder_color text;

-- Glassmorphic and border options
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS card_inner_shadow boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS card_shadow_color text DEFAULT '#222222',
  ADD COLUMN IF NOT EXISTS card_shadow_intensity numeric DEFAULT 0.20,
  ADD COLUMN IF NOT EXISTS card_backdrop_blur integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS card_border_width numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS card_border_color text DEFAULT 'rgba(255, 255, 255, 0.2)',
  ADD COLUMN IF NOT EXISTS card_border_transparency numeric DEFAULT 1.00;

-- Constraints for border and blur values
DO $$
BEGIN
  -- Backdrop blur 0-20
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_card_backdrop_blur'
  ) THEN
    ALTER TABLE public.businesses
    ADD CONSTRAINT check_card_backdrop_blur CHECK (card_backdrop_blur >= 0 AND card_backdrop_blur <= 20);
  END IF;

  -- Border width 0-4
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_card_border_width') THEN
    ALTER TABLE public.businesses DROP CONSTRAINT check_card_border_width;
  END IF;
  ALTER TABLE public.businesses
  ADD CONSTRAINT check_card_border_width CHECK (card_border_width >= 0 AND card_border_width <= 4);

  -- Border transparency 0-1
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_card_border_transparency') THEN
    ALTER TABLE public.businesses DROP CONSTRAINT check_card_border_transparency;
  END IF;
  ALTER TABLE public.businesses
  ADD CONSTRAINT check_card_border_transparency CHECK (card_border_transparency >= 0 AND card_border_transparency <= 1);
END $$;

-- Kickstarter background design toggle (used by prompt page component)
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS kickstarters_background_design boolean DEFAULT false;

-- Notes:
-- Production should generally apply the Supabase migrations under supabase/migrations.
-- This file is provided as a safety net for environments initialized without those.

