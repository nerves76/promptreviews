/**
 * Public Survey Submit API
 *
 * No authentication required - uses service role client.
 * Derives account_id from survey_id (never trust client).
 * Atomic response counting to prevent race conditions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { sendNotificationToAccount } from '@/utils/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { survey_id, answers, respondent_name, respondent_email, respondent_phone, respondent_business_name, source_channel, utm_params } = body;

    if (!survey_id) {
      return NextResponse.json({ error: 'survey_id is required' }, { status: 400 });
    }

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: 'answers are required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Fetch survey to get account_id and validate
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('id, account_id, status, title, free_responses_remaining, collect_respondent_info, require_respondent_email, one_response_per_email, require_name, require_email, require_phone, require_business_name')
      .eq('id', survey_id)
      .single();

    if (surveyError || !survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    if (survey.status !== 'active') {
      return NextResponse.json({ error: 'This survey is not currently accepting responses' }, { status: 403 });
    }

    // Check one_response_per_email constraint
    if (survey.one_response_per_email && respondent_email) {
      const { data: existingResponse } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('survey_id', survey_id)
        .eq('respondent_email', respondent_email)
        .maybeSingle();

      if (existingResponse) {
        return NextResponse.json({ error: 'You have already submitted a response to this survey' }, { status: 409 });
      }
    }

    // Validate required respondent fields (granular)
    if (survey.require_name && !respondent_name?.trim()) {
      return NextResponse.json({ error: 'Name is required for this survey' }, { status: 400 });
    }
    if ((survey.require_email || survey.require_respondent_email) && !respondent_email?.trim()) {
      return NextResponse.json({ error: 'Email is required for this survey' }, { status: 400 });
    }
    if (survey.require_phone && !respondent_phone?.trim()) {
      return NextResponse.json({ error: 'Phone number is required for this survey' }, { status: 400 });
    }
    if (survey.require_business_name && !respondent_business_name?.trim()) {
      return NextResponse.json({ error: 'Business name is required for this survey' }, { status: 400 });
    }

    // Determine response source: account pool → per-survey purchases → 402
    let isAccountPoolResponse = false;

    // 1. Try account-level pool first (atomic decrement)
    const { data: decrementResult } = await supabase
      .rpc('decrement_account_survey_responses', { account_uuid: survey.account_id });

    if (decrementResult !== null && decrementResult >= 0) {
      isAccountPoolResponse = true;
    }

    // 2. Fallback: check per-survey purchased packs
    if (!isAccountPoolResponse) {
      const { data: purchases } = await supabase
        .from('survey_response_purchases')
        .select('id, responses_purchased, responses_used')
        .eq('survey_id', survey_id)
        .order('created_at', { ascending: true });

      let foundCapacity = false;
      if (purchases) {
        for (const purchase of purchases) {
          if (purchase.responses_used < purchase.responses_purchased) {
            const { error: usageError } = await supabase
              .from('survey_response_purchases')
              .update({ responses_used: purchase.responses_used + 1 })
              .eq('id', purchase.id)
              .lt('responses_used', purchase.responses_purchased);

            if (!usageError) {
              foundCapacity = true;
              break;
            }
          }
        }
      }

      if (!foundCapacity) {
        return NextResponse.json(
          { error: 'This survey has reached its response limit. The survey owner needs to purchase more responses.' },
          { status: 402 }
        );
      }
    }

    // Sanitize answers
    const sanitizedAnswers = answers.map((a: any) => ({
      question_id: a.question_id,
      question_type: a.question_type,
      answer: a.answer,
    }));

    // Insert response
    const { data: response, error: insertError } = await supabase
      .from('survey_responses')
      .insert({
        survey_id,
        account_id: survey.account_id,
        respondent_name: respondent_name || null,
        respondent_email: respondent_email || null,
        respondent_phone: respondent_phone || null,
        respondent_business_name: respondent_business_name || null,
        answers: sanitizedAnswers,
        source_channel: ['direct', 'qr', 'email', 'sms'].includes(source_channel) ? source_channel : 'direct',
        utm_params: typeof utm_params === 'object' ? utm_params : {},
        user_agent: request.headers.get('user-agent') || null,
        is_free_response: isAccountPoolResponse,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[SURVEY-SUBMIT] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to submit response' }, { status: 500 });
    }

    // Fire-and-forget notification to account owners
    const { count: responseCount } = await supabase
      .from('survey_responses')
      .select('id', { count: 'exact', head: true })
      .eq('survey_id', survey_id);

    sendNotificationToAccount(survey.account_id, 'survey_response_submitted', {
      surveyTitle: survey.title || 'Untitled survey',
      surveyId: survey_id,
      respondentName: respondent_name || null,
      respondentEmail: respondent_email || null,
      responseCount: responseCount ?? 1,
    }).catch((err) => console.error('[SURVEY-SUBMIT] Notification error:', err));

    return NextResponse.json({ success: true, id: response.id });
  } catch (error) {
    console.error('[SURVEY-SUBMIT] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
