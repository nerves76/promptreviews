import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { DEFAULT_AI_SEARCH_GROUP_NAME } from '@/app/(app)/api/ai-search-query-groups/route';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/keyword-questions/bulk-move
 * Move multiple keyword questions to a different group.
 *
 * Body:
 * - questionIds: string[] (required) - Array of keyword_question IDs to move
 * - groupId: string | null (required) - Target group ID, or null to move to ungrouped
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
    const { questionIds, groupId } = body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json(
        { error: 'questionIds array is required' },
        { status: 400 }
      );
    }

    // If groupId is provided and not null, verify it belongs to this account
    if (groupId) {
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

    // Verify all questions belong to keywords owned by this account
    const { data: questions, error: questionsError } = await serviceSupabase
      .from('keyword_questions')
      .select('id, keyword_id, keywords!inner(account_id)')
      .in('id', questionIds)
      .eq('keywords.account_id', accountId);

    if (questionsError) {
      console.error('❌ Failed to verify question ownership:', questionsError);
      return NextResponse.json(
        { error: 'Failed to verify question ownership' },
        { status: 500 }
      );
    }

    if (!questions || questions.length !== questionIds.length) {
      return NextResponse.json(
        { error: 'One or more questions not found or access denied' },
        { status: 404 }
      );
    }

    // Move all questions to the target group
    const { error: updateError, count } = await serviceSupabase
      .from('keyword_questions')
      .update({ group_id: groupId })
      .in('id', questionIds);

    if (updateError) {
      console.error('❌ Failed to move questions:', updateError);
      return NextResponse.json(
        { error: 'Failed to move questions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      movedCount: questionIds.length,
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
export async function ensureGeneralGroupExists(accountId: string): Promise<string | null> {
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
  const { data: newGeneral } = await serviceSupabase
    .from('ai_search_query_groups')
    .insert({
      account_id: accountId,
      name: DEFAULT_AI_SEARCH_GROUP_NAME,
      display_order: 0,
    })
    .select('id')
    .single();

  return newGeneral?.id || null;
}
