-- Add assigned_to column to prompt_pages table
ALTER TABLE prompt_pages
ADD COLUMN assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for querying pages assigned to a user
CREATE INDEX idx_prompt_pages_assigned_to ON prompt_pages (assigned_to);

-- Add assignment_change to the activity_type enum used by campaign_actions
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'assignment_change';
