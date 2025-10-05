-- Update share_platform enum to match frontend platform names
-- Add 'sms' to support SMS sharing

-- Add 'sms' to the enum
ALTER TYPE share_platform ADD VALUE IF NOT EXISTS 'sms';

-- Add comment explaining the enum values
-- Note: 'text' and 'copy_link' are legacy values that won't be used by the application
-- but cannot be removed from the enum without a complex migration
COMMENT ON TYPE share_platform IS
'Social platforms for sharing reviews. Active platforms: facebook, linkedin, twitter, bluesky, reddit, pinterest, email, sms. Legacy values (text, copy_link) are deprecated and should not be used.';
