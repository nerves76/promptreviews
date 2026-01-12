-- Add pricing_description text field to competitors table
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS pricing_description TEXT;

-- Populate pricing descriptions for all competitors
UPDATE competitors SET pricing_description = CASE slug
  WHEN 'birdeye' THEN 'Prices not publicly listed. Plans reportedly start at $299/month per location, scaling up to $449/month for advanced features.'
  WHEN 'podium' THEN 'Prices not publicly listed; requires sales quote. Users report Core plans starting at $399/month and Pro at $599/month per location.'
  WHEN 'nicejob' THEN 'Pricing starts at $75/month for Reviews plan and $125/month for Pro. 14-day free trial available.'
  WHEN 'gatherup' THEN 'Pricing starts at $25/month for basic features, with full-featured plan at $99/month per location. Includes 1,000 SMS/month.'
  WHEN 'grade-us' THEN 'Pricing starts at $110/month for Solo (single location), $180/month for Professional, and $400/month for Agency. 14-day free trial available.'
  WHEN 'brightlocal' THEN 'Pricing starts at $39/month for Track, $49/month for Manage, and $59/month for Grow. Volume discounts for multi-location; 14-day free trial.'
  WHEN 'reputation-com' THEN 'Prices not publicly listed; enterprise-focused with custom quotes. Pricing varies based on location count and features.'
  WHEN 'whitespark' THEN 'Modular pricing: Reputation Builder from $79/month per location, Rank Tracker from $17/month, Citation Finder from $39/month.'
  WHEN 'soci' THEN 'Prices not publicly listed. Users report pricing starts around $350/month, varying by location count and features.'
  WHEN 'local-falcon' THEN 'Credit-based pricing from $24.99/month (90K credits) to $199.99/month. Pay-as-you-go at $0.05/credit; 100 free credits on signup.'
  WHEN 'localo' THEN 'Pricing starts at $39-69/month for Single Business, with Agency plans from $79/month. Free plan and 14-day trial available.'
  WHEN 'local-dominator' THEN 'Credit-based pricing from $39/month (Lite) to $399/month (Enterprise). First month 95% off; no contracts.'
  ELSE pricing_description
END
WHERE slug IN ('birdeye', 'podium', 'nicejob', 'gatherup', 'grade-us', 'brightlocal', 'reputation-com', 'whitespark', 'soci', 'local-falcon', 'localo', 'local-dominator');
