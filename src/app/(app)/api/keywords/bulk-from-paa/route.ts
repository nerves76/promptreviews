import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import {
  normalizePhrase,
  calculateWordCount,
  transformKeywordToResponse,
  prepareQuestionForInsert,
  DEFAULT_GROUP_NAME,
  type RelatedQuestion,
} from '@/features/keywords/keywordUtils';
import { DEFAULT_AI_SEARCH_GROUP_NAME } from '@/lib/groupConstants';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface BulkFromPAARequest {
  questions: string[];
  funnelStage: 'top' | 'middle' | 'bottom';
  groupId?: string;
}

/**
 * POST /api/keywords/bulk-from-paa
 * Create keyword concepts from PAA questions for LLM tracking.
 * Each question becomes a new keyword concept with the question as a related question.
 *
 * Body:
 * - questions: string[] (required) - The PAA questions to create concepts from
 * - funnelStage: 'top' | 'middle' | 'bottom' (required) - Funnel stage for all questions
 * - groupId?: string (optional) - Target group, defaults to "General"
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

    const body: BulkFromPAARequest = await request.json();
    const { questions, funnelStage, groupId } = body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'At least one question is required' },
        { status: 400 }
      );
    }

    if (!funnelStage || !['top', 'middle', 'bottom'].includes(funnelStage)) {
      return NextResponse.json(
        { error: 'Valid funnelStage is required (top, middle, or bottom)' },
        { status: 400 }
      );
    }

    // Get or create the target group
    let targetGroupId = groupId;
    if (!targetGroupId) {
      const { data: existingGroup } = await serviceSupabase
        .from('keyword_groups')
        .select('id')
        .eq('account_id', accountId)
        .eq('name', DEFAULT_GROUP_NAME)
        .maybeSingle();

      if (existingGroup) {
        targetGroupId = existingGroup.id;
      } else {
        const { data: newGroup, error: groupError } = await serviceSupabase
          .from('keyword_groups')
          .insert({
            account_id: accountId,
            name: DEFAULT_GROUP_NAME,
            display_order: 0,
          })
          .select('id')
          .single();

        if (groupError) {
          console.error('❌ Failed to create General group:', groupError);
          return NextResponse.json(
            { error: 'Failed to create keyword group' },
            { status: 500 }
          );
        }
        targetGroupId = newGroup.id;
      }
    }

    // Get existing keywords to check for duplicates
    const normalizedQuestions = questions.map(q => normalizePhrase(q));
    const { data: existingKeywords } = await serviceSupabase
      .from('keywords')
      .select('id, normalized_phrase')
      .eq('account_id', accountId)
      .in('normalized_phrase', normalizedQuestions);

    const existingNormalized = new Set(existingKeywords?.map(k => k.normalized_phrase) || []);

    // Filter out duplicates
    const questionsToCreate = questions.filter(
      q => !existingNormalized.has(normalizePhrase(q))
    );

    const skippedCount = questions.length - questionsToCreate.length;
    const createdConcepts: any[] = [];

    // Resolve the General AI search query group for question assignment
    const aiSearchGeneralGroupId = await ensureAISearchGeneralGroup(accountId);

    // Create each concept
    for (const question of questionsToCreate) {
      const normalizedQuestion = normalizePhrase(question);
      const wordCount = calculateWordCount(question);
      const now = new Date().toISOString();

      // Build the related question for this concept
      const relatedQuestion: RelatedQuestion = {
        question: question,
        funnelStage: funnelStage,
        addedAt: now,
      };

      // Create the keyword/concept
      const { data: newKeyword, error: insertError } = await serviceSupabase
        .from('keywords')
        .insert({
          account_id: accountId,
          group_id: targetGroupId,
          name: question.trim().slice(0, 50), // Truncate for name field
          phrase: question.trim(),
          normalized_phrase: normalizedQuestion,
          word_count: wordCount,
          status: 'active',
          review_usage_count: 0,
          ai_generated: false,
          related_questions: [{
            question: question,
            funnel_stage: funnelStage,
            added_at: now,
          }],
        })
        .select(`
          id,
          name,
          phrase,
          normalized_phrase,
          word_count,
          status,
          review_usage_count,
          alias_match_count,
          group_id,
          created_at,
          updated_at,
          related_questions,
          keyword_groups (
            id,
            name
          )
        `)
        .single();

      if (insertError) {
        console.error('❌ Failed to create keyword from PAA:', insertError);
        continue; // Skip this one, try the rest
      }

      // Also insert into the normalized keyword_questions table
      const questionToInsert = prepareQuestionForInsert(newKeyword.id, relatedQuestion, aiSearchGeneralGroupId);
      const { error: questionsError } = await serviceSupabase
        .from('keyword_questions')
        .insert(questionToInsert);

      if (questionsError) {
        console.error('⚠️ Failed to insert question to normalized table:', questionsError);
        // Don't fail - JSONB fallback is still available
      }

      // keyword_groups is an object (not array) due to inner join on single row
      const groupName = (newKeyword as any).keyword_groups?.name || null;
      const transformedKeyword = transformKeywordToResponse(newKeyword as any, groupName);
      transformedKeyword.relatedQuestions = [relatedQuestion];
      createdConcepts.push(transformedKeyword);
    }

    return NextResponse.json({
      created: createdConcepts.length,
      skipped: skippedCount,
      concepts: createdConcepts,
    });
  } catch (error: any) {
    console.error('❌ bulk-from-paa error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Ensure the "General" AI search query group exists for the given account.
 */
async function ensureAISearchGeneralGroup(accountId: string): Promise<string | null> {
  const { data: existingGroup } = await serviceSupabase
    .from('ai_search_query_groups')
    .select('id')
    .eq('account_id', accountId)
    .eq('name', DEFAULT_AI_SEARCH_GROUP_NAME)
    .maybeSingle();

  if (existingGroup) {
    return existingGroup.id;
  }

  const { data: newGroup, error } = await serviceSupabase
    .from('ai_search_query_groups')
    .insert({
      account_id: accountId,
      name: DEFAULT_AI_SEARCH_GROUP_NAME,
      display_order: 0,
    })
    .select('id')
    .single();

  if (newGroup) return newGroup.id;

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
