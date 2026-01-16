-- Increase Monthly Credits for All Plans
-- Previous values: grower=100, builder=200, maven=400
-- New values: grower=500, builder=1000, maven=2000
-- Rationale: API costs are low, giving users more credits improves value proposition

UPDATE credit_included_by_tier
SET
  monthly_credits = 500,
  description = 'Grower plan: 500 credits/month',
  updated_at = NOW()
WHERE tier = 'grower';

UPDATE credit_included_by_tier
SET
  monthly_credits = 1000,
  description = 'Builder plan: 1,000 credits/month',
  updated_at = NOW()
WHERE tier = 'builder';

UPDATE credit_included_by_tier
SET
  monthly_credits = 2000,
  description = 'Maven plan: 2,000 credits/month',
  updated_at = NOW()
WHERE tier = 'maven';
