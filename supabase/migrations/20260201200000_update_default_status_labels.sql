-- Update default status labels: "Draft" → "Backlog", "In Queue" → "In progress"
-- Only updates accounts that still have the old default values.

UPDATE accounts
SET prompt_page_status_labels = jsonb_set(
  jsonb_set(
    prompt_page_status_labels,
    '{draft}',
    '"Backlog"'
  ),
  '{in_queue}',
  '"In progress"'
)
WHERE prompt_page_status_labels->>'draft' = 'Draft'
  AND prompt_page_status_labels->>'in_queue' IN ('In Queue', 'In queue');

-- Update the column default for new accounts
ALTER TABLE accounts
ALTER COLUMN prompt_page_status_labels
SET DEFAULT '{"draft": "Backlog", "in_queue": "In progress", "sent": "Sent", "follow_up": "Follow Up", "complete": "Complete"}'::jsonb;
