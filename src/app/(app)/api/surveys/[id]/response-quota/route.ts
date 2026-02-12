/**
 * Survey Response Quota API - Check remaining quota
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Get survey free responses
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('id, free_responses_remaining')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (surveyError || !survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Get purchased responses
    const { data: purchases } = await supabase
      .from('survey_response_purchases')
      .select('responses_purchased, responses_used')
      .eq('survey_id', id)
      .eq('account_id', accountId);

    let purchasedRemaining = 0;
    let totalUsed = 0;

    if (purchases) {
      for (const p of purchases) {
        purchasedRemaining += Math.max(0, p.responses_purchased - p.responses_used);
        totalUsed += p.responses_used;
      }
    }

    // Count total responses to add free used
    const { count: totalResponses } = await supabase
      .from('survey_responses')
      .select('*', { count: 'exact', head: true })
      .eq('survey_id', id);

    const freeUsed = (totalResponses ?? 0) - totalUsed;

    return NextResponse.json({
      free_remaining: Math.max(0, survey.free_responses_remaining),
      purchased_remaining: purchasedRemaining,
      total_remaining: Math.max(0, survey.free_responses_remaining) + purchasedRemaining,
      total_used: totalResponses ?? 0,
    });
  } catch (error) {
    console.error('[SURVEYS] Quota error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
