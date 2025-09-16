-- Verification script to check which style columns exist in the businesses table
-- Run this in your Supabase SQL editor to see what's missing

-- Check for all style-related columns
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'businesses'
AND column_name IN (
    -- Gradient columns
    'gradient_middle',
    'gradient_start',
    'gradient_end',
    'background_type',

    -- Card styling columns
    'card_border_width',
    'card_border_color',
    'card_border_transparency',
    'card_backdrop_blur',
    'card_glassmorphism',
    'card_inner_shadow',
    'card_shadow_color',
    'card_shadow_intensity',
    'card_placeholder_color',
    'card_transparency',

    -- Feature columns
    'kickstarters_background_design',

    -- Core style columns (should definitely exist)
    'primary_color',
    'secondary_color',
    'text_color',
    'background_color'
)
ORDER BY
    CASE
        WHEN column_name LIKE 'gradient%' THEN 1
        WHEN column_name LIKE 'card%' THEN 2
        ELSE 3
    END,
    column_name;

-- Summary count
SELECT
    COUNT(*) as columns_found,
    20 - COUNT(*) as columns_missing
FROM information_schema.columns
WHERE table_name = 'businesses'
AND column_name IN (
    'gradient_middle', 'gradient_start', 'gradient_end', 'background_type',
    'card_border_width', 'card_border_color', 'card_border_transparency',
    'card_backdrop_blur', 'card_glassmorphism', 'card_inner_shadow',
    'card_shadow_color', 'card_shadow_intensity', 'card_placeholder_color',
    'card_transparency', 'kickstarters_background_design',
    'primary_color', 'secondary_color', 'text_color', 'background_color'
);