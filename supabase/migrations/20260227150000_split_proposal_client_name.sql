-- Split client_name into client_first_name + client_last_name on proposals table
ALTER TABLE proposals
  ADD COLUMN client_first_name TEXT,
  ADD COLUMN client_last_name TEXT;

-- Migrate existing data: first word → first_name, rest → last_name
UPDATE proposals
SET
  client_first_name = CASE
    WHEN client_name IS NOT NULL AND client_name != ''
    THEN split_part(client_name, ' ', 1)
    ELSE NULL
  END,
  client_last_name = CASE
    WHEN client_name IS NOT NULL AND position(' ' in client_name) > 0
    THEN substring(client_name from position(' ' in client_name) + 1)
    ELSE NULL
  END;

-- Drop the old column
ALTER TABLE proposals DROP COLUMN client_name;
