-- Add competitor_data JSONB column to store topic clusters, URLs, and word count target
-- from competitor analysis at generation time. Allows displaying topics on the detail page.

ALTER TABLE web_page_outlines
  ADD COLUMN competitor_data jsonb DEFAULT NULL;

COMMENT ON COLUMN web_page_outlines.competitor_data IS 'Competitor analysis data: topic clusters, URLs, and word count target from generation time';
