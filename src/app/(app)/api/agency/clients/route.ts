/**
 * Agency Clients API Route
 *
 * GET - List all clients managed by the agency
 * POST - Invite agency to manage a client account
 */

import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET - List all clients managed by this agency
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);

    if (!accountId) {
      return NextResponse.json(
        { error: 'No valid account found' },
        { status: 403 }
      );
    }

    // Verify this is an agency account
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, is_agncy')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    if (!account.is_agncy) {
      return NextResponse.json(
        { error: 'This account is not an agency' },
        { status: 403 }
      );
    }

    // Get all client accounts managed by this agency
    const { data: clientAccounts, error: clientsError } = await supabase
      .from('accounts')
      .select(`
        id,
        business_name,
        first_name,
        last_name,
        email,
        plan,
        subscription_status,
        trial_start,
        trial_end,
        agncy_billing_owner,
        monthly_credit_allocation,
        created_at
      `)
      .eq('managing_agncy_id', accountId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // Get credit balances for all clients
    const clientIds = clientAccounts?.map(c => c.id) || [];
    const { data: creditBalances } = clientIds.length > 0
      ? await supabase
          .from('credit_balances')
          .select('account_id, included_credits, purchased_credits')
          .in('account_id', clientIds)
      : { data: [] };

    // Get logos from businesses table
    const { data: businessLogos } = clientIds.length > 0
      ? await supabase
          .from('businesses')
          .select('account_id, logo_url')
          .in('account_id', clientIds)
      : { data: [] };

    const logoMap = new Map(
      businessLogos?.map(b => [b.account_id, b.logo_url]) || []
    );

    const creditBalanceMap = new Map(
      creditBalances?.map(cb => [cb.account_id, cb]) || []
    );

    // Get review counts for all clients (total reviews)
    const { data: reviewCounts } = clientIds.length > 0
      ? await supabase
          .from('widget_reviews')
          .select('account_id')
          .in('account_id', clientIds)
      : { data: [] };

    // Count reviews per account
    const reviewCountMap = new Map<string, number>();
    reviewCounts?.forEach(r => {
      const current = reviewCountMap.get(r.account_id) || 0;
      reviewCountMap.set(r.account_id, current + 1);
    });

    // Get reviews submitted this month
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const { data: monthlyReviews } = clientIds.length > 0
      ? await supabase
          .from('review_submissions')
          .select('account_id')
          .in('account_id', clientIds)
          .gte('created_at', startOfMonth.toISOString())
      : { data: [] };

    // Count monthly reviews per account
    const monthlyReviewMap = new Map<string, number>();
    monthlyReviews?.forEach(r => {
      const current = monthlyReviewMap.get(r.account_id) || 0;
      monthlyReviewMap.set(r.account_id, current + 1);
    });

    if (clientsError) {
      console.error('Error fetching client accounts:', clientsError);
      return NextResponse.json(
        { error: 'Failed to fetch client accounts' },
        { status: 500 }
      );
    }

    // Get agency access records for additional context
    const { data: accessRecords, error: accessError } = await supabase
      .from('agncy_client_access')
      .select('client_account_id, status, role, accepted_at')
      .eq('agency_account_id', accountId)
      .eq('user_id', user.id);

    // Map access status to clients
    const accessMap = new Map(
      accessRecords?.map(r => [r.client_account_id, r]) || []
    );

    // Calculate status for each client
    const clients = clientAccounts?.map(client => {
      const access = accessMap.get(client.id);
      let status: string;

      if (client.subscription_status === 'active') {
        status = 'active';
      } else if (client.subscription_status === 'trialing' || client.trial_end) {
        const trialEnd = client.trial_end ? new Date(client.trial_end) : null;
        if (trialEnd && trialEnd > new Date()) {
          status = 'trial';
        } else {
          status = 'needs_billing';
        }
      } else if (client.subscription_status === 'canceled') {
        status = 'canceled';
      } else if (!client.plan || client.plan === 'no_plan') {
        status = 'needs_billing';
      } else {
        status = 'active';
      }

      // Get credit info for this client
      const creditBalance = creditBalanceMap.get(client.id);
      const totalBalance = (creditBalance?.included_credits || 0) + (creditBalance?.purchased_credits || 0);

      // Get monthly credits based on plan (or custom allocation)
      let monthlyCredits = client.monthly_credit_allocation;
      if (monthlyCredits === null || monthlyCredits === undefined) {
        // Default based on plan
        switch (client.plan) {
          case 'maven': monthlyCredits = 400; break;
          case 'builder': monthlyCredits = 200; break;
          case 'grower': monthlyCredits = 100; break;
          default: monthlyCredits = 100; // Default for client accounts
        }
      }

      return {
        id: client.id,
        business_name: client.business_name,
        logo_url: logoMap.get(client.id) || null,
        contact_name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || null,
        email: client.email,
        plan: client.plan,
        status,
        subscription_status: client.subscription_status,
        billing_owner: client.agncy_billing_owner,
        access_status: access?.status || 'active',
        access_role: access?.role || 'manager',
        connected_at: access?.accepted_at || client.created_at,
        credits: {
          balance: totalBalance,
          monthly: monthlyCredits,
        },
        reviews: {
          total: reviewCountMap.get(client.id) || 0,
          this_month: monthlyReviewMap.get(client.id) || 0,
        },
      };
    }) || [];

    // Also get pending invitations (clients who haven't accepted yet)
    const { data: pendingAccess, error: pendingError } = await supabase
      .from('agncy_client_access')
      .select(`
        id,
        client_account_id,
        status,
        role,
        invited_at,
        accounts:client_account_id (
          id,
          business_name,
          first_name,
          last_name,
          email
        )
      `)
      .eq('agency_account_id', accountId)
      .eq('status', 'pending');

    const pendingClients = pendingAccess?.map(p => {
      const clientAccount = p.accounts as any;
      return {
        id: p.client_account_id,
        business_name: clientAccount?.business_name,
        contact_name: `${clientAccount?.first_name || ''} ${clientAccount?.last_name || ''}`.trim() || null,
        email: clientAccount?.email,
        status: 'pending',
        access_role: p.role,
        invited_at: p.invited_at,
      };
    }) || [];

    return NextResponse.json({
      clients,
      pending: pendingClients,
      total: clients.length,
      pending_count: pendingClients.length,
    });
  } catch (error) {
    console.error('Agency clients GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Invite agency to manage a client account
 * This creates a pending relationship that the client must accept
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const supabaseAdmin = createServiceRoleClient();

  try {
    const body = await request.json();
    const { client_account_id, role = 'manager' } = body;

    if (!client_account_id) {
      return NextResponse.json(
        { error: 'client_account_id is required' },
        { status: 400 }
      );
    }

    if (!['manager', 'billing_manager'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be manager or billing_manager' },
        { status: 400 }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const agencyAccountId = await getRequestAccountId(request, user.id, supabase);

    if (!agencyAccountId) {
      return NextResponse.json(
        { error: 'No valid account found' },
        { status: 403 }
      );
    }

    // Verify this is an agency account and user is owner
    const { data: agencyAccount, error: agencyError } = await supabase
      .from('accounts')
      .select('id, is_agncy, business_name')
      .eq('id', agencyAccountId)
      .single();

    if (agencyError || !agencyAccount) {
      return NextResponse.json(
        { error: 'Agency account not found' },
        { status: 404 }
      );
    }

    if (!agencyAccount.is_agncy) {
      return NextResponse.json(
        { error: 'This account is not an agency' },
        { status: 403 }
      );
    }

    // Verify user is owner of agency
    const { data: agencyUser, error: roleError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', agencyAccountId)
      .eq('user_id', user.id)
      .single();

    if (roleError || !agencyUser || agencyUser.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only agency owners can invite to manage clients' },
        { status: 403 }
      );
    }

    // Verify client account exists and is not already managed
    const { data: clientAccount, error: clientError } = await supabase
      .from('accounts')
      .select('id, business_name, managing_agncy_id, email')
      .eq('id', client_account_id)
      .is('deleted_at', null)
      .single();

    if (clientError || !clientAccount) {
      return NextResponse.json(
        { error: 'Client account not found' },
        { status: 404 }
      );
    }

    if (clientAccount.managing_agncy_id && clientAccount.managing_agncy_id !== agencyAccountId) {
      return NextResponse.json(
        { error: 'This client is already managed by another agency' },
        { status: 400 }
      );
    }

    // Check for existing pending/active access
    const { data: existingAccess, error: existingError } = await supabase
      .from('agncy_client_access')
      .select('id, status')
      .eq('agency_account_id', agencyAccountId)
      .eq('client_account_id', client_account_id)
      .eq('user_id', user.id)
      .in('status', ['pending', 'active'])
      .maybeSingle();

    if (existingAccess) {
      return NextResponse.json(
        { error: `Agency access is already ${existingAccess.status}` },
        { status: 400 }
      );
    }

    // Create pending access record using admin client to bypass RLS
    const { data: accessRecord, error: createError } = await supabaseAdmin
      .from('agncy_client_access')
      .insert({
        agency_account_id: agencyAccountId,
        client_account_id: client_account_id,
        user_id: user.id,
        role,
        status: 'pending',
        invited_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating agency access:', createError);
      return NextResponse.json(
        { error: 'Failed to create agency access request' },
        { status: 500 }
      );
    }

    // Log the event
    await supabaseAdmin.from('account_events').insert({
      account_id: client_account_id,
      event_type: 'agency_invited',
      event_data: {
        agency_account_id: agencyAccountId,
        agency_name: agencyAccount.business_name,
        invited_by: user.id,
        role,
      },
    });

    return NextResponse.json({
      message: 'Agency access request created',
      access: {
        id: accessRecord.id,
        client_account_id,
        role,
        status: 'pending',
      },
      // TODO: Send email notification to client
    });
  } catch (error) {
    console.error('Agency clients POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
