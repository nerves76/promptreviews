-- Add contact_id column to prompt_pages table
-- This allows linking prompt pages to contacts for better organization

ALTER TABLE prompt_pages 
ADD COLUMN contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS prompt_pages_contact_id_idx ON prompt_pages(contact_id);

-- Add comment for documentation
COMMENT ON COLUMN prompt_pages.contact_id IS 'Links prompt page to a contact for better organization and relationship management'; 