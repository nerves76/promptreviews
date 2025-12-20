-- Migration: Add credit pricing for AI Generate 10 keyword concepts
-- Cost: 5 credits per generation
-- Note: This migration runs before credit_pricing_rules table is created
-- in timestamp order, so we need to check if table exists first.

DO $$
BEGIN
  -- Only insert if the table exists (it may not exist during local resets
  -- since this migration timestamp is before the table creation migration)
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'credit_pricing_rules'
  ) THEN
    INSERT INTO credit_pricing_rules (feature_type, rule_key, credit_cost, description, is_active)
    SELECT 'keyword_finder', 'generate_10', 5, 'AI Generate 10 keyword concepts', true
    WHERE NOT EXISTS (
      SELECT 1 FROM credit_pricing_rules
      WHERE feature_type = 'keyword_finder' AND rule_key = 'generate_10'
    );
  END IF;
END $$;
