/**
 * GBP Protection Alerts API
 *
 * GET: Returns pending and recent change alerts for the account
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Check if user has eligible tier
    const { data: account } = await supabase
      .from('accounts')
      .select('plan, subscription_status')
      .eq('id', accountId)
      .single();

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const isEligible = account.plan === 'builder' || account.plan === 'maven';
    if (!isEligible) {
      return NextResponse.json({
        eligible: false,
        message: 'GBP Profile Protection is available for Builder and Maven plans',
        upgradeUrl: '/dashboard/plan'
      }, { status: 200 });
    }

    // Get status filter from query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    // Get monitored locations count
    const { data: monitoredLocations, count: monitoredCount } = await supabase
      .from('selected_gbp_locations')
      .select('location_id, location_name', { count: 'exact' })
      .eq('account_id', accountId);

    // Get alerts for this account
    let query = supabase
      .from('gbp_change_alerts')
      .select('*')
      .eq('account_id', accountId)
      .order('detected_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: alerts, error } = await query.limit(100);

    if (error) {
      console.error('Error fetching alerts:', error);
      return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
    }

    // Get counts for stats (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    const [pendingResult, acceptedResult, rejectedResult] = await Promise.all([
      supabase
        .from('gbp_change_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId)
        .eq('status', 'pending'),
      supabase
        .from('gbp_change_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId)
        .eq('status', 'accepted')
        .gte('updated_at', thirtyDaysAgoISO),
      supabase
        .from('gbp_change_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId)
        .eq('status', 'rejected')
        .gte('updated_at', thirtyDaysAgoISO)
    ]);

    return NextResponse.json({
      eligible: true,
      alerts: alerts || [],
      stats: {
        pendingCount: pendingResult.count || 0,
        acceptedCount: acceptedResult.count || 0,
        rejectedCount: rejectedResult.count || 0,
        timePeriod: 'last30days'
      },
      monitoredLocations: {
        count: monitoredCount || 0,
        locations: monitoredLocations || []
      }
    });

  } catch (error) {
    console.error('Error in alerts API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
