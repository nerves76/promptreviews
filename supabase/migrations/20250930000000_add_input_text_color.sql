-- Add input_text_color column to businesses table for customizable input field text color
-- This allows dark input backgrounds to have light text and vice versa

ALTER TABLE businesses
ADD COLUMN input_text_color TEXT DEFAULT '#1F2937';

-- Add comment explaining the column
COMMENT ON COLUMN businesses.input_text_color IS 'Text color for input fields and textareas on prompt pages';