/**
 * Survey Responses Summary API - Aggregate stats
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

    // Verify survey ownership and get questions
    const { data: survey } = await supabase
      .from('surveys')
      .select('id, survey_questions(*)')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Fetch all responses
    const { data: responses, error } = await supabase
      .from('survey_responses')
      .select('answers')
      .eq('survey_id', id)
      .eq('account_id', accountId);

    if (error) {
      console.error('[SURVEYS] Summary error:', error);
      return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
    }

    const questions = (survey.survey_questions || []) as any[];
    const allAnswers = (responses || []).flatMap((r: any) => r.answers || []);

    const questionSummaries = questions.map((q: any) => {
      const qAnswers = allAnswers.filter((a: any) => a.question_id === q.id);
      const summary: any = {
        question_id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        responseCount: qAnswers.length,
      };

      if (q.question_type === 'rating_star' || q.question_type === 'rating_number') {
        const numericAnswers = qAnswers
          .map((a: any) => typeof a.answer === 'number' ? a.answer : parseFloat(a.answer))
          .filter((n: number) => !isNaN(n));

        if (numericAnswers.length > 0) {
          summary.averageRating = numericAnswers.reduce((sum: number, n: number) => sum + n, 0) / numericAnswers.length;
          summary.ratingDistribution = {};
          for (const n of numericAnswers) {
            summary.ratingDistribution[n] = (summary.ratingDistribution[n] || 0) + 1;
          }
        }
      }

      if (q.question_type === 'multiple_choice_single' || q.question_type === 'multiple_choice_multi') {
        summary.choiceDistribution = {};
        for (const a of qAnswers) {
          const values = Array.isArray(a.answer) ? a.answer : [a.answer];
          for (const v of values) {
            summary.choiceDistribution[v] = (summary.choiceDistribution[v] || 0) + 1;
          }
        }
      }

      return summary;
    });

    return NextResponse.json({
      totalResponses: responses?.length ?? 0,
      questionSummaries,
    });
  } catch (error) {
    console.error('[SURVEYS] Summary error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
