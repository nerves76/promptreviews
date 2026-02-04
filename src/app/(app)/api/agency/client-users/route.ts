/**
 * Agency Client Users API
 *
 * GET - Fetch all users from all client accounts managed by the agency.
 *       Used for @mentions in the agency work manager.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createServiceRoleClient();
    const agencyAccountId = await getRequestAccountId(request, user.id, supabaseAdmin);

    if (!agencyAccountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Verify this is an agency account
    const { data: agencyAccount } = await supabaseAdmin
      .from('accounts')
      .select('id, is_agncy')
      .eq('id', agencyAccountId)
      .single();

    if (!agencyAccount?.is_agncy) {
      return NextResponse.json({ error: 'Not an agency account' }, { status: 403 });
    }

    // Get all client accounts managed by this agency
    const { data: clientAccounts } = await supabaseAdmin
      .from('accounts')
      .select('id, business_name')
      .eq('managing_agncy_id', agencyAccountId)
      .is('deleted_at', null);

    if (!clientAccounts || clientAccounts.length === 0) {
      return NextResponse.json({ users: [] });
    }

    const clientAccountIds = clientAccounts.map(c => c.id);
    const accountNameMap = new Map(clientAccounts.map(c => [c.id, c.business_name]));

    // Get all users from these client accounts
    const { data: clientTeamMembers } = await supabaseAdmin
      .from('account_users')
      .select(`
        user_id,
        account_id,
        users!inner (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .in('account_id', clientAccountIds);

    // Transform and dedupe users (a user might be on multiple client accounts)
    const usersMap = new Map<string, {
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string;
      avatar_url: string | null;
      account_name: string | null;
    }>();

    for (const member of clientTeamMembers || []) {
      const userData = member.users as any;
      if (userData && !usersMap.has(userData.id)) {
        usersMap.set(userData.id, {
          id: userData.id,
          first_name: userData.first_name || null,
          last_name: userData.last_name || null,
          email: userData.email || '',
          avatar_url: userData.avatar_url || null,
          account_name: accountNameMap.get(member.account_id) || null,
        });
      }
    }

    const users = Array.from(usersMap.values());

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error in GET /api/agency/client-users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
