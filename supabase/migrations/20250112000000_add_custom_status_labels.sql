-- Add custom status labels to accounts table
-- This allows users to customize the display names of prompt page statuses
-- The underlying enum remains unchanged for data integrity

ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS prompt_page_status_labels JSONB DEFAULT '{
  "draft": "Draft",
  "in_queue": "In Queue",
  "sent": "Sent",
  "follow_up": "Follow Up",
  "complete": "Complete"
}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN accounts.prompt_page_status_labels IS
  'Custom display labels for prompt page statuses. Keys must match prompt_page_status enum values. Max 20 characters per label.';
