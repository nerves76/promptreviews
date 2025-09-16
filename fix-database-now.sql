-- FORCE UPDATE ALL GLASSMORPHIC VALUES
UPDATE businesses 
SET 
  primary_color = '#2563EB',
  secondary_color = '#2563EB',
  gradient_start = '#2563EB',
  gradient_middle = '#7864C8',
  gradient_end = '#914AAE',
  card_transparency = 0.70,
  card_border_color = '#FFFFFF',
  card_border_width = 2,  -- Make it clearly visible
  card_text = '#FFFFFF',
  card_inner_shadow = true,
  card_shadow_color = '#FFFFFF',
  card_shadow_intensity = 0.30,
  card_border_transparency = 0.8,  -- More opaque for visibility
  background_type = 'gradient',
  background_color = '#FFFFFF',
  card_bg = '#FFFFFF'
WHERE account_id = 'f4aac780-844d-4c46-ba61-6b2f1a16f69b';

-- Also update by specific business ID to be sure
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
  background_color = '#FFFFFF',
  card_bg = '#FFFFFF'
WHERE id = '9a9bf954-04bd-4812-8bf6-dfbf68805b85';