-- Update card transparency to 30% as requested
UPDATE businesses 
SET 
  card_transparency = 0.30
WHERE card_transparency = 0.20 OR card_transparency IS NULL;

-- Specifically update Chris Bolton's business to 30%
UPDATE businesses 
SET 
  card_transparency = 0.30
WHERE name = 'Chris Bolton' OR id = '9a9bf954-04bd-4812-8bf6-dfbf68805b85';