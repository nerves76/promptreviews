/**
 * Ownership Transfer Decline API Route
 *
 * This endpoint handles declining ownership transfers.
 * Only the target user can decline a transfer.
 */

import { createServerClient } from '@supabase/ssr';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { sendOwnershipTransferDeclinedEmail } from '@/utils/emailTemplates';

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
 * POST - Decline ownership transfer (target user only)
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
      .select('id, from_user_id, to_user_id')
      .eq('account_id', accountId)
      .eq('status', 'pending')
      .single();

    if (transferError || !transfer) {
      return NextResponse.json({ error: 'No pending transfer found' }, { status: 404 });
    }

    // Only the target user can decline
    if (transfer.to_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the target user can decline the transfer' },
        { status: 403 }
      );
    }

    // Update status to declined
    const { error: updateError } = await supabaseAdmin
      .from('ownership_transfer_requests')
      .update({ status: 'declined', completed_at: new Date().toISOString() })
      .eq('id', transfer.id);

    if (updateError) {
      console.error('Error declining transfer:', updateError);
      return NextResponse.json({ error: 'Failed to decline transfer' }, { status: 500 });
    }

    // Get user details for email notification
    const { data: fromUser } = await supabaseAdmin.auth.admin.getUserById(transfer.from_user_id);
    const { data: toUser } = await supabaseAdmin.auth.admin.getUserById(transfer.to_user_id);

    const { data: fromProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('first_name')
      .eq('id', transfer.from_user_id)
      .single();

    const { data: toProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('id', transfer.to_user_id)
      .single();

    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('name')
      .eq('account_id', accountId)
      .single();

    const businessName = business?.name || 'the account';
    const targetUserName =
      `${toProfile?.first_name || ''} ${toProfile?.last_name || ''}`.trim() || 'The member';

    // Send email to original owner
    if (fromUser?.user?.email) {
      await sendOwnershipTransferDeclinedEmail(
        fromUser.user.email,
        fromProfile?.first_name || 'there',
        targetUserName,
        businessName
      );
    }

    return NextResponse.json({ message: 'Ownership transfer declined' });
  } catch (error) {
    console.error('Decline ownership transfer API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
