-- Update existing system templates to use {{sender_name}} for signatures
-- and remove {{review_url}} placeholders
-- Run this manually: psql $DATABASE_URL -f this_file.sql

-- First, let's update signature patterns where {{business_name}} should be {{sender_name}}
-- These are common sign-off patterns in email templates

UPDATE communication_templates
SET message_template = REPLACE(message_template, E'\nSincerely,\n{{business_name}}', E'\nSincerely,\n{{sender_name}}')
WHERE is_system = true AND message_template LIKE E'%\nSincerely,\n{{business_name}}%';

UPDATE communication_templates
SET message_template = REPLACE(message_template, E'\nGratefully,\n{{business_name}}', E'\nGratefully,\n{{sender_name}}')
WHERE is_system = true AND message_template LIKE E'%\nGratefully,\n{{business_name}}%';

UPDATE communication_templates
SET message_template = REPLACE(message_template, E'\nWarmly,\n{{business_name}}', E'\nWarmly,\n{{sender_name}}')
WHERE is_system = true AND message_template LIKE E'%\nWarmly,\n{{business_name}}%';

UPDATE communication_templates
SET message_template = REPLACE(message_template, E'\nBest,\n{{business_name}}', E'\nBest,\n{{sender_name}}')
WHERE is_system = true AND message_template LIKE E'%\nBest,\n{{business_name}}%';

UPDATE communication_templates
SET message_template = REPLACE(message_template, E'\nBest regards,\n{{business_name}}', E'\nBest regards,\n{{sender_name}}')
WHERE is_system = true AND message_template LIKE E'%\nBest regards,\n{{business_name}}%';

UPDATE communication_templates
SET message_template = REPLACE(message_template, E'\nWith gratitude,\n{{business_name}}', E'\nWith gratitude,\n{{sender_name}}')
WHERE is_system = true AND message_template LIKE E'%\nWith gratitude,\n{{business_name}}%';

UPDATE communication_templates
SET message_template = REPLACE(message_template, E'\nThank you!\n{{business_name}}', E'\nThank you!\n{{sender_name}}')
WHERE is_system = true AND message_template LIKE E'%\nThank you!\n{{business_name}}%';

-- SMS templates - signature at end with dash
UPDATE communication_templates
SET message_template = REPLACE(message_template, 'Thanks! - {{business_name}}', 'Thanks! - {{sender_name}}')
WHERE is_system = true AND message_template LIKE '%Thanks! - {{business_name}}%';

UPDATE communication_templates
SET message_template = REPLACE(message_template, 'Thank you! - {{business_name}}', 'Thank you! - {{sender_name}}')
WHERE is_system = true AND message_template LIKE '%Thank you! - {{business_name}}%';

-- Now remove {{review_url}} patterns
-- Pattern: "here: {{review_url}}" or "here:\n{{review_url}}"
UPDATE communication_templates
SET message_template = REPLACE(message_template, E'here:\n{{review_url}}', 'here.')
WHERE is_system = true AND message_template LIKE E'%here:\n{{review_url}}%';

UPDATE communication_templates
SET message_template = REPLACE(message_template, 'here: {{review_url}}', 'here.')
WHERE is_system = true AND message_template LIKE '%here: {{review_url}}%';

-- Pattern: standalone {{review_url}} on its own line
UPDATE communication_templates
SET message_template = REPLACE(message_template, E'\n{{review_url}}\n', E'\n')
WHERE is_system = true AND message_template LIKE E'%\n{{review_url}}\n%';

-- Pattern: {{review_url}} in SMS (with space before)
UPDATE communication_templates
SET message_template = REPLACE(message_template, ' {{review_url}} ', ' ')
WHERE is_system = true AND message_template LIKE '% {{review_url}} %';

UPDATE communication_templates
SET message_template = REPLACE(message_template, ': {{review_url}} ', '. ')
WHERE is_system = true AND message_template LIKE '%: {{review_url}} %';

-- Clean up any remaining {{review_url}}
UPDATE communication_templates
SET message_template = REPLACE(message_template, '{{review_url}}', '')
WHERE is_system = true AND message_template LIKE '%{{review_url}}%';

-- Clean up double spaces that may have been created
UPDATE communication_templates
SET message_template = REPLACE(message_template, '  ', ' ')
WHERE is_system = true AND message_template LIKE '%  %';

-- Show what was updated
SELECT id, name, communication_type,
       CASE WHEN message_template LIKE '%{{sender_name}}%' THEN 'has sender_name' ELSE 'NO sender_name' END as sender_check,
       CASE WHEN message_template LIKE '%{{review_url}}%' THEN 'HAS review_url (BAD)' ELSE 'no review_url (good)' END as url_check
FROM communication_templates
WHERE is_system = true
ORDER BY name;
