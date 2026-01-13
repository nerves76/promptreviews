/**
 * Reviews Stats API
 * Returns review counts for the current account
 */

import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { NextRequest, NextResponse } from 'next/server';

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

    // Get total reviews from widget_reviews
    const { count: totalReviews } = await supabase
      .from('widget_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', accountId);

    // Get reviews submitted this month from review_submissions
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const { count: thisMonthReviews } = await supabase
      .from('review_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .gte('created_at', startOfMonth.toISOString());

    return NextResponse.json({
      total: totalReviews || 0,
      this_month: thisMonthReviews || 0,
    });
  } catch (error) {
    console.error('Reviews stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
