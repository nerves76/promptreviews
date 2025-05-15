-- Add default featured offer fields to businesses table
ALTER TABLE businesses
ADD COLUMN default_offer_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN default_offer_title TEXT DEFAULT 'Review Rewards',
ADD COLUMN default_offer_body TEXT; 