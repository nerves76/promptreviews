/**
 * Admin API: AI Usage Statistics
 *
 * Returns app-wide totals and top accounts by usage for each feature type.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { isAdmin } from '@/utils/admin';

interface UsageSummary {
  feature_type: string;
  total_cost: number;
  total_requests: number;
  total_tokens: number;
}

interface TopAccount {
  account_id: string;
  business_name: string | null;
  email: string | null;
  total_cost: number;
  total_requests: number;
}

interface FeatureUsage {
  feature_type: string;
  label: string;
  total_cost: number;
  total_requests: number;
  total_tokens: number;
  top_accounts: TopAccount[];
}

// Feature type labels for display
const FEATURE_LABELS: Record<string, string> = {
  'geo_grid_check': 'Local Ranking Grid',
  'rank_tracking': 'SERP Rank Tracking',
  'llm_visibility': 'AI Visibility',
  'domain_analysis': 'Domain Analysis',
  'fix_grammar': 'Fix Grammar',
  'generate_review': 'Generate Review',
  'generate_reviews': 'Generate Reviews (Batch)',
  'generate_keywords': 'Generate Keywords',
  'gbp_description_analysis': 'GBP Description Analysis',
  'gbp_service_description': 'GBP Service Description',
  'gbp_review_response': 'GBP Review Response',
  'sentiment_analysis': 'Sentiment Analysis',
};

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin check
    const adminStatus = await isAdmin(user.id, supabase);
    if (!adminStatus) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query params for date range
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30', 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const serviceSupabase = createServiceRoleClient();

    // 1. Get app-wide totals by feature type
    const { data: totalsData, error: totalsError } = await serviceSupabase
      .from('ai_usage')
      .select('feature_type, cost_usd, total_tokens')
      .gte('created_at', startDate.toISOString());

    if (totalsError) {
      console.error('Error fetching totals:', totalsError);
      return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
    }

    // Aggregate totals by feature type
    const totalsMap = new Map<string, UsageSummary>();
    (totalsData || []).forEach((row: any) => {
      const ft = row.feature_type || 'unknown';
      const existing = totalsMap.get(ft) || {
        feature_type: ft,
        total_cost: 0,
        total_requests: 0,
        total_tokens: 0,
      };
      existing.total_cost += parseFloat(row.cost_usd || '0');
      existing.total_requests += 1;
      existing.total_tokens += row.total_tokens || 0;
      totalsMap.set(ft, existing);
    });

    // 2. Get top 5 accounts by cost for each feature type
    const featureTypes = Array.from(totalsMap.keys());
    const featureUsage: FeatureUsage[] = [];

    for (const ft of featureTypes) {
      // Query to get top accounts for this feature type
      const { data: topAccountsData, error: topError } = await serviceSupabase
        .from('ai_usage')
        .select(`
          account_id,
          cost_usd
        `)
        .eq('feature_type', ft)
        .gte('created_at', startDate.toISOString())
        .not('account_id', 'is', null);

      if (topError) {
        console.error(`Error fetching top accounts for ${ft}:`, topError);
        continue;
      }

      // Aggregate by account
      const accountTotals = new Map<string, { total_cost: number; total_requests: number }>();
      (topAccountsData || []).forEach((row: any) => {
        const accId = row.account_id;
        const existing = accountTotals.get(accId) || { total_cost: 0, total_requests: 0 };
        existing.total_cost += parseFloat(row.cost_usd || '0');
        existing.total_requests += 1;
        accountTotals.set(accId, existing);
      });

      // Sort by cost and take top 5
      const sortedAccounts = Array.from(accountTotals.entries())
        .sort((a, b) => b[1].total_cost - a[1].total_cost)
        .slice(0, 5);

      // Fetch account details for top accounts
      const topAccountIds = sortedAccounts.map(([id]) => id);
      let accountDetails: Record<string, { business_name: string | null; email: string | null }> = {};

      if (topAccountIds.length > 0) {
        const { data: accountsData } = await serviceSupabase
          .from('accounts')
          .select('id, business_name, email')
          .in('id', topAccountIds);

        (accountsData || []).forEach((acc: any) => {
          accountDetails[acc.id] = {
            business_name: acc.business_name,
            email: acc.email,
          };
        });
      }

      const topAccounts: TopAccount[] = sortedAccounts.map(([accountId, stats]) => ({
        account_id: accountId,
        business_name: accountDetails[accountId]?.business_name || null,
        email: accountDetails[accountId]?.email || null,
        total_cost: stats.total_cost,
        total_requests: stats.total_requests,
      }));

      const summary = totalsMap.get(ft)!;
      featureUsage.push({
        feature_type: ft,
        label: FEATURE_LABELS[ft] || ft,
        total_cost: summary.total_cost,
        total_requests: summary.total_requests,
        total_tokens: summary.total_tokens,
        top_accounts: topAccounts,
      });
    }

    // Sort by total cost descending
    featureUsage.sort((a, b) => b.total_cost - a.total_cost);

    // 3. Calculate grand totals
    const grandTotals = {
      total_cost: featureUsage.reduce((sum, f) => sum + f.total_cost, 0),
      total_requests: featureUsage.reduce((sum, f) => sum + f.total_requests, 0),
      total_tokens: featureUsage.reduce((sum, f) => sum + f.total_tokens, 0),
      dataforseo_cost: featureUsage
        .filter(f => ['geo_grid_check', 'rank_tracking', 'llm_visibility', 'domain_analysis'].includes(f.feature_type))
        .reduce((sum, f) => sum + f.total_cost, 0),
      openai_cost: featureUsage
        .filter(f => !['geo_grid_check', 'rank_tracking', 'llm_visibility', 'domain_analysis'].includes(f.feature_type))
        .reduce((sum, f) => sum + f.total_cost, 0),
    };

    return NextResponse.json({
      success: true,
      days,
      grand_totals: grandTotals,
      features: featureUsage,
    });

  } catch (error) {
    console.error('Usage stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
