-- Fix contacts.account_id foreign key to reference accounts table instead of users table
--
-- Issue: The contacts table has account_id column but the foreign key incorrectly
-- references users.id instead of accounts.id. This causes import failures when
-- trying to create contacts with valid account IDs.
--
-- This migration:
-- 1. Drops the incorrect foreign key constraint
-- 2. Adds the correct foreign key constraint to accounts table

BEGIN;

-- Drop the incorrect foreign key constraint
ALTER TABLE contacts
DROP CONSTRAINT IF EXISTS contacts_account_id_fkey;

-- Add the correct foreign key constraint
ALTER TABLE contacts
ADD CONSTRAINT contacts_account_id_fkey
FOREIGN KEY (account_id)
REFERENCES accounts(id)
ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_contacts_account_id ON contacts(account_id);

COMMIT;
