/**
 * Sentiment Analyzer Single Analysis Endpoint
 *
 * Fetches a single sentiment analysis by ID.
 * Verifies user has access to the analysis's account.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

interface SentimentAnalysisResult {
  metadata: {
    analysisId: string;
    runDate: string;
    reviewCount: number;
    reviewLimit: number;
    totalReviewsInAccount: number;
    dateRangeAnalyzed: { start: string; end: string };
    analysisVersion: string;
  };
  sentimentSummary: {
    overallLabel: 'positive' | 'mixed' | 'negative';
    sentimentScore: number;
    breakdown: Record<'positive' | 'mixed' | 'negative', {
      count: number;
      percentage: number;
    }>;
    shortSummary: string;
  };
  themes: Array<{
    name: string;
    sentiment: 'strength' | 'improvement';
    mentionCount: number;
    supportingQuotes: Array<{
      reviewId: string;
      excerpt: string;
    }>;
  }>;
  improvementIdeas: Array<{
    title: string;
    description: string;
    sourceThemes: string[];
  }>;
  limitations?: string;
}

interface AnalysisResponse {
  results: SentimentAnalysisResult;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<AnalysisResponse | { error: string }>> {
  try {
    // Check authentication
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get analysis ID from params
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      );
    }

    // Fetch analysis
    const serviceSupabase = createServiceRoleClient();
    const { data: analysis, error: fetchError } = await serviceSupabase
      .from('sentiment_analysis_runs')
      .select('id, account_id, run_date, review_count_analyzed, results_json, date_range_start, date_range_end, plan_at_time, analysis_version')
      .eq('id', id)
      .single();

    if (fetchError || !analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this account
    const userAccountId = await getRequestAccountId(request, user.id, supabase);
    if (userAccountId !== analysis.account_id) {
      return NextResponse.json(
        { error: 'Access denied to this analysis' },
        { status: 403 }
      );
    }

    // Return the full analysis result
    const results = analysis.results_json as SentimentAnalysisResult;

    return NextResponse.json({
      results
    });

  } catch (error) {
    console.error('Analysis fetch error:', error);

    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
}
