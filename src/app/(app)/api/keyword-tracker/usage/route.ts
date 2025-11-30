/**
 * Keyword Tracker Usage Endpoint
 *
 * Returns current usage count and monthly limit for keyword analyses and suggestions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

export const dynamic = 'force-dynamic';

const MONTHLY_LIMIT = 3;

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get account ID
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'No valid account found' },
        { status: 403 }
      );
    }

    const serviceSupabase = createServiceRoleClient();

    const { data: accountData } = await serviceSupabase
      .from('accounts')
      .select('keyword_analyses_this_month, keyword_last_reset_date, keyword_suggestions_this_month, keyword_suggestions_last_reset_date')
      .eq('id', accountId)
      .single();

    const now = new Date();

    // Process analyses usage
    let analysesUsage = accountData?.keyword_analyses_this_month || 0;
    const analysesLastReset = accountData?.keyword_last_reset_date
      ? new Date(accountData.keyword_last_reset_date)
      : null;

    if (analysesLastReset) {
      const isNewMonth = now.getMonth() !== analysesLastReset.getMonth() ||
                        now.getFullYear() !== analysesLastReset.getFullYear();
      if (isNewMonth) {
        analysesUsage = 0;
      }
    }

    // Process suggestions usage
    let suggestionsUsage = accountData?.keyword_suggestions_this_month || 0;
    const suggestionsLastReset = accountData?.keyword_suggestions_last_reset_date
      ? new Date(accountData.keyword_suggestions_last_reset_date)
      : null;

    if (suggestionsLastReset) {
      const isNewMonth = now.getMonth() !== suggestionsLastReset.getMonth() ||
                        now.getFullYear() !== suggestionsLastReset.getFullYear();
      if (isNewMonth) {
        suggestionsUsage = 0;
      }
    }

    // Get count of reviews available to scan
    const { count: reviewCount } = await serviceSupabase
      .from('review_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .not('review_content', 'is', null);

    return NextResponse.json({
      success: true,
      analyses: {
        usageThisMonth: analysesUsage,
        monthlyLimit: MONTHLY_LIMIT,
        remaining: Math.max(0, MONTHLY_LIMIT - analysesUsage),
      },
      suggestions: {
        usageThisMonth: suggestionsUsage,
        monthlyLimit: MONTHLY_LIMIT,
        remaining: Math.max(0, MONTHLY_LIMIT - suggestionsUsage),
      },
      reviewCount: reviewCount || 0,
      // Keep backwards compatibility
      usageThisMonth: analysesUsage,
      monthlyLimit: MONTHLY_LIMIT,
      remaining: Math.max(0, MONTHLY_LIMIT - analysesUsage),
    });

  } catch (error) {
    console.error('[keyword-tracker/usage] Unexpected error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch usage',
      },
      { status: 500 }
    );
  }
}
