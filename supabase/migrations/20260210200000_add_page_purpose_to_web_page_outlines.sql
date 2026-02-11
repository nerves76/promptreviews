-- Add page_purpose column to web_page_outlines
-- Stores the selected purpose (service, product, location, lead_capture, informational, about)
-- Nullable so existing outlines are unaffected

ALTER TABLE web_page_outlines
  ADD COLUMN IF NOT EXISTS page_purpose TEXT;
