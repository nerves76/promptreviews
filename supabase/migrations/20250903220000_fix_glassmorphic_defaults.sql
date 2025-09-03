-- Fix glassmorphic design defaults permanently
UPDATE businesses 
SET 
  primary_color = COALESCE(primary_color, '#2563EB'),
  secondary_color = COALESCE(secondary_color, '#2563EB'),
  gradient_start = COALESCE(gradient_start, '#2563EB'),
  gradient_middle = COALESCE(gradient_middle, '#7864C8'),
  gradient_end = COALESCE(gradient_end, '#914AAE'),
  card_transparency = COALESCE(card_transparency, 0.70),
  card_border_color = COALESCE(card_border_color, '#FFFFFF'),
  card_border_width = COALESCE(card_border_width, 2),
  card_text = COALESCE(card_text, '#FFFFFF'),
  card_inner_shadow = COALESCE(card_inner_shadow, true),
  card_shadow_color = COALESCE(card_shadow_color, '#FFFFFF'),
  card_shadow_intensity = COALESCE(card_shadow_intensity, 0.30),
  card_border_transparency = COALESCE(card_border_transparency, 0.8),
  background_type = COALESCE(background_type, 'gradient'),
  card_bg = COALESCE(card_bg, '#FFFFFF')
WHERE true;

-- Specifically update Chris Bolton's business with exact values
UPDATE businesses 
SET 
  primary_color = '#2563EB',
  secondary_color = '#2563EB',
  gradient_start = '#2563EB',
  gradient_middle = '#7864C8',
  gradient_end = '#914AAE',
  card_transparency = 0.70,
  card_border_color = '#FFFFFF',
  card_border_width = 2,
  card_text = '#FFFFFF',
  card_inner_shadow = true,
  card_shadow_color = '#FFFFFF',
  card_shadow_intensity = 0.30,
  card_border_transparency = 0.8,
  background_type = 'gradient',
  card_bg = '#FFFFFF'
WHERE name = 'Chris Bolton' OR id = '9a9bf954-04bd-4812-8bf6-dfbf68805b85';