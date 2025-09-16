-- Ensure borders are 2px width as requested
UPDATE businesses 
SET 
  card_border_width = 2,
  card_border_color = '#FFFFFF',
  card_border_transparency = 0.8
WHERE card_border_width IS NULL OR card_border_width < 2;

-- Specifically update Chris Bolton's business to ensure 2px borders
UPDATE businesses 
SET 
  card_border_width = 2,
  card_border_color = '#FFFFFF',
  card_border_transparency = 0.8,
  card_transparency = 0.20
WHERE name = 'Chris Bolton' OR id = '9a9bf954-04bd-4812-8bf6-dfbf68805b85';