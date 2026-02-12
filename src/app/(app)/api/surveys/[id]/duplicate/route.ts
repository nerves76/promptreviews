/**
 * Survey Duplicate API
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

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
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

    // Fetch original survey with questions
    const { data: original, error: fetchError } = await supabase
      .from('surveys')
      .select('*, survey_questions(*)')
      .eq('id', id)
      .eq('account_id', accountId)
      .single();

    if (fetchError || !original) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    const newTitle = `${original.title} (copy)`;
    const slug = generateSlug(newTitle);

    // Create new survey
    const { data: newSurvey, error: createError } = await supabase
      .from('surveys')
      .insert({
        account_id: accountId,
        slug,
        title: newTitle,
        description: original.description,
        status: 'draft',
        use_business_styling: original.use_business_styling,
        thank_you_message: original.thank_you_message,
        show_progress_bar: original.show_progress_bar,
        collect_respondent_info: original.collect_respondent_info,
        require_respondent_email: original.require_respondent_email,
        one_response_per_email: original.one_response_per_email,
        template_id: original.template_id,
      })
      .select()
      .single();

    if (createError || !newSurvey) {
      console.error('[SURVEYS] Duplicate error:', createError);
      return NextResponse.json({ error: 'Failed to duplicate survey' }, { status: 500 });
    }

    // Copy questions
    if (original.survey_questions && original.survey_questions.length > 0) {
      const questionRows = original.survey_questions.map((q: any) => ({
        survey_id: newSurvey.id,
        position: q.position,
        question_type: q.question_type,
        question_text: q.question_text,
        description: q.description,
        is_required: q.is_required,
        options: q.options,
        allow_other: q.allow_other,
        rating_min: q.rating_min,
        rating_max: q.rating_max,
        rating_labels: q.rating_labels,
        text_max_length: q.text_max_length,
        text_placeholder: q.text_placeholder,
      }));

      await supabase.from('survey_questions').insert(questionRows);
    }

    // Return full survey
    const { data: fullSurvey } = await supabase
      .from('surveys')
      .select('*, survey_questions(*)')
      .eq('id', newSurvey.id)
      .single();

    return NextResponse.json(fullSurvey, { status: 201 });
  } catch (error) {
    console.error('[SURVEYS] Duplicate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
