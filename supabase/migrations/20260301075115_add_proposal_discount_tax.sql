-- Add discount and tax fields to proposals
-- Calculation order: Subtotal → Discount → Tax → Grand Total

ALTER TABLE proposals ADD COLUMN discount_type TEXT CHECK (discount_type IN ('percentage', 'flat'));
ALTER TABLE proposals ADD COLUMN discount_value NUMERIC(12,2) DEFAULT 0;
ALTER TABLE proposals ADD COLUMN tax_rate NUMERIC(5,4) DEFAULT 0;

COMMENT ON COLUMN proposals.discount_type IS 'null = no discount, percentage = % of subtotal, flat = dollar amount';
COMMENT ON COLUMN proposals.discount_value IS 'The percentage (e.g. 10 for 10%) or flat dollar amount';
COMMENT ON COLUMN proposals.tax_rate IS 'Tax percentage (e.g. 8.25 for 8.25%), 0 = no tax';
