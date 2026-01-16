/**
 * Ownership Transfer Accept API Route
 *
 * This endpoint handles accepting ownership transfers.
 * Only the target user can accept a transfer.
 */

import { createServerClient } from '@supabase/ssr';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { sendOwnershipTransferAcceptedEmail } from '@/utils/emailTemplates';

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
 * POST - Accept ownership transfer (target user only)
 */
export async function POST(request: NextRequest) {
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
      .select('id, from_user_id, to_user_id, expires_at')
      .eq('account_id', accountId)
      .eq('status', 'pending')
      .single();

    if (transferError || !transfer) {
      return NextResponse.json({ error: 'No pending transfer found' }, { status: 404 });
    }

    // Only the target user can accept
    if (transfer.to_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the target user can accept the transfer' },
        { status: 403 }
      );
    }

    // Check if expired
    if (new Date(transfer.expires_at) <= new Date()) {
      await supabaseAdmin
        .from('ownership_transfer_requests')
        .update({ status: 'expired', completed_at: new Date().toISOString() })
        .eq('id', transfer.id);

      return NextResponse.json({ error: 'Transfer has expired' }, { status: 400 });
    }

    // Perform atomic role swap using service role client
    // Step 1: Demote the former owner to member
    const { error: demoteError } = await supabaseAdmin
      .from('account_users')
      .update({ role: 'member' })
      .eq('account_id', accountId)
      .eq('user_id', transfer.from_user_id);

    if (demoteError) {
      console.error('Error demoting former owner:', demoteError);
      return NextResponse.json({ error: 'Failed to transfer ownership' }, { status: 500 });
    }

    // Step 2: Promote the new owner
    const { error: promoteError } = await supabaseAdmin
      .from('account_users')
      .update({ role: 'owner' })
      .eq('account_id', accountId)
      .eq('user_id', transfer.to_user_id);

    if (promoteError) {
      console.error('Error promoting new owner:', promoteError);
      // Rollback: restore original owner
      await supabaseAdmin
        .from('account_users')
        .update({ role: 'owner' })
        .eq('account_id', accountId)
        .eq('user_id', transfer.from_user_id);

      return NextResponse.json({ error: 'Failed to transfer ownership' }, { status: 500 });
    }

    // Step 3: Mark transfer as accepted
    const { error: updateError } = await supabaseAdmin
      .from('ownership_transfer_requests')
      .update({ status: 'accepted', completed_at: new Date().toISOString() })
      .eq('id', transfer.id);

    if (updateError) {
      console.error('Error updating transfer status:', updateError);
      // Don't fail - the role change was successful
    }

    // Get user details for email notifications
    const { data: fromUser } = await supabaseAdmin.auth.admin.getUserById(transfer.from_user_id);
    const { data: toUser } = await supabaseAdmin.auth.admin.getUserById(transfer.to_user_id);

    const { data: fromProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('first_name')
      .eq('id', transfer.from_user_id)
      .single();

    const { data: toProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('first_name')
      .eq('id', transfer.to_user_id)
      .single();

    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('name')
      .eq('account_id', accountId)
      .single();

    const businessName = business?.name || 'the account';

    // Send email to former owner
    if (fromUser?.user?.email) {
      await sendOwnershipTransferAcceptedEmail(
        fromUser.user.email,
        fromProfile?.first_name || 'there',
        businessName,
        true // isFormer = true
      );
    }

    // Send email to new owner
    if (toUser?.user?.email) {
      await sendOwnershipTransferAcceptedEmail(
        toUser.user.email,
        toProfile?.first_name || 'there',
        businessName,
        false // isFormer = false
      );
    }

    return NextResponse.json({
      message: 'Ownership transfer completed',
      new_owner_id: transfer.to_user_id,
      former_owner_id: transfer.from_user_id,
    });
  } catch (error) {
    console.error('Accept ownership transfer API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
