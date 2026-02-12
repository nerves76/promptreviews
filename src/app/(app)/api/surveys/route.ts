/**
 * Surveys API - List and Create
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  const suffix = Math.random().toString(36).substring(2, 10);
  return `${base}-${suffix}`;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('surveys')
      .select('*, survey_responses(count)', { count: 'exact' })
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: surveys, error, count } = await query;

    if (error) {
      console.error('[SURVEYS] List error:', error);
      return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 });
    }

    // Transform to include response_count
    const transformed = (surveys || []).map((s: any) => ({
      ...s,
      response_count: s.survey_responses?.[0]?.count ?? 0,
      survey_responses: undefined,
    }));

    return NextResponse.json({ surveys: transformed, total: count ?? 0 });
  } catch (error) {
    console.error('[SURVEYS] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, questions, ...settings } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const slug = generateSlug(title);

    // Create survey
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .insert({
        account_id: accountId,
        slug,
        title: title.trim(),
        description: description?.trim() || null,
        use_business_styling: settings.use_business_styling ?? true,
        thank_you_message: settings.thank_you_message ?? 'Thank you for your response!',
        show_progress_bar: settings.show_progress_bar ?? true,
        collect_respondent_info: settings.collect_respondent_info ?? false,
        require_respondent_email: settings.require_respondent_email ?? false,
        one_response_per_email: settings.one_response_per_email ?? false,
        template_id: settings.template_id || null,
      })
      .select()
      .single();

    if (surveyError) {
      console.error('[SURVEYS] Create error:', surveyError);
      return NextResponse.json({ error: 'Failed to create survey' }, { status: 500 });
    }

    // Create questions if provided
    if (questions && Array.isArray(questions) && questions.length > 0) {
      const questionRows = questions.map((q: any, index: number) => ({
        survey_id: survey.id,
        position: q.position ?? index,
        question_type: q.question_type,
        question_text: q.question_text,
        description: q.description || null,
        is_required: q.is_required ?? false,
        options: q.options || [],
        allow_other: q.allow_other ?? false,
        rating_min: q.rating_min ?? 1,
        rating_max: q.rating_max ?? 5,
        rating_labels: q.rating_labels || {},
        text_max_length: q.text_max_length ?? 1000,
        text_placeholder: q.text_placeholder || null,
      }));

      const { error: questionsError } = await supabase
        .from('survey_questions')
        .insert(questionRows);

      if (questionsError) {
        console.error('[SURVEYS] Create questions error:', questionsError);
        // Don't fail the whole request, survey was created
      }
    }

    // Fetch the full survey with questions
    const { data: fullSurvey } = await supabase
      .from('surveys')
      .select('*, survey_questions(*)')
      .eq('id', survey.id)
      .single();

    return NextResponse.json(fullSurvey, { status: 201 });
  } catch (error) {
    console.error('[SURVEYS] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
