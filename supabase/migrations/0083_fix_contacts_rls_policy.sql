-- Fix RLS policies for contacts table to support account_users relationship
-- This resolves 400 errors when joining prompt_pages with contacts

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own contacts" ON "public"."contacts";
DROP POLICY IF EXISTS "Users can insert their own contacts" ON "public"."contacts";
DROP POLICY IF EXISTS "Users can update their own contacts" ON "public"."contacts";
DROP POLICY IF EXISTS "Users can delete their own contacts" ON "public"."contacts";

-- Create new policies that support both direct account ownership and account_users relationship
-- This matches the pattern used by other tables like businesses and onboarding_tasks

CREATE POLICY "Users can view their account's contacts" ON "public"."contacts" 
FOR SELECT USING (
    ("account_id" IN ( 
        SELECT "account_users"."account_id"
        FROM "public"."account_users"
        WHERE ("account_users"."user_id" = "auth"."uid"())
    )) OR ("account_id" = "auth"."uid"())
);

CREATE POLICY "Users can insert contacts for their account" ON "public"."contacts" 
FOR INSERT WITH CHECK (
    ("account_id" IN ( 
        SELECT "account_users"."account_id"
        FROM "public"."account_users"
        WHERE ("account_users"."user_id" = "auth"."uid"())
    )) OR ("account_id" = "auth"."uid"())
);

CREATE POLICY "Users can update their account's contacts" ON "public"."contacts" 
FOR UPDATE USING (
    ("account_id" IN ( 
        SELECT "account_users"."account_id"
        FROM "public"."account_users"
        WHERE ("account_users"."user_id" = "auth"."uid"())
    )) OR ("account_id" = "auth"."uid"())
);

CREATE POLICY "Users can delete their account's contacts" ON "public"."contacts" 
FOR DELETE USING (
    ("account_id" IN ( 
        SELECT "account_users"."account_id"
        FROM "public"."account_users"
        WHERE ("account_users"."user_id" = "auth"."uid"())
    )) OR ("account_id" = "auth"."uid"())
);

-- Add comment explaining the fix
COMMENT ON TABLE "public"."contacts" IS 'Contact management table with RLS policies that support both direct account ownership and account_users relationships for team access';