-- Add button fields to quotes table
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS button_text TEXT,
ADD COLUMN IF NOT EXISTS button_url TEXT;

-- Add comment to document the new fields
COMMENT ON COLUMN quotes.button_text IS 'Optional button text to display with the quote';
COMMENT ON COLUMN quotes.button_url IS 'Optional URL for the button link'; 