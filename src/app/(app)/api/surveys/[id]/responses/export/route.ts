/**
 * Survey Responses Export API - CSV download
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
      .select('id, title, survey_questions(*)')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    const questions = ((survey.survey_questions || []) as any[]).sort(
      (a: any, b: any) => a.position - b.position
    );

    // Fetch all responses
    const { data: responses, error } = await supabase
      .from('survey_responses')
      .select('*')
      .eq('survey_id', id)
      .eq('account_id', accountId)
      .order('submitted_at', { ascending: true });

    if (error) {
      console.error('[SURVEYS] Export error:', error);
      return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
    }

    // Build CSV
    const headers = [
      'Submitted At',
      'Respondent Name',
      'Respondent Email',
      'Source',
      ...questions.map((q: any) => q.question_text),
    ];

    const escapeCSV = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const rows = (responses || []).map((r: any) => {
      const answerMap = new Map<string, any>();
      for (const a of r.answers || []) {
        answerMap.set(a.question_id, a.answer);
      }

      return [
        r.submitted_at || '',
        r.respondent_name || '',
        r.respondent_email || '',
        r.source_channel || '',
        ...questions.map((q: any) => {
          const answer = answerMap.get(q.id);
          if (answer === undefined || answer === null) return '';
          if (Array.isArray(answer)) return answer.join('; ');
          return String(answer);
        }),
      ];
    });

    const csv = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(',')),
    ].join('\n');

    const filename = `${survey.title.replace(/[^a-z0-9]/gi, '_')}_responses.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[SURVEYS] Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
