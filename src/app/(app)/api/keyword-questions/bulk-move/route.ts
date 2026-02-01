import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { DEFAULT_AI_SEARCH_GROUP_NAME } from '@/lib/groupConstants';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// UUID v4 regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/keyword-questions/bulk-move
 * Move multiple keyword questions to a different group.
 *
 * Body:
 * - questionIds: string[] (required) - Array of keyword_question IDs or composite IDs
 * - groupId: string | null (required) - Target group ID, or null to move to General
 *
 * Composite IDs (format: {keyword_id}-{question_text}) are automatically converted
 * to real keyword_questions entries if they don't exist yet.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const body = await request.json();
    const { questionIds, groupId: rawGroupId } = body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json(
        { error: 'questionIds array is required' },
        { status: 400 }
      );
    }

    // Resolve target group: if null, default to General
    let groupId = rawGroupId;
    if (!groupId) {
      groupId = await ensureGeneralGroupExists(accountId);
      if (!groupId) {
        return NextResponse.json(
          { error: 'Failed to resolve General group' },
          { status: 500 }
        );
      }
    } else {
      // Verify the provided groupId belongs to this account
      const { data: group, error: groupError } = await serviceSupabase
        .from('ai_search_query_groups')
        .select('id')
        .eq('id', groupId)
        .eq('account_id', accountId)
        .maybeSingle();

      if (groupError || !group) {
        return NextResponse.json(
          { error: 'Target group not found' },
          { status: 404 }
        );
      }
    }

    // Separate real UUIDs from composite IDs
    const realUuids: string[] = [];
    const compositeIds: string[] = [];

    for (const id of questionIds) {
      if (UUID_REGEX.test(id)) {
        realUuids.push(id);
      } else {
        compositeIds.push(id);
      }
    }

    // Process composite IDs - these are questions in JSONB but not in keyword_questions table
    // Format: {keyword_id}-{question_text} (keyword_id is first 36 chars if valid UUID)
    const createdQuestionIds: string[] = [];

    if (compositeIds.length > 0) {
      for (const compositeId of compositeIds) {
        // Try to extract keyword ID (first 36 characters should be a UUID)
        const potentialKeywordId = compositeId.substring(0, 36);
        const questionText = compositeId.substring(37); // Skip the hyphen

        if (!UUID_REGEX.test(potentialKeywordId) || !questionText) {
          console.warn(`⚠️ Invalid composite ID format: ${compositeId}`);
          continue;
        }

        // Verify keyword belongs to this account
        const { data: keyword } = await serviceSupabase
          .from('keywords')
          .select('id, related_questions')
          .eq('id', potentialKeywordId)
          .eq('account_id', accountId)
          .maybeSingle();

        if (!keyword) {
          console.warn(`⚠️ Keyword not found or access denied: ${potentialKeywordId}`);
          continue;
        }

        // Check if question already exists in keyword_questions
        const { data: existingQuestion } = await serviceSupabase
          .from('keyword_questions')
          .select('id')
          .eq('keyword_id', potentialKeywordId)
          .eq('question', questionText)
          .maybeSingle();

        if (existingQuestion) {
          // Question already exists, use its ID
          createdQuestionIds.push(existingQuestion.id);
        } else {
          // Find funnel stage from JSONB if available
          let funnelStage = 'middle';
          if (keyword.related_questions && Array.isArray(keyword.related_questions)) {
            const jsonQuestion = keyword.related_questions.find((q: any) =>
              (typeof q === 'string' ? q : q.question) === questionText
            );
            if (jsonQuestion && typeof jsonQuestion === 'object' && jsonQuestion.funnelStage) {
              funnelStage = jsonQuestion.funnelStage;
            }
          }

          // Create new keyword_questions entry
          const { data: newQuestion, error: insertError } = await serviceSupabase
            .from('keyword_questions')
            .insert({
              keyword_id: potentialKeywordId,
              question: questionText,
              funnel_stage: funnelStage,
            })
            .select('id')
            .single();

          if (insertError) {
            console.error(`❌ Failed to create keyword_question for ${compositeId}:`, insertError);
          } else if (newQuestion) {
            createdQuestionIds.push(newQuestion.id);
          }
        }
      }
    }

    // Combine all question IDs
    const allQuestionIds = [...realUuids, ...createdQuestionIds];

    if (allQuestionIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid questions to move' },
        { status: 400 }
      );
    }

    // Verify all real UUID questions belong to keywords owned by this account
    if (realUuids.length > 0) {
      const { data: questions, error: questionsError } = await serviceSupabase
        .from('keyword_questions')
        .select('id, keyword_id, keywords!inner(account_id)')
        .in('id', realUuids)
        .eq('keywords.account_id', accountId);

      if (questionsError) {
        console.error('❌ Failed to verify question ownership:', questionsError);
        return NextResponse.json(
          { error: 'Failed to verify question ownership' },
          { status: 500 }
        );
      }

      if (!questions || questions.length !== realUuids.length) {
        return NextResponse.json(
          { error: 'One or more questions not found or access denied' },
          { status: 404 }
        );
      }
    }

    // Move all questions to the target group
    const { error: updateError } = await serviceSupabase
      .from('keyword_questions')
      .update({ group_id: groupId })
      .in('id', allQuestionIds);

    if (updateError) {
      console.error('❌ Failed to move questions:', updateError);
      return NextResponse.json(
        { error: 'Failed to move questions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      movedCount: allQuestionIds.length,
      createdCount: createdQuestionIds.length,
      targetGroupId: groupId,
    });
  } catch (error: any) {
    console.error('❌ Keyword questions bulk move error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to ensure the General group exists for an account
 */
async function ensureGeneralGroupExists(accountId: string): Promise<string | null> {
  const { data: generalGroup } = await serviceSupabase
    .from('ai_search_query_groups')
    .select('id')
    .eq('account_id', accountId)
    .eq('name', DEFAULT_AI_SEARCH_GROUP_NAME)
    .maybeSingle();

  if (generalGroup) {
    return generalGroup.id;
  }

  // Create General group
  const { data: newGeneral, error } = await serviceSupabase
    .from('ai_search_query_groups')
    .insert({
      account_id: accountId,
      name: DEFAULT_AI_SEARCH_GROUP_NAME,
      display_order: 0,
    })
    .select('id')
    .single();

  if (newGeneral) return newGeneral.id;

  // Handle race condition: another request may have created it concurrently
  if (error) {
    const { data: retryGroup } = await serviceSupabase
      .from('ai_search_query_groups')
      .select('id')
      .eq('account_id', accountId)
      .eq('name', DEFAULT_AI_SEARCH_GROUP_NAME)
      .maybeSingle();
    return retryGroup?.id || null;
  }

  return null;
}
