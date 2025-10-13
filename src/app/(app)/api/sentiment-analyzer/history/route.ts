/**
 * Sentiment Analyzer History Endpoint
 *
 * Fetches past sentiment analyses for an account.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

interface HistoryItem {
  id: string;
  runDate: string;
  reviewCount: number;
  overallLabel: 'positive' | 'mixed' | 'negative';
  sentimentScore: number;
}

interface HistoryResponse {
  analyses: HistoryItem[];
  total: number;
}

export async function GET(request: NextRequest): Promise<NextResponse<HistoryResponse>> {
  try {
    // Check authentication
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { analyses: [], total: 0 },
        { status: 401 }
      );
    }

    // Get accountId from query params
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    if (!accountId) {
      return NextResponse.json(
        { analyses: [], total: 0 },
        { status: 400 }
      );
    }

    // Verify user has access to this account
    const userAccountId = await getRequestAccountId(request, user.id, supabase);
    if (userAccountId !== accountId) {
      return NextResponse.json(
        { analyses: [], total: 0 },
        { status: 403 }
      );
    }

    // Fetch analysis history
    const serviceSupabase = createServiceRoleClient();
    const { data: analyses, error: fetchError, count } = await serviceSupabase
      .from('sentiment_analysis_runs')
      .select('id, run_date, review_count_analyzed, results_json', { count: 'exact' })
      .eq('account_id', accountId)
      .order('run_date', { ascending: false })
      .limit(limit);

    if (fetchError) {
      console.error('Error fetching analysis history:', fetchError);
      return NextResponse.json(
        { analyses: [], total: 0 },
        { status: 500 }
      );
    }

    // Transform data to response format
    const historyItems: HistoryItem[] = (analyses || []).map(analysis => {
      const results = analysis.results_json as any;
      return {
        id: analysis.id,
        runDate: analysis.run_date,
        reviewCount: analysis.review_count_analyzed,
        overallLabel: results?.sentimentSummary?.overallLabel || 'mixed',
        sentimentScore: results?.sentimentSummary?.sentimentScore || 0
      };
    });

    return NextResponse.json({
      analyses: historyItems,
      total: count || 0
    });

  } catch (error) {
    console.error('History fetch error:', error);

    return NextResponse.json(
      { analyses: [], total: 0 },
      { status: 500 }
    );
  }
}
