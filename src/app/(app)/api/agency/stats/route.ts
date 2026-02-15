/**
 * Agency Stats API Route
 *
 * GET - Get aggregated stats rolled up from all client accounts
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

    // Get all client account IDs managed by this agency
    const { data: clientAccounts, error: clientsError } = await supabase
      .from('accounts')
      .select('id')
      .eq('managing_agncy_id', accountId)
      .is('deleted_at', null);

    if (clientsError) {
      console.error('Error fetching client accounts:', clientsError);
      return NextResponse.json(
        { error: 'Failed to fetch client accounts' },
        { status: 500 }
      );
    }

    const clientIds = clientAccounts?.map(c => c.id) || [];

    // Initialize stats
    let totalReviews = 0;
    let verifiedReviews = 0;

    if (clientIds.length > 0) {
      // Count review submissions captured through Prompt Pages
      const { count: submissionCount, error: submissionError } = await supabase
        .from('review_submissions')
        .select('*', { count: 'exact', head: true })
        .in('account_id', clientIds)
        .not('prompt_page_id', 'is', null);

      if (!submissionError && submissionCount) {
        totalReviews += submissionCount;
      }

      // Count verified review submissions
      const { count: verifiedSubmissionCount, error: verifiedError } = await supabase
        .from('review_submissions')
        .select('*', { count: 'exact', head: true })
        .in('account_id', clientIds)
        .eq('verified', true);

      if (!verifiedError && verifiedSubmissionCount) {
        verifiedReviews += verifiedSubmissionCount;
      }
    }

    return NextResponse.json({
      total_reviews: totalReviews,
      verified_reviews: verifiedReviews,
      client_count: clientIds.length,
    });
  } catch (error) {
    console.error('Agency stats GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
