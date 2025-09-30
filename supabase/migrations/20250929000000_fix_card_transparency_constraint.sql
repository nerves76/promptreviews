-- Fix card_transparency constraint to allow Glassy default of 0.30 (30%)
-- Previous constraint required minimum of 0.50, but Glassy design needs 0.30

ALTER TABLE businesses
DROP CONSTRAINT IF EXISTS check_card_transparency;

ALTER TABLE businesses
ADD CONSTRAINT check_card_transparency
CHECK (card_transparency >= 0.20 AND card_transparency <= 1.00);