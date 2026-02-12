/**
 * Create Survey from Template API
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

    const { template_id, title } = await request.json();

    if (!template_id) {
      return NextResponse.json({ error: 'template_id is required' }, { status: 400 });
    }

    // Fetch template
    const { data: template, error: templateError } = await supabase
      .from('survey_templates')
      .select('*')
      .eq('id', template_id)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const surveyTitle = title?.trim() || template.default_survey_title || 'Untitled survey';
    const surveyDescription = template.default_survey_description || null;
    const slug = generateSlug(surveyTitle);

    // Create survey
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .insert({
        account_id: accountId,
        slug,
        title: surveyTitle,
        description: surveyDescription,
        template_id: template.id,
      })
      .select()
      .single();

    if (surveyError || !survey) {
      console.error('[SURVEYS] Create from template error:', surveyError);
      return NextResponse.json({ error: 'Failed to create survey' }, { status: 500 });
    }

    // Create questions from template
    const templateQuestions = template.questions as any[];
    if (templateQuestions && templateQuestions.length > 0) {
      const questionRows = templateQuestions.map((q: any, index: number) => ({
        survey_id: survey.id,
        position: index,
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

      await supabase.from('survey_questions').insert(questionRows);
    }

    // Return full survey
    const { data: fullSurvey } = await supabase
      .from('surveys')
      .select('*, survey_questions(*)')
      .eq('id', survey.id)
      .single();

    return NextResponse.json(fullSurvey, { status: 201 });
  } catch (error) {
    console.error('[SURVEYS] From template error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
