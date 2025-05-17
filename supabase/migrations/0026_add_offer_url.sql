-- Add offer_url to prompt_pages if not exists
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS offer_url TEXT;

-- Add offer_url to businesses if not exists
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS offer_url TEXT;

-- Add comments
COMMENT ON COLUMN prompt_pages.offer_url IS 'URL for the learn more page about the offer';
COMMENT ON COLUMN businesses.offer_url IS 'Default URL for the learn more page about the offer'; 