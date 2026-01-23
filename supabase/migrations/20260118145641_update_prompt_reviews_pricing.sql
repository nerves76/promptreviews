-- Update Prompt Reviews pricing description to reflect new grower pricing
-- Old: $17/month (annual rate for $20/month plan)
-- New: $20/month (annual rate for $24/month plan)

-- Note: is_us column may not exist in all environments, so we update by name instead
UPDATE competitors
SET pricing_description = 'Pricing tiers start at $20/month. $85/month for multi-location businesses.'
WHERE name = 'Prompt Reviews';
