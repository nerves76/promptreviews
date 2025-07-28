-- Add employee and event specific fields to prompt_pages table
-- Using prefixes emp_ and eve_ for better organization and clarity

-- Employee-specific columns with emp_ prefix
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS emp_first_name text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS emp_last_name text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS emp_pronouns text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS emp_headshot_url text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS emp_position text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS emp_location text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS emp_years_at_business text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS emp_bio text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS emp_fun_facts jsonb;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS emp_skills jsonb;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS emp_review_guidance text;

-- Event-specific columns with eve_ prefix
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS eve_name text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS eve_type text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS eve_date date;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS eve_location text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS eve_description text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS eve_duration text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS eve_capacity integer;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS eve_organizer text;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS eve_special_features jsonb;
ALTER TABLE prompt_pages ADD COLUMN IF NOT EXISTS eve_review_guidance text;

-- Add comments for clarity
COMMENT ON COLUMN prompt_pages.emp_first_name IS 'Employee first name for employee spotlight pages';
COMMENT ON COLUMN prompt_pages.emp_last_name IS 'Employee last name for employee spotlight pages';
COMMENT ON COLUMN prompt_pages.emp_pronouns IS 'Employee pronouns for employee spotlight pages';
COMMENT ON COLUMN prompt_pages.emp_headshot_url IS 'URL to employee headshot photo for employee spotlight pages';
COMMENT ON COLUMN prompt_pages.emp_position IS 'Employee job title/position for employee spotlight pages';
COMMENT ON COLUMN prompt_pages.emp_location IS 'Employee work location/branch for employee spotlight pages';
COMMENT ON COLUMN prompt_pages.emp_years_at_business IS 'Years employee has worked at business';
COMMENT ON COLUMN prompt_pages.emp_bio IS 'Employee short biography for employee spotlight pages';
COMMENT ON COLUMN prompt_pages.emp_fun_facts IS 'JSON array of fun facts about the employee';
COMMENT ON COLUMN prompt_pages.emp_skills IS 'JSON array of employee skills and competencies';
COMMENT ON COLUMN prompt_pages.emp_review_guidance IS 'What customers should mention in reviews about this employee';

COMMENT ON COLUMN prompt_pages.eve_name IS 'Event name for event review pages';
COMMENT ON COLUMN prompt_pages.eve_type IS 'Type of event (conference, workshop, party, etc.)';
COMMENT ON COLUMN prompt_pages.eve_date IS 'Date when the event took place';
COMMENT ON COLUMN prompt_pages.eve_location IS 'Event venue/location';
COMMENT ON COLUMN prompt_pages.eve_description IS 'Event description and details';
COMMENT ON COLUMN prompt_pages.eve_duration IS 'Event duration (e.g., "2 hours", "3 days")';
COMMENT ON COLUMN prompt_pages.eve_capacity IS 'Maximum number of attendees for the event';
COMMENT ON COLUMN prompt_pages.eve_organizer IS 'Event organizer name or department';
COMMENT ON COLUMN prompt_pages.eve_special_features IS 'JSON array of special features or highlights of the event';
COMMENT ON COLUMN prompt_pages.eve_review_guidance IS 'What attendees should mention in reviews about this event';

-- Create indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_prompt_pages_emp_position ON prompt_pages(emp_position);
CREATE INDEX IF NOT EXISTS idx_prompt_pages_emp_location ON prompt_pages(emp_location);
CREATE INDEX IF NOT EXISTS idx_prompt_pages_eve_type ON prompt_pages(eve_type);
CREATE INDEX IF NOT EXISTS idx_prompt_pages_eve_date ON prompt_pages(eve_date);
CREATE INDEX IF NOT EXISTS idx_prompt_pages_eve_location ON prompt_pages(eve_location); 