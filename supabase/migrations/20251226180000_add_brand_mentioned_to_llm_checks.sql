-- Add brand_mentioned column to llm_visibility_checks
-- This tracks whether the business name was mentioned in the AI's response text
-- (separate from domain_cited which tracks if the website was cited as a source)

ALTER TABLE llm_visibility_checks
ADD COLUMN brand_mentioned boolean NOT NULL DEFAULT false;

-- Add index for queries filtering by brand_mentioned
CREATE INDEX idx_llm_checks_brand_mentioned
ON llm_visibility_checks(account_id, brand_mentioned, checked_at DESC);

-- Add comment explaining the difference
COMMENT ON COLUMN llm_visibility_checks.domain_cited IS 'Whether the business website domain was cited as a source/reference by the AI';
COMMENT ON COLUMN llm_visibility_checks.brand_mentioned IS 'Whether the business name was mentioned in the AI response text';
