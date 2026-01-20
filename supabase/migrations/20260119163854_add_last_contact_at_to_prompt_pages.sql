-- Add last_contact_at column to prompt_pages for tracking when a communication was last sent
ALTER TABLE prompt_pages
ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ;

-- Add index for efficient querying of recently contacted pages
CREATE INDEX IF NOT EXISTS idx_prompt_pages_last_contact_at ON prompt_pages(last_contact_at);
