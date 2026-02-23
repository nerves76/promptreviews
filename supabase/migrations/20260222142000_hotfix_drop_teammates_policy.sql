-- HOTFIX: Drop teammates policy that may still cause recursion
-- The EXISTS subquery on account_users within an account_users policy
-- can still trigger recursive RLS evaluation.
-- Keep only the simple user_id = auth.uid() policy for now.
-- Teammates visibility will be handled via service_role in API routes.

DROP POLICY IF EXISTS "account_users_select_teammates" ON account_users;
