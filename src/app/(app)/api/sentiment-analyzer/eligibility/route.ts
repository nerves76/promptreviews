/**
 * Sentiment Analyzer Eligibility Check Endpoint
 *
 * Checks if user is eligible to run sentiment analysis based on:
 * - Review count (minimum 10 reviews)
 * - Credit balance
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/auth/providers/supabase';
import { MIN_REVIEWS_REQUIRED } from '@/lib/sentiment-analyzer-constants';
import {
  calculateSentimentAnalysisCost,
  getTierLabel,
} from '@/features/sentiment-analyzer/services/credits';
import { getBalance } from '@/lib/credits/service';

interface EligibilityResponse {
  eligible: boolean;
  reason?: string;
  reviewCount: number;
  minReviewsRequired: number;
  creditCost: number;
  creditBalance: number;
  tierLabel: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<EligibilityResponse>> {
  try {
    // Check authentication
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          eligible: false,
          reason: 'authentication_required',
          reviewCount: 0,
          minReviewsRequired: MIN_REVIEWS_REQUIRED,
          creditCost: 0,
          creditBalance: 0,
          tierLabel: '',
        } as EligibilityResponse,
        { status: 401 }
      );
    }

    // Get accountId from query params (frontend sends selected account)
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        {
          eligible: false,
          reason: 'no_account',
          reviewCount: 0,
          minReviewsRequired: MIN_REVIEWS_REQUIRED,
          creditCost: 0,
          creditBalance: 0,
          tierLabel: '',
        } as EligibilityResponse,
        { status: 400 }
      );
    }

    // Verify user has access to this account
    const { data: accountUser } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('user_id', user.id)
      .eq('account_id', accountId)
      .maybeSingle();

    if (!accountUser) {
      return NextResponse.json(
        {
          eligible: false,
          reason: 'no_access',
          reviewCount: 0,
          minReviewsRequired: MIN_REVIEWS_REQUIRED,
          creditCost: 0,
          creditBalance: 0,
          tierLabel: '',
        } as EligibilityResponse,
        { status: 403 }
      );
    }

    // Count total reviews in account from review_submissions only
    // (excluding widget_reviews as they are curated/duplicate entries)
    // Only count reviews with actual content
    const { count: submissionsCount, error: countError } = await supabase
      .from('review_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .not('review_content', 'is', null)
      .neq('review_content', '');

    if (countError) {
      console.error('Error counting reviews:', countError);
    }

    const reviewCount = submissionsCount || 0;
    console.log(`[Sentiment Analyzer] Account ${accountId} review count: ${reviewCount}`);

    // Calculate credit cost for current review count
    const creditCost = calculateSentimentAnalysisCost(reviewCount);
    const tierLabel = getTierLabel(reviewCount);

    // Get credit balance using service role client
    const serviceSupabase = createServiceRoleClient();
    const balance = await getBalance(serviceSupabase, accountId);
    const creditBalance = balance.totalCredits;

    // Check eligibility
    let eligible = true;
    let reason: string | undefined;

    if (reviewCount < MIN_REVIEWS_REQUIRED) {
      eligible = false;
      reason = 'insufficient_reviews';
    } else if (creditBalance < creditCost) {
      eligible = false;
      reason = 'insufficient_credits';
    }

    return NextResponse.json({
      eligible,
      reason,
      reviewCount,
      minReviewsRequired: MIN_REVIEWS_REQUIRED,
      creditCost,
      creditBalance,
      tierLabel,
    });

  } catch (error) {
    console.error('Eligibility check error:', error);

    return NextResponse.json(
      {
        eligible: false,
        reason: 'server_error',
        reviewCount: 0,
        minReviewsRequired: MIN_REVIEWS_REQUIRED,
        creditCost: 0,
        creditBalance: 0,
        tierLabel: '',
      } as EligibilityResponse,
      { status: 500 }
    );
  }
}
