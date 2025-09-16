-- Add ALL missing columns to businesses table
-- This migration ensures the businesses table matches the complete schema

-- Add missing columns that are not currently in the table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS taglines text,
ADD COLUMN IF NOT EXISTS team_info text,
ADD COLUMN IF NOT EXISTS review_platforms jsonb,
ADD COLUMN IF NOT EXISTS platform_word_counts text,
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS keywords text,
ADD COLUMN IF NOT EXISTS tagline text,
ADD COLUMN IF NOT EXISTS account_id uuid NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS default_offer_title text DEFAULT 'Review Rewards',
ADD COLUMN IF NOT EXISTS default_offer_body text,
ADD COLUMN IF NOT EXISTS business_website text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS signup_email text,
ADD COLUMN IF NOT EXISTS business_email text,
ADD COLUMN IF NOT EXISTS default_offer_url text,
ADD COLUMN IF NOT EXISTS industries_other text,
ADD COLUMN IF NOT EXISTS industry text[],
ADD COLUMN IF NOT EXISTS services_offered text,
ADD COLUMN IF NOT EXISTS company_values text,
ADD COLUMN IF NOT EXISTS differentiators text,
ADD COLUMN IF NOT EXISTS years_in_business text,
ADD COLUMN IF NOT EXISTS industries_served text,
ADD COLUMN IF NOT EXISTS ai_dos text,
ADD COLUMN IF NOT EXISTS ai_donts text,
ADD COLUMN IF NOT EXISTS card_bg text,
ADD COLUMN IF NOT EXISTS card_text text;

-- Add comments to document the purpose of these columns
COMMENT ON COLUMN businesses.taglines IS 'Multiple taglines for the business';
COMMENT ON COLUMN businesses.team_info IS 'Information about the business team';
COMMENT ON COLUMN businesses.review_platforms IS 'JSON object containing review platform configurations';
COMMENT ON COLUMN businesses.platform_word_counts IS 'Word count limits for different platforms';
COMMENT ON COLUMN businesses.logo_url IS 'URL to the business logo';
COMMENT ON COLUMN businesses.keywords IS 'SEO keywords for the business';
COMMENT ON COLUMN businesses.tagline IS 'Primary tagline for the business';
COMMENT ON COLUMN businesses.account_id IS 'Foreign key reference to accounts table';
COMMENT ON COLUMN businesses.default_offer_title IS 'Default title for review offers';
COMMENT ON COLUMN businesses.default_offer_body IS 'Default body text for review offers';
COMMENT ON COLUMN businesses.business_website IS 'Main website URL for the business';
COMMENT ON COLUMN businesses.phone IS 'Business phone number';
COMMENT ON COLUMN businesses.signup_email IS 'Email used for signup';
COMMENT ON COLUMN businesses.business_email IS 'Primary business email';
COMMENT ON COLUMN businesses.default_offer_url IS 'Default URL for review offers';
COMMENT ON COLUMN businesses.industries_other IS 'Other industries not in the main list';
COMMENT ON COLUMN businesses.industry IS 'Array of industry categories';
COMMENT ON COLUMN businesses.services_offered IS 'List of services offered by the business';
COMMENT ON COLUMN businesses.company_values IS 'Core values of the company';
COMMENT ON COLUMN businesses.differentiators IS 'What makes the business unique';
COMMENT ON COLUMN businesses.years_in_business IS 'Number of years the business has been operating';
COMMENT ON COLUMN businesses.industries_served IS 'Industries that the business serves';
COMMENT ON COLUMN businesses.ai_dos IS 'AI-generated content preferences - what the business wants AI to do';
COMMENT ON COLUMN businesses.ai_donts IS 'AI-generated content preferences - what the business does not want AI to do';
COMMENT ON COLUMN businesses.card_bg IS 'Background color for review cards';
COMMENT ON COLUMN businesses.card_text IS 'Text color for review cards'; 