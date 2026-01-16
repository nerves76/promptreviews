/**
 * Ownership Transfer API Route
 *
 * This endpoint handles initiating, viewing, and cancelling ownership transfers.
 * Only account owners can initiate transfers.
 */

import { createServerClient } from '@supabase/ssr';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { sendOwnershipTransferInitiatedEmail } from '@/utils/emailTemplates';

async function createAuthenticatedSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );
}

/**
 * Generate a secure token for ownership transfer
 */
function generateSecureTransferToken(): string {
  const timestamp = Date.now().toString(36);
  const randomBytes1 = randomBytes(24).toString('hex');
  const randomBytes2 = randomBytes(8).toString('base64url');
  const combined = `${timestamp}${randomBytes1}${randomBytes2}`;
  const finalToken = randomBytes(32).toString('hex') + combined.slice(0, 32);
  return finalToken;
}

/**
 * POST - Initiate ownership transfer (owner only)
 */
export async function POST(request: NextRequest) {
  const supabase = await createAuthenticatedSupabaseClient();
  const supabaseAdmin = createServiceRoleClient();

  try {
    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get request body
    const { to_user_id } = await request.json();

    if (!to_user_id) {
      return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 });
    }

    // Prevent self-transfer
    if (to_user_id === user.id) {
      return NextResponse.json({ error: 'Cannot transfer ownership to yourself' }, { status: 400 });
    }

    // Get account ID using secure method
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found or access denied' }, { status: 403 });
    }

    // Get current user's role and verify they are owner
    const { data: currentUserAccount, error: currentUserError } = await supabase
      .from('account_users')
      .select('role')
      .eq('user_id', user.id)
      .eq('account_id', accountId)
      .single();

    if (currentUserError || !currentUserAccount) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    if (currentUserAccount.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only account owners can transfer ownership' },
        { status: 403 }
      );
    }

    // Verify target user is an existing member of this account (not support role)
    const { data: targetUserAccount, error: targetUserError } = await supabase
      .from('account_users')
      .select('role')
      .eq('user_id', to_user_id)
      .eq('account_id', accountId)
      .single();

    if (targetUserError || !targetUserAccount) {
      return NextResponse.json(
        { error: 'Target user is not a member of this account' },
        { status: 400 }
      );
    }

    if (targetUserAccount.role === 'support') {
      return NextResponse.json(
        { error: 'Cannot transfer ownership to support users' },
        { status: 400 }
      );
    }

    if (targetUserAccount.role === 'owner') {
      return NextResponse.json({ error: 'Target user is already an owner' }, { status: 400 });
    }

    // Check for existing pending transfer
    const { data: existingTransfer, error: existingError } = await supabase
      .from('ownership_transfer_requests')
      .select('id, to_user_id, expires_at')
      .eq('account_id', accountId)
      .eq('status', 'pending')
      .single();

    if (existingTransfer && !existingError) {
      const isExpired = new Date(existingTransfer.expires_at) <= new Date();
      if (!isExpired) {
        return NextResponse.json(
          {
            error: 'A pending ownership transfer already exists for this account',
            details: { expires_at: existingTransfer.expires_at },
          },
          { status: 409 }
        );
      }
      // Clean up expired transfer
      await supabaseAdmin
        .from('ownership_transfer_requests')
        .update({ status: 'expired', completed_at: new Date().toISOString() })
        .eq('id', existingTransfer.id);
    }

    // Generate token and expiration
    const token = generateSecureTransferToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // Create transfer request
    const { data: transfer, error: createError } = await supabaseAdmin
      .from('ownership_transfer_requests')
      .insert({
        account_id: accountId,
        from_user_id: user.id,
        to_user_id,
        token,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating ownership transfer:', createError);
      return NextResponse.json({ error: 'Failed to create ownership transfer' }, { status: 500 });
    }

    // Get target user's email and name for notification
    const { data: targetUser, error: targetUserFetchError } =
      await supabaseAdmin.auth.admin.getUserById(to_user_id);

    if (targetUserFetchError || !targetUser.user) {
      console.error('Failed to fetch target user:', targetUserFetchError);
      // Don't fail - transfer was created, email just won't send
    }

    // Get current user's name and account info
    const { data: accountData } = await supabase
      .from('accounts')
      .select('first_name, last_name, business_name')
      .eq('id', accountId)
      .single();

    const { data: targetProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('first_name')
      .eq('id', to_user_id)
      .single();

    // Get business name
    const { data: business } = await supabase
      .from('businesses')
      .select('name')
      .eq('account_id', accountId)
      .single();

    // Send email notification
    if (targetUser?.user?.email) {
      const fromUserName =
        `${accountData?.first_name || ''} ${accountData?.last_name || ''}`.trim() || 'The owner';
      const businessName = business?.name || accountData?.business_name || 'the account';
      const targetFirstName = targetProfile?.first_name || 'there';
      const formattedExpiration = expiresAt.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const emailResult = await sendOwnershipTransferInitiatedEmail(
        targetUser.user.email,
        targetFirstName,
        fromUserName,
        businessName,
        formattedExpiration
      );

      if (!emailResult.success) {
        console.error('Failed to send ownership transfer email:', emailResult.error);
        // Don't fail the request - transfer was created
      }
    }

    return NextResponse.json({
      message: 'Ownership transfer initiated',
      transfer: {
        id: transfer.id,
        to_user_id: transfer.to_user_id,
        expires_at: transfer.expires_at,
      },
    });
  } catch (error) {
    console.error('Ownership transfer API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET - Get pending ownership transfer status
 */
export async function GET(request: NextRequest) {
  const supabase = await createAuthenticatedSupabaseClient();
  const supabaseAdmin = createServiceRoleClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found or access denied' }, { status: 403 });
    }

    // Get any pending transfer for this account
    const { data: transfer, error: transferError } = await supabase
      .from('ownership_transfer_requests')
      .select('id, from_user_id, to_user_id, status, expires_at, created_at')
      .eq('account_id', accountId)
      .eq('status', 'pending')
      .single();

    if (transferError && transferError.code !== 'PGRST116') {
      console.error('Error fetching transfer:', transferError);
      return NextResponse.json({ error: 'Failed to fetch transfer status' }, { status: 500 });
    }

    if (!transfer) {
      return NextResponse.json({ transfer: null });
    }

    // Check if expired
    const isExpired = new Date(transfer.expires_at) <= new Date();
    if (isExpired) {
      // Mark as expired
      await supabaseAdmin
        .from('ownership_transfer_requests')
        .update({ status: 'expired', completed_at: new Date().toISOString() })
        .eq('id', transfer.id);

      return NextResponse.json({ transfer: null });
    }

    // Get user details for display
    const { data: fromUser } = await supabaseAdmin.auth.admin.getUserById(transfer.from_user_id);
    const { data: toUser } = await supabaseAdmin.auth.admin.getUserById(transfer.to_user_id);

    const { data: fromProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('id', transfer.from_user_id)
      .single();

    const { data: toProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('id', transfer.to_user_id)
      .single();

    return NextResponse.json({
      transfer: {
        id: transfer.id,
        from_user_id: transfer.from_user_id,
        to_user_id: transfer.to_user_id,
        from_user_email: fromUser?.user?.email || '',
        to_user_email: toUser?.user?.email || '',
        from_user_name:
          `${fromProfile?.first_name || ''} ${fromProfile?.last_name || ''}`.trim() || 'Owner',
        to_user_name:
          `${toProfile?.first_name || ''} ${toProfile?.last_name || ''}`.trim() || 'Member',
        status: transfer.status,
        expires_at: transfer.expires_at,
        created_at: transfer.created_at,
        is_initiator: transfer.from_user_id === user.id,
        is_target: transfer.to_user_id === user.id,
      },
    });
  } catch (error) {
    console.error('Get ownership transfer API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE - Cancel pending ownership transfer (initiator only)
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createAuthenticatedSupabaseClient();
  const supabaseAdmin = createServiceRoleClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found or access denied' }, { status: 403 });
    }

    // Get the pending transfer
    const { data: transfer, error: transferError } = await supabase
      .from('ownership_transfer_requests')
      .select('id, from_user_id')
      .eq('account_id', accountId)
      .eq('status', 'pending')
      .single();

    if (transferError || !transfer) {
      return NextResponse.json({ error: 'No pending transfer found' }, { status: 404 });
    }

    // Only the initiator can cancel
    if (transfer.from_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the transfer initiator can cancel' },
        { status: 403 }
      );
    }

    // Update status to cancelled
    const { error: updateError } = await supabaseAdmin
      .from('ownership_transfer_requests')
      .update({ status: 'cancelled', completed_at: new Date().toISOString() })
      .eq('id', transfer.id);

    if (updateError) {
      console.error('Error cancelling transfer:', updateError);
      return NextResponse.json({ error: 'Failed to cancel transfer' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Ownership transfer cancelled' });
  } catch (error) {
    console.error('Cancel ownership transfer API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
