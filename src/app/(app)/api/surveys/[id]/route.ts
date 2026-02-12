/**
 * Survey API - Get, Update, Delete single survey
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

    const { data: survey, error } = await supabase
      .from('surveys')
      .select('*, survey_questions(*)')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (error || !survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Sort questions by position
    if (survey.survey_questions) {
      survey.survey_questions.sort((a: any, b: any) => a.position - b.position);
    }

    // Get response count
    const { count } = await supabase
      .from('survey_responses')
      .select('*', { count: 'exact', head: true })
      .eq('survey_id', id);

    return NextResponse.json({ ...survey, response_count: count ?? 0 });
  } catch (error) {
    console.error('[SURVEYS] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
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

    // Verify ownership
    const { data: existing } = await supabase
      .from('surveys')
      .select('id')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    const body = await request.json();
    const { questions, ...surveyFields } = body;

    // Update survey fields
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    const allowedFields = [
      'title', 'description', 'status', 'use_business_styling', 'thank_you_message',
      'show_progress_bar', 'collect_respondent_info', 'require_respondent_email',
      'collect_name', 'require_name', 'collect_email', 'require_email',
      'collect_phone', 'require_phone', 'collect_business_name', 'require_business_name',
      'one_response_per_email',
    ];

    for (const field of allowedFields) {
      if (surveyFields[field] !== undefined) {
        updateData[field] = surveyFields[field];
      }
    }

    const { error: updateError } = await supabase
      .from('surveys')
      .update(updateData)
      .eq('id', id)
      .eq('account_id', accountId);

    if (updateError) {
      console.error('[SURVEYS] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update survey' }, { status: 500 });
    }

    // Update questions if provided (replace all)
    if (questions && Array.isArray(questions)) {
      // Delete existing questions
      await supabase
        .from('survey_questions')
        .delete()
        .eq('survey_id', id);

      // Insert new questions
      if (questions.length > 0) {
        const questionRows = questions.map((q: any, index: number) => ({
          survey_id: id,
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
          console.error('[SURVEYS] Update questions error:', questionsError);
        }
      }
    }

    // Return updated survey
    const { data: updated } = await supabase
      .from('surveys')
      .select('*, survey_questions(*)')
      .eq('id', id)
      .single();

    if (updated?.survey_questions) {
      updated.survey_questions.sort((a: any, b: any) => a.position - b.position);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[SURVEYS] PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
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

    const { error } = await supabase
      .from('surveys')
      .delete()
      .eq('id', id)
      .eq('account_id', accountId);

    if (error) {
      console.error('[SURVEYS] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete survey' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[SURVEYS] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
