-- Update default offer title from "Review Rewards" to "Special Offer"

-- Update the default constraint for businesses table
ALTER TABLE businesses 
ALTER COLUMN default_offer_title SET DEFAULT 'Special Offer';

-- Update the default constraint for prompt_pages table
ALTER TABLE prompt_pages 
ALTER COLUMN offer_title SET DEFAULT 'Special Offer';

-- Optionally update existing records that have the old default
-- (Uncomment if you want to update existing data)
-- UPDATE businesses 
-- SET default_offer_title = 'Special Offer' 
-- WHERE default_offer_title = 'Review Rewards';

-- UPDATE prompt_pages 
-- SET offer_title = 'Special Offer' 
-- WHERE offer_title = 'Review Rewards';