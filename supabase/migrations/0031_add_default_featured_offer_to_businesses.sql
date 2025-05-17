-- Add default featured offer fields to businesses table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS default_offer_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS default_offer_title TEXT DEFAULT 'Review Rewards',
ADD COLUMN IF NOT EXISTS default_offer_body TEXT; 