/**
 * Keyword Tracker Usage Endpoint
 *
 * Returns current usage count and monthly limit for keyword analyses.
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
      .select('keyword_analyses_this_month, keyword_last_reset_date')
      .eq('id', accountId)
      .single();

    let usageThisMonth = accountData?.keyword_analyses_this_month || 0;
    const lastResetDate = accountData?.keyword_last_reset_date
      ? new Date(accountData.keyword_last_reset_date)
      : null;

    // Check if we need to reset the counter (new month)
    const now = new Date();
    if (lastResetDate) {
      const isNewMonth = now.getMonth() !== lastResetDate.getMonth() ||
                        now.getFullYear() !== lastResetDate.getFullYear();
      if (isNewMonth) {
        usageThisMonth = 0;
      }
    }

    return NextResponse.json({
      success: true,
      usageThisMonth,
      monthlyLimit: MONTHLY_LIMIT,
      remaining: Math.max(0, MONTHLY_LIMIT - usageThisMonth),
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
