-- Fix glassmorphic design values in the database
UPDATE businesses 
SET 
  primary_color = '#2563EB',
  secondary_color = '#2563EB',
  gradient_start = '#2563EB',
  gradient_middle = '#7864C8',
  gradient_end = '#914AAE',
  card_transparency = 0.70,
  card_border_color = '#FFFFFF',
  card_border_width = 1,
  card_text = '#FFFFFF',
  card_inner_shadow = true,
  card_shadow_color = '#FFFFFF',
  card_shadow_intensity = 0.30
WHERE id = '9a9bf954-04bd-4812-8bf6-dfbf68805b85';