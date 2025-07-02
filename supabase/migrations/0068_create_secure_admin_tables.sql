-- =====================================================
-- CREATE SECURE ADMIN MANAGEMENT TABLES
-- =====================================================
-- This migration creates tables to support the new secure admin system
-- that replaces the vulnerable ensureAdminForEmail function

-- =====================================================
-- ADMIN REQUESTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_email text NOT NULL,
    requester_user_id uuid NOT NULL,
    justification text NOT NULL,
    status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    requested_at timestamp with time zone NOT NULL DEFAULT NOW(),
    expires_at timestamp with time zone NOT NULL,
    approved_by uuid,
    approved_at timestamp with time zone,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_requests_requester_user_id ON public.admin_requests(requester_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_requests_status ON public.admin_requests(status);
CREATE INDEX IF NOT EXISTS idx_admin_requests_expires_at ON public.admin_requests(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_requests_requested_at ON public.admin_requests(requested_at DESC);

-- Add foreign key constraints
ALTER TABLE public.admin_requests 
ADD CONSTRAINT fk_admin_requests_requester_user_id 
FOREIGN KEY (requester_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.admin_requests 
ADD CONSTRAINT fk_admin_requests_approved_by 
FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add comments
COMMENT ON TABLE public.admin_requests IS 'Secure admin privilege requests requiring approval from existing admins';
COMMENT ON COLUMN public.admin_requests.requester_email IS 'Email of user requesting admin privileges';
COMMENT ON COLUMN public.admin_requests.requester_user_id IS 'User ID of requester';
COMMENT ON COLUMN public.admin_requests.justification IS 'Reason why admin privileges are needed';
COMMENT ON COLUMN public.admin_requests.status IS 'Current status: pending, approved, rejected, or expired';
COMMENT ON COLUMN public.admin_requests.expires_at IS 'When this request expires (7 days from creation)';
COMMENT ON COLUMN public.admin_requests.approved_by IS 'Admin who approved/rejected the request';

-- =====================================================
-- ADMIN AUDIT LOG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id text NOT NULL, -- Can be 'system' for system-generated actions
    action text NOT NULL,
    target_user_id uuid,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON public.admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target_user_id ON public.admin_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);

-- Add foreign key constraint for target_user_id (admin_id can be 'system' so no FK)
ALTER TABLE public.admin_audit_log 
ADD CONSTRAINT fk_admin_audit_log_target_user_id 
FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add comments
COMMENT ON TABLE public.admin_audit_log IS 'Audit trail for all admin actions and security events';
COMMENT ON COLUMN public.admin_audit_log.admin_id IS 'User ID of admin performing action, or "system" for automated actions';
COMMENT ON COLUMN public.admin_audit_log.action IS 'Description of the action performed';
COMMENT ON COLUMN public.admin_audit_log.target_user_id IS 'User ID affected by the action (optional)';
COMMENT ON COLUMN public.admin_audit_log.metadata IS 'Additional data about the action in JSON format';

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on admin_requests table
ALTER TABLE public.admin_requests ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own admin requests
CREATE POLICY "Users can view their own admin requests" ON public.admin_requests
    FOR SELECT USING (requester_user_id = auth.uid());

-- Policy 2: Users can create their own admin requests
CREATE POLICY "Users can create their own admin requests" ON public.admin_requests
    FOR INSERT WITH CHECK (requester_user_id = auth.uid());

-- Policy 3: Admins can view all admin requests
CREATE POLICY "Admins can view all admin requests" ON public.admin_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE account_id = auth.uid()
        )
    );

-- Policy 4: Admins can update admin requests (for approval/rejection)
CREATE POLICY "Admins can update admin requests" ON public.admin_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE account_id = auth.uid()
        )
    );

-- Policy 5: Service role can access all admin requests
CREATE POLICY "Service role can access all admin requests" ON public.admin_requests
    FOR ALL USING (auth.role() = 'service_role');

-- Enable RLS on admin_audit_log table
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admins 
            WHERE account_id = auth.uid()
        )
    );

-- Policy 2: Service role can access all audit logs
CREATE POLICY "Service role can access all audit logs" ON public.admin_audit_log
    FOR ALL USING (auth.role() = 'service_role');

-- Policy 3: Authenticated users can insert audit logs (for logging their own actions)
CREATE POLICY "Authenticated users can insert audit logs" ON public.admin_audit_log
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- FUNCTIONS FOR ADMIN REQUEST MANAGEMENT
-- =====================================================

-- Function to automatically expire old admin requests
CREATE OR REPLACE FUNCTION public.expire_old_admin_requests()
RETURNS integer AS $$
DECLARE
    expired_count integer;
BEGIN
    -- Update expired pending requests
    UPDATE public.admin_requests 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending' 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Log the expiration action
    IF expired_count > 0 THEN
        INSERT INTO public.admin_audit_log (
            admin_id, action, metadata, created_at
        ) VALUES (
            'system',
            'admin_requests_expired',
            jsonb_build_object('expired_count', expired_count),
            NOW()
        );
    END IF;
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION public.expire_old_admin_requests() IS 'Automatically expires admin requests that have passed their expiration date';

-- Function to get admin request statistics
CREATE OR REPLACE FUNCTION public.get_admin_request_stats()
RETURNS TABLE(
    total_requests bigint,
    pending_requests bigint,
    approved_requests bigint,
    rejected_requests bigint,
    expired_requests bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_requests,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_requests,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_requests,
        COUNT(*) FILTER (WHERE status = 'expired') as expired_requests
    FROM public.admin_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION public.get_admin_request_stats() IS 'Returns statistics about admin requests for monitoring purposes';

-- =====================================================
-- GRANTS AND PERMISSIONS
-- =====================================================

-- Grant access to authenticated users for admin requests
GRANT SELECT, INSERT ON public.admin_requests TO authenticated;
GRANT UPDATE ON public.admin_requests TO authenticated; -- Needed for admin approvals

-- Grant access to authenticated users for audit logs
GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.expire_old_admin_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_request_stats() TO authenticated;

-- =====================================================
-- INITIAL DATA AND SETUP
-- =====================================================

-- Create an initial audit log entry
INSERT INTO public.admin_audit_log (
    admin_id, action, metadata, created_at
) VALUES (
    'system',
    'secure_admin_system_initialized',
    jsonb_build_object(
        'migration_version', '0068',
        'tables_created', ARRAY['admin_requests', 'admin_audit_log'],
        'security_features', ARRAY['rls_enabled', 'audit_logging', 'request_approval']
    ),
    NOW()
);

-- =====================================================
-- VERIFICATION AND FINAL CHECKS
-- =====================================================

-- Verify tables were created successfully
DO $$
DECLARE
    admin_requests_exists boolean;
    admin_audit_log_exists boolean;
    rls_enabled_requests boolean;
    rls_enabled_audit boolean;
BEGIN
    -- Check if tables exist
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admin_requests'
    ) INTO admin_requests_exists;
    
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admin_audit_log'
    ) INTO admin_audit_log_exists;
    
    -- Check if RLS is enabled
    SELECT rowsecurity INTO rls_enabled_requests
    FROM pg_tables 
    WHERE tablename = 'admin_requests' AND schemaname = 'public';
    
    SELECT rowsecurity INTO rls_enabled_audit
    FROM pg_tables 
    WHERE tablename = 'admin_audit_log' AND schemaname = 'public';
    
    -- Verify everything is set up correctly
    IF NOT admin_requests_exists THEN
        RAISE EXCEPTION 'CRITICAL: admin_requests table was not created';
    END IF;
    
    IF NOT admin_audit_log_exists THEN
        RAISE EXCEPTION 'CRITICAL: admin_audit_log table was not created';
    END IF;
    
    IF NOT rls_enabled_requests THEN
        RAISE EXCEPTION 'CRITICAL: RLS not enabled on admin_requests table';
    END IF;
    
    IF NOT rls_enabled_audit THEN
        RAISE EXCEPTION 'CRITICAL: RLS not enabled on admin_audit_log table';
    END IF;
    
    -- Log successful setup
    INSERT INTO public.admin_audit_log (
        admin_id, action, metadata, created_at
    ) VALUES (
        'system',
        'secure_admin_tables_verified',
        jsonb_build_object(
            'admin_requests_created', admin_requests_exists,
            'admin_audit_log_created', admin_audit_log_exists,
            'rls_enabled_requests', rls_enabled_requests,
            'rls_enabled_audit', rls_enabled_audit
        ),
        NOW()
    );
END;
$$;

-- Final status report
SELECT 
    'Secure Admin System Setup Complete' as status,
    'admin_requests: ' || (SELECT rowsecurity FROM pg_tables WHERE tablename = 'admin_requests' AND schemaname = 'public') as admin_requests_rls,
    'admin_audit_log: ' || (SELECT rowsecurity FROM pg_tables WHERE tablename = 'admin_audit_log' AND schemaname = 'public') as audit_log_rls,
    'Policies created: ' || COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('admin_requests', 'admin_audit_log')
GROUP BY 1, 2, 3;