-- Add NFC text enabled field to prompt_pages table
ALTER TABLE prompt_pages 
ADD COLUMN nfc_text_enabled BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN prompt_pages.nfc_text_enabled IS 'When enabled, QR codes will show "Tap phone or scan with camera" text underneath';

-- Set default to false for existing records
UPDATE prompt_pages SET nfc_text_enabled = false WHERE nfc_text_enabled IS NULL; 