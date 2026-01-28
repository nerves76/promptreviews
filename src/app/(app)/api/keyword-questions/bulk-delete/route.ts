import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/keyword-questions/bulk-delete
 *
 * Delete multiple keyword questions by their IDs.
 *
 * Body:
 * - questionIds: string[] - IDs of questions to delete (can be keyword_questions.id or composite "keywordId-question")
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
    const { questionIds } = body;

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json({ error: 'questionIds must be a non-empty array' }, { status: 400 });
    }

    // Separate real UUIDs from composite IDs (keywordId-question format)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const realUuids: string[] = [];
    const compositeIds: { keywordId: string; question: string }[] = [];

    for (const id of questionIds) {
      if (uuidRegex.test(id)) {
        realUuids.push(id);
      } else {
        // Composite ID format: "keywordId-question"
        // The keywordId is always a UUID, so split on the first occurrence after the UUID
        const uuidMatch = id.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-(.+)$/i);
        if (uuidMatch) {
          compositeIds.push({
            keywordId: uuidMatch[1],
            question: uuidMatch[2],
          });
        }
      }
    }

    let deletedCount = 0;

    // Delete by real UUID
    if (realUuids.length > 0) {
      // First verify these questions belong to keywords in this account
      const { data: validQuestions } = await serviceSupabase
        .from('keyword_questions')
        .select('id, keyword_id')
        .in('id', realUuids);

      if (validQuestions && validQuestions.length > 0) {
        // Verify the keywords belong to this account
        const keywordIds = [...new Set(validQuestions.map(q => q.keyword_id))];
        const { data: validKeywords } = await serviceSupabase
          .from('keywords')
          .select('id')
          .in('id', keywordIds)
          .eq('account_id', accountId);

        const validKeywordIds = new Set(validKeywords?.map(k => k.id) || []);
        const questionsToDelete = validQuestions
          .filter(q => validKeywordIds.has(q.keyword_id))
          .map(q => q.id);

        if (questionsToDelete.length > 0) {
          const { error: deleteError } = await serviceSupabase
            .from('keyword_questions')
            .delete()
            .in('id', questionsToDelete);

          if (!deleteError) {
            deletedCount += questionsToDelete.length;
          }
        }
      }
    }

    // Delete by composite ID (keywordId + question text)
    if (compositeIds.length > 0) {
      // Verify keywords belong to this account
      const keywordIds = [...new Set(compositeIds.map(c => c.keywordId))];
      const { data: validKeywords } = await serviceSupabase
        .from('keywords')
        .select('id')
        .in('id', keywordIds)
        .eq('account_id', accountId);

      const validKeywordIds = new Set(validKeywords?.map(k => k.id) || []);

      // Delete each composite by keyword_id + question match
      for (const composite of compositeIds) {
        if (validKeywordIds.has(composite.keywordId)) {
          const { error: deleteError, count } = await serviceSupabase
            .from('keyword_questions')
            .delete()
            .eq('keyword_id', composite.keywordId)
            .eq('question', composite.question)
            .select('id');

          if (!deleteError) {
            deletedCount += 1;
          }
        }
      }

      // Also update the JSONB related_questions on the keywords table for legacy support
      for (const composite of compositeIds) {
        if (validKeywordIds.has(composite.keywordId)) {
          // Fetch current related_questions
          const { data: keyword } = await serviceSupabase
            .from('keywords')
            .select('related_questions')
            .eq('id', composite.keywordId)
            .single();

          if (keyword?.related_questions && Array.isArray(keyword.related_questions)) {
            const updatedQuestions = keyword.related_questions.filter((q: any) => {
              const questionText = typeof q === 'string' ? q : q.question;
              return questionText !== composite.question;
            });

            await serviceSupabase
              .from('keywords')
              .update({ related_questions: updatedQuestions })
              .eq('id', composite.keywordId);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount,
    });
  } catch (error: any) {
    console.error('❌ Bulk delete questions error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
