/**
 * Sentiment Analyzer Eligibility Check Endpoint
 *
 * Checks if user is eligible to run sentiment analysis based on:
 * - Review count (minimum 10 reviews)
 * - Monthly usage quota (plan-based limits)
 * - Plan-based review limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import {
  PLAN_ANALYSIS_LIMITS,
  PLAN_REVIEW_LIMITS,
  MIN_REVIEWS_REQUIRED,
  PlanType
} from '@/lib/sentiment-analyzer-constants';

interface EligibilityResponse {
  eligible: boolean;
  reason?: string;
  reviewCount: number;
  reviewLimit: number;
  minReviewsRequired: number;
  usageThisMonth: number;
  usageLimit: number;
  nextResetDate: string;
  plan: PlanType;
  daysUntilReset: number;
}

/**
 * Calculate the first day of next month
 */
function getNextResetDate(): Date {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth;
}

/**
 * Calculate days until next reset
 */
function getDaysUntilReset(): number {
  const now = new Date();
  const nextReset = getNextResetDate();
  const diffTime = nextReset.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
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
          reviewLimit: 0,
          minReviewsRequired: MIN_REVIEWS_REQUIRED,
          usageThisMonth: 0,
          usageLimit: 0,
          nextResetDate: getNextResetDate().toISOString(),
          plan: 'grower',
          daysUntilReset: getDaysUntilReset()
        } as EligibilityResponse,
        { status: 401 }
      );
    }

    // Get user's account ID
    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        {
          eligible: false,
          reason: 'no_account',
          reviewCount: 0,
          reviewLimit: 0,
          minReviewsRequired: MIN_REVIEWS_REQUIRED,
          usageThisMonth: 0,
          usageLimit: 0,
          nextResetDate: getNextResetDate().toISOString(),
          plan: 'grower',
          daysUntilReset: getDaysUntilReset()
        } as EligibilityResponse,
        { status: 400 }
      );
    }

    // Fetch account data to get plan
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('plan, sentiment_analyses_this_month, sentiment_last_reset_date')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        {
          eligible: false,
          reason: 'account_error',
          reviewCount: 0,
          reviewLimit: 0,
          minReviewsRequired: MIN_REVIEWS_REQUIRED,
          usageThisMonth: 0,
          usageLimit: 0,
          nextResetDate: getNextResetDate().toISOString(),
          plan: 'grower',
          daysUntilReset: getDaysUntilReset()
        } as EligibilityResponse,
        { status: 500 }
      );
    }

    // Determine plan (default to grower if not set or invalid)
    let plan: PlanType = 'grower';
    if (account.plan === 'builder' || account.plan === 'maven') {
      plan = account.plan as PlanType;
    }

    // Get plan-based limits
    const usageLimit = PLAN_ANALYSIS_LIMITS[plan];
    const reviewLimit = PLAN_REVIEW_LIMITS[plan];

    // Check if we need to reset monthly counter
    const now = new Date();
    const lastResetDate = account.sentiment_last_reset_date
      ? new Date(account.sentiment_last_reset_date)
      : null;

    let usageThisMonth = account.sentiment_analyses_this_month || 0;

    // Reset if it's a new month
    if (lastResetDate) {
      const isNewMonth = now.getMonth() !== lastResetDate.getMonth() ||
                        now.getFullYear() !== lastResetDate.getFullYear();

      if (isNewMonth) {
        usageThisMonth = 0;
        // Update the reset date in the database
        await supabase
          .from('accounts')
          .update({
            sentiment_analyses_this_month: 0,
            sentiment_last_reset_date: now.toISOString().split('T')[0]
          })
          .eq('id', accountId);
      }
    }

    // Count total reviews in account (joining through widgets for account_id)
    const { count: widgetReviewsCount } = await supabase
      .from('widget_reviews')
      .select('id, widgets!inner(account_id)', { count: 'exact', head: true })
      .eq('widgets.account_id', accountId);

    const { count: submissionsCount } = await supabase
      .from('review_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', accountId);

    const totalReviewCount = (widgetReviewsCount || 0) + (submissionsCount || 0);

    // Calculate next reset date and days until reset
    const nextResetDate = getNextResetDate();
    const daysUntilReset = getDaysUntilReset();

    // Check eligibility
    let eligible = true;
    let reason: string | undefined;

    if (totalReviewCount < MIN_REVIEWS_REQUIRED) {
      eligible = false;
      reason = 'insufficient_reviews';
    } else if (usageThisMonth >= usageLimit) {
      eligible = false;
      reason = 'quota_exceeded';
    }

    return NextResponse.json({
      eligible,
      reason,
      reviewCount: totalReviewCount,
      reviewLimit,
      minReviewsRequired: MIN_REVIEWS_REQUIRED,
      usageThisMonth,
      usageLimit,
      nextResetDate: nextResetDate.toISOString(),
      plan,
      daysUntilReset
    });

  } catch (error) {
    console.error('Eligibility check error:', error);

    return NextResponse.json(
      {
        eligible: false,
        reason: 'server_error',
        reviewCount: 0,
        reviewLimit: 0,
        minReviewsRequired: MIN_REVIEWS_REQUIRED,
        usageThisMonth: 0,
        usageLimit: 0,
        nextResetDate: getNextResetDate().toISOString(),
        plan: 'grower',
        daysUntilReset: getDaysUntilReset()
      } as EligibilityResponse,
      { status: 500 }
    );
  }
}
