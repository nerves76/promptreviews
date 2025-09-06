-- Remove foreign key constraints that force accounts.id to reference auth.users.id
-- This allows accounts to have independent UUIDs instead of being tied to user IDs

-- Drop the foreign key constraints
ALTER TABLE ONLY "public"."accounts"
    DROP CONSTRAINT IF EXISTS "accounts_id_fkey";

ALTER TABLE ONLY "public"."accounts"
    DROP CONSTRAINT IF EXISTS "accounts_user_id_fkey";

-- Add comment explaining the change
COMMENT ON TABLE "public"."accounts" IS 'Business accounts with independent IDs. No longer tied to auth.users.id to support multi-account architecture.';