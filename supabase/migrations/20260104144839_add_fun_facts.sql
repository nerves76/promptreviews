-- Add Fun Facts feature to Prompt Reviews
-- Allows businesses to display key-value facts (e.g., "Year founded: 1995") on prompt pages

-- Add fun_facts column to businesses table (global library for account)
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS fun_facts JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN businesses.fun_facts IS 'Array of fun facts with label and value: [{id, label, value, created_at}]';

-- Add fun facts columns to prompt_pages table
ALTER TABLE prompt_pages
ADD COLUMN IF NOT EXISTS fun_facts_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS selected_fun_facts JSONB;

COMMENT ON COLUMN prompt_pages.fun_facts_enabled IS 'Whether fun facts feature is enabled for this prompt page';
COMMENT ON COLUMN prompt_pages.selected_fun_facts IS 'Array of selected fun fact IDs for this prompt page, null means inherit from business';
