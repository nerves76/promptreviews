-- Migration: Re-enable RLS on account_invitations with owner-only policies
-- Date: 2025-10-02
-- Description: Restores row-level security on account_invitations table with proper owner-only access

DO $$
BEGIN
    -- Drop any leftover policies
    DROP POLICY IF EXISTS "Account owners can view invitations" ON public.account_invitations;
    DROP POLICY IF EXISTS "Account owners can create invitations" ON public.account_invitations;
    DROP POLICY IF EXISTS "Account owners can update invitations" ON public.account_invitations;
    DROP POLICY IF EXISTS "Account owners can delete invitations" ON public.account_invitations;
    DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON public.account_invitations;
    DROP POLICY IF EXISTS "Users can accept invitations sent to their email" ON public.account_invitations;

    -- Re-enable row level security
    ALTER TABLE public.account_invitations ENABLE ROW LEVEL SECURITY;

    -- Owners can view their account's invitations
    CREATE POLICY "Account owners can view invitations"
        ON public.account_invitations
        FOR SELECT
        TO authenticated
        USING (
            account_id IN (
                SELECT au.account_id
                FROM public.account_users au
                WHERE au.user_id = auth.uid()
                AND au.role = 'owner'
            )
        );

    -- Owners can create invitations for their accounts
    CREATE POLICY "Account owners can create invitations"
        ON public.account_invitations
        FOR INSERT
        TO authenticated
        WITH CHECK (
            account_id IN (
                SELECT au.account_id
                FROM public.account_users au
                WHERE au.user_id = auth.uid()
                AND au.role = 'owner'
            )
        );

    -- Owners can update invitations for their accounts
    CREATE POLICY "Account owners can update invitations"
        ON public.account_invitations
        FOR UPDATE
        TO authenticated
        USING (
            account_id IN (
                SELECT au.account_id
                FROM public.account_users au
                WHERE au.user_id = auth.uid()
                AND au.role = 'owner'
            )
        )
        WITH CHECK (
            account_id IN (
                SELECT au.account_id
                FROM public.account_users au
                WHERE au.user_id = auth.uid()
                AND au.role = 'owner'
            )
        );

    -- Owners can delete invitations for their accounts
    CREATE POLICY "Account owners can delete invitations"
        ON public.account_invitations
        FOR DELETE
        TO authenticated
        USING (
            account_id IN (
                SELECT au.account_id
                FROM public.account_users au
                WHERE au.user_id = auth.uid()
                AND au.role = 'owner'
            )
        );

    -- Update table comment to explain the security model
    COMMENT ON TABLE public.account_invitations IS 'Team invitations table. RLS enabled with owner-only access. Invitation acceptance flows use service role client for token-based lookups. Only account owners can view, create, update, or delete invitations for their accounts.';

    RAISE NOTICE 'Successfully re-enabled RLS on account_invitations with owner-only policies';
END $$;
