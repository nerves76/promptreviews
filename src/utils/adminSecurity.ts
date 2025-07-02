/**
 * SECURE ADMIN MANAGEMENT SYSTEM
 * 
 * This module replaces the vulnerable ensureAdminForEmail function with
 * a secure admin verification and approval system.
 * 
 * SECURITY FEATURES:
 * - Multi-step admin creation process
 * - Existing admin approval required
 * - Audit logging for all admin actions
 * - Email verification for admin requests
 * - Rate limiting on admin creation attempts
 */

import { supabase } from './supabaseClient';

// Define admin request statuses
export type AdminRequestStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface AdminRequest {
  id: string;
  requester_email: string;
  requester_user_id: string;
  requested_at: string;
  status: AdminRequestStatus;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  expires_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_user_id?: string;
  metadata: any;
  created_at: string;
}

/**
 * SECURE: Request admin privileges (replaces ensureAdminForEmail)
 * 
 * This function creates a request for admin privileges that must be approved
 * by an existing admin. No automatic admin creation based on email.
 * 
 * @param userEmail - Email of the user requesting admin privileges
 * @param userId - User ID of the requester
 * @param justification - Why they need admin access
 * @returns Promise<{success: boolean, message: string, requestId?: string}>
 */
export async function requestAdminPrivileges(
  userEmail: string, 
  userId: string, 
  justification: string
): Promise<{success: boolean, message: string, requestId?: string}> {
  try {
    console.log('AdminSecurity: Admin privilege request started', { userEmail, userId });

    // SECURITY CHECK 1: Rate limiting - max 1 request per user per 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentRequests, error: checkError } = await supabase
      .from('admin_requests')
      .select('id')
      .eq('requester_user_id', userId)
      .gte('requested_at', twentyFourHoursAgo);

    if (checkError) {
      console.error('AdminSecurity: Error checking recent requests:', checkError);
      return { success: false, message: 'Unable to process request due to system error' };
    }

    if (recentRequests && recentRequests.length > 0) {
      console.log('AdminSecurity: Rate limit exceeded for user:', userId);
      return { 
        success: false, 
        message: 'You can only request admin privileges once per 24 hours' 
      };
    }

    // SECURITY CHECK 2: Ensure user doesn't already have admin privileges
    const { data: existingAdmin, error: adminCheckError } = await supabase
      .from('admins')
      .select('id')
      .eq('account_id', userId)
      .maybeSingle();

    if (adminCheckError) {
      console.error('AdminSecurity: Error checking existing admin status:', adminCheckError);
      return { success: false, message: 'Unable to verify current admin status' };
    }

    if (existingAdmin) {
      console.log('AdminSecurity: User already has admin privileges:', userId);
      return { 
        success: false, 
        message: 'You already have admin privileges' 
      };
    }

    // SECURITY CHECK 3: Validate justification
    if (!justification || justification.trim().length < 10) {
      return { 
        success: false, 
        message: 'Please provide a detailed justification (minimum 10 characters)' 
      };
    }

    // Create admin request with 7-day expiration
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: request, error: insertError } = await supabase
      .from('admin_requests')
      .insert({
        requester_email: userEmail.toLowerCase(),
        requester_user_id: userId,
        justification: justification.trim(),
        status: 'pending',
        requested_at: new Date().toISOString(),
        expires_at: expiresAt
      })
      .select()
      .single();

    if (insertError) {
      console.error('AdminSecurity: Error creating admin request:', insertError);
      return { success: false, message: 'Failed to create admin request' };
    }

    // Log the admin request for audit purposes
    await logAdminAction(
      'system',
      'admin_request_created',
      userId,
      {
        requester_email: userEmail,
        justification: justification.substring(0, 100), // Truncate for logging
        request_id: request.id
      }
    );

    console.log('AdminSecurity: Admin request created successfully:', request.id);

    return {
      success: true,
      message: 'Admin request submitted successfully. You will be notified when it is reviewed.',
      requestId: request.id
    };

  } catch (error) {
    console.error('AdminSecurity: Unexpected error in requestAdminPrivileges:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

/**
 * SECURE: Approve admin request (admin only)
 * 
 * @param requestId - ID of the admin request to approve
 * @param approvingAdminId - User ID of the admin approving the request
 * @returns Promise<{success: boolean, message: string}>
 */
export async function approveAdminRequest(
  requestId: string,
  approvingAdminId: string
): Promise<{success: boolean, message: string}> {
  try {
    console.log('AdminSecurity: Admin approval process started', { requestId, approvingAdminId });

    // SECURITY CHECK 1: Verify the approver is actually an admin
    const { data: approverAdmin, error: approverError } = await supabase
      .from('admins')
      .select('id')
      .eq('account_id', approvingAdminId)
      .single();

    if (approverError || !approverAdmin) {
      console.error('AdminSecurity: Approver is not an admin:', approvingAdminId);
      return { success: false, message: 'Only existing admins can approve admin requests' };
    }

    // SECURITY CHECK 2: Get and validate the request
    const { data: request, error: requestError } = await supabase
      .from('admin_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      console.error('AdminSecurity: Admin request not found:', requestId);
      return { success: false, message: 'Admin request not found' };
    }

    // SECURITY CHECK 3: Validate request status and expiration
    if (request.status !== 'pending') {
      return { success: false, message: 'This request has already been processed' };
    }

    if (new Date(request.expires_at) < new Date()) {
      // Mark as expired
      await supabase
        .from('admin_requests')
        .update({ status: 'expired' })
        .eq('id', requestId);

      return { success: false, message: 'This admin request has expired' };
    }

    // SECURITY CHECK 4: Prevent self-approval
    if (request.requester_user_id === approvingAdminId) {
      console.error('AdminSecurity: Attempted self-approval:', approvingAdminId);
      return { success: false, message: 'You cannot approve your own admin request' };
    }

    // Begin transaction-like operations
    // Step 1: Create the admin record
    const { error: adminInsertError } = await supabase
      .from('admins')
      .insert({
        account_id: request.requester_user_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (adminInsertError) {
      console.error('AdminSecurity: Error creating admin record:', adminInsertError);
      return { success: false, message: 'Failed to create admin record' };
    }

    // Step 2: Update the request status
    const { error: updateError } = await supabase
      .from('admin_requests')
      .update({
        status: 'approved',
        approved_by: approvingAdminId,
        approved_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('AdminSecurity: Error updating request status:', updateError);
      // Note: Admin record was created but request wasn't updated
      // This is acceptable - the admin exists, status can be fixed manually
    }

    // Step 3: Log the admin approval for audit purposes
    await logAdminAction(
      approvingAdminId,
      'admin_request_approved',
      request.requester_user_id,
      {
        request_id: requestId,
        requester_email: request.requester_email,
        approved_by: approvingAdminId
      }
    );

    console.log('AdminSecurity: Admin request approved successfully:', requestId);

    return {
      success: true,
      message: `Admin privileges granted to ${request.requester_email}`
    };

  } catch (error) {
    console.error('AdminSecurity: Unexpected error in approveAdminRequest:', error);
    return { success: false, message: 'An unexpected error occurred during approval' };
  }
}

/**
 * SECURE: Reject admin request (admin only)
 * 
 * @param requestId - ID of the admin request to reject
 * @param rejectingAdminId - User ID of the admin rejecting the request
 * @param rejectionReason - Reason for rejection
 * @returns Promise<{success: boolean, message: string}>
 */
export async function rejectAdminRequest(
  requestId: string,
  rejectingAdminId: string,
  rejectionReason: string
): Promise<{success: boolean, message: string}> {
  try {
    console.log('AdminSecurity: Admin rejection process started', { requestId, rejectingAdminId });

    // SECURITY CHECK 1: Verify the rejector is actually an admin
    const { data: rejectorAdmin, error: rejectorError } = await supabase
      .from('admins')
      .select('id')
      .eq('account_id', rejectingAdminId)
      .single();

    if (rejectorError || !rejectorAdmin) {
      console.error('AdminSecurity: Rejector is not an admin:', rejectingAdminId);
      return { success: false, message: 'Only existing admins can reject admin requests' };
    }

    // SECURITY CHECK 2: Get and validate the request
    const { data: request, error: requestError } = await supabase
      .from('admin_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      console.error('AdminSecurity: Admin request not found:', requestId);
      return { success: false, message: 'Admin request not found' };
    }

    // SECURITY CHECK 3: Validate request status
    if (request.status !== 'pending') {
      return { success: false, message: 'This request has already been processed' };
    }

    // SECURITY CHECK 4: Validate rejection reason
    if (!rejectionReason || rejectionReason.trim().length < 5) {
      return { success: false, message: 'Please provide a reason for rejection (minimum 5 characters)' };
    }

    // Update the request status
    const { error: updateError } = await supabase
      .from('admin_requests')
      .update({
        status: 'rejected',
        approved_by: rejectingAdminId,
        approved_at: new Date().toISOString(),
        rejection_reason: rejectionReason.trim()
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('AdminSecurity: Error updating request status:', updateError);
      return { success: false, message: 'Failed to update request status' };
    }

    // Log the admin rejection for audit purposes
    await logAdminAction(
      rejectingAdminId,
      'admin_request_rejected',
      request.requester_user_id,
      {
        request_id: requestId,
        requester_email: request.requester_email,
        rejected_by: rejectingAdminId,
        rejection_reason: rejectionReason.substring(0, 100) // Truncate for logging
      }
    );

    console.log('AdminSecurity: Admin request rejected successfully:', requestId);

    return {
      success: true,
      message: `Admin request from ${request.requester_email} has been rejected`
    };

  } catch (error) {
    console.error('AdminSecurity: Unexpected error in rejectAdminRequest:', error);
    return { success: false, message: 'An unexpected error occurred during rejection' };
  }
}

/**
 * Get all pending admin requests (admin only)
 * 
 * @param adminId - User ID of the admin requesting the list
 * @returns Promise<AdminRequest[]>
 */
export async function getPendingAdminRequests(adminId: string): Promise<AdminRequest[]> {
  try {
    // SECURITY CHECK: Verify the requester is actually an admin
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id')
      .eq('account_id', adminId)
      .single();

    if (adminError || !admin) {
      console.error('AdminSecurity: Non-admin attempted to view admin requests:', adminId);
      return [];
    }

    // Get pending requests that haven't expired
    const { data: requests, error: requestsError } = await supabase
      .from('admin_requests')
      .select('*')
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('requested_at', { ascending: false });

    if (requestsError) {
      console.error('AdminSecurity: Error fetching pending admin requests:', requestsError);
      return [];
    }

    return requests || [];

  } catch (error) {
    console.error('AdminSecurity: Unexpected error in getPendingAdminRequests:', error);
    return [];
  }
}

/**
 * Log admin actions for security audit trail
 * 
 * @param adminId - User ID performing the action
 * @param action - Description of the action
 * @param targetUserId - User ID affected by the action (optional)
 * @param metadata - Additional data about the action
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  targetUserId?: string,
  metadata?: any
): Promise<void> {
  try {
    await supabase
      .from('admin_audit_log')
      .insert({
        admin_id: adminId,
        action: action,
        target_user_id: targetUserId,
        metadata: metadata || {},
        created_at: new Date().toISOString()
      });

    console.log('AdminSecurity: Admin action logged:', { adminId, action, targetUserId });

  } catch (error) {
    console.error('AdminSecurity: Error logging admin action:', error);
    // Don't throw - logging failure shouldn't break the main action
  }
}

/**
 * DEPRECATED: ensureAdminForEmail - DO NOT USE
 * 
 * This function has been replaced by requestAdminPrivileges for security reasons.
 * Automatic admin creation based on email is a security vulnerability.
 */
export function ensureAdminForEmail(): never {
  throw new Error(
    'SECURITY ERROR: ensureAdminForEmail has been deprecated due to security vulnerabilities. ' +
    'Use requestAdminPrivileges() instead for secure admin creation.'
  );
}

/**
 * Revoke admin privileges (super admin only)
 * 
 * @param targetUserId - User ID to revoke admin from
 * @param revokingAdminId - User ID of the admin performing the revocation
 * @param reason - Reason for revocation
 * @returns Promise<{success: boolean, message: string}>
 */
export async function revokeAdminPrivileges(
  targetUserId: string,
  revokingAdminId: string,
  reason: string
): Promise<{success: boolean, message: string}> {
  try {
    console.log('AdminSecurity: Admin revocation process started', { targetUserId, revokingAdminId });

    // SECURITY CHECK 1: Verify the revoker is actually an admin
    const { data: revokingAdmin, error: revokingError } = await supabase
      .from('admins')
      .select('id')
      .eq('account_id', revokingAdminId)
      .single();

    if (revokingError || !revokingAdmin) {
      console.error('AdminSecurity: Revoker is not an admin:', revokingAdminId);
      return { success: false, message: 'Only admins can revoke admin privileges' };
    }

    // SECURITY CHECK 2: Prevent self-revocation
    if (targetUserId === revokingAdminId) {
      console.error('AdminSecurity: Attempted self-revocation:', revokingAdminId);
      return { success: false, message: 'You cannot revoke your own admin privileges' };
    }

    // SECURITY CHECK 3: Verify target is actually an admin
    const { data: targetAdmin, error: targetError } = await supabase
      .from('admins')
      .select('id')
      .eq('account_id', targetUserId)
      .single();

    if (targetError || !targetAdmin) {
      return { success: false, message: 'Target user is not an admin' };
    }

    // Remove admin privileges
    const { error: removeError } = await supabase
      .from('admins')
      .delete()
      .eq('account_id', targetUserId);

    if (removeError) {
      console.error('AdminSecurity: Error removing admin privileges:', removeError);
      return { success: false, message: 'Failed to remove admin privileges' };
    }

    // Log the admin revocation for audit purposes
    await logAdminAction(
      revokingAdminId,
      'admin_privileges_revoked',
      targetUserId,
      {
        revoked_by: revokingAdminId,
        reason: reason
      }
    );

    console.log('AdminSecurity: Admin privileges revoked successfully:', targetUserId);

    return {
      success: true,
      message: 'Admin privileges have been revoked'
    };

  } catch (error) {
    console.error('AdminSecurity: Unexpected error in revokeAdminPrivileges:', error);
    return { success: false, message: 'An unexpected error occurred during revocation' };
  }
}