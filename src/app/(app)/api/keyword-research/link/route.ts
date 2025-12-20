import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface LinkRequest {
  /** Research result ID to link */
  resultId: string;
  /** Keyword concept ID to link to */
  keywordId: string;
  /** Whether to add the term to keyword's search_terms array */
  addToSearchTerms?: boolean;
}

/**
 * POST /api/keyword-research/link
 *
 * Links a saved research result to a keyword concept.
 * Optionally adds the term to the keyword's search_terms array.
 *
 * Body: LinkRequest
 *
 * Returns the updated result.
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

    const body: LinkRequest = await request.json();

    if (!body.resultId || !body.keywordId) {
      return NextResponse.json(
        { error: 'resultId and keywordId are required' },
        { status: 400 }
      );
    }

    // Verify result belongs to account
    const { data: result, error: resultError } = await serviceSupabase
      .from('keyword_research_results')
      .select('*')
      .eq('id', body.resultId)
      .eq('account_id', accountId)
      .single();

    if (resultError || !result) {
      return NextResponse.json(
        { error: 'Research result not found' },
        { status: 404 }
      );
    }

    // Verify keyword belongs to account
    const { data: keyword, error: keywordError } = await serviceSupabase
      .from('keywords')
      .select('id, search_terms')
      .eq('id', body.keywordId)
      .eq('account_id', accountId)
      .single();

    if (keywordError || !keyword) {
      return NextResponse.json(
        { error: 'Keyword not found' },
        { status: 404 }
      );
    }

    // Link the result to the keyword
    const { error: updateError } = await serviceSupabase
      .from('keyword_research_results')
      .update({
        keyword_id: body.keywordId,
        linked_at: new Date().toISOString(),
      })
      .eq('id', body.resultId);

    if (updateError) {
      console.error('❌ [KeywordResearch] Failed to link result:', updateError);
      return NextResponse.json(
        { error: 'Failed to link result' },
        { status: 500 }
      );
    }

    // Optionally add term to keyword's search_terms
    if (body.addToSearchTerms) {
      const existingTerms = (keyword.search_terms || []) as Array<{
        term: string;
        is_canonical: boolean;
        added_at: string;
      }>;

      // Check if term already exists
      const termExists = existingTerms.some(
        t => t.term.toLowerCase() === result.term.toLowerCase()
      );

      if (!termExists) {
        const newTerms = [
          ...existingTerms,
          {
            term: result.term,
            is_canonical: existingTerms.length === 0, // First term is canonical
            added_at: new Date().toISOString(),
          },
        ];

        const { error: keywordUpdateError } = await serviceSupabase
          .from('keywords')
          .update({ search_terms: newTerms })
          .eq('id', body.keywordId);

        if (keywordUpdateError) {
          console.warn('⚠️ [KeywordResearch] Failed to add term to keyword:', keywordUpdateError);
          // Don't fail the whole request, the link was still created
        }
      }
    }

    console.log(`✅ [KeywordResearch] Linked result "${result.term}" to keyword ${body.keywordId}`);

    return NextResponse.json({
      success: true,
      result: {
        id: result.id,
        term: result.term,
        keywordId: body.keywordId,
        linkedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('❌ [KeywordResearch] Link error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/keyword-research/link
 *
 * Unlinks a research result from a keyword concept.
 *
 * Query params:
 * - resultId: string - Research result ID to unlink
 *
 * Returns success status.
 */
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const resultId = searchParams.get('resultId');

    if (!resultId) {
      return NextResponse.json({ error: 'resultId is required' }, { status: 400 });
    }

    // Verify result belongs to account
    const { data: result, error: resultError } = await serviceSupabase
      .from('keyword_research_results')
      .select('id, account_id')
      .eq('id', resultId)
      .eq('account_id', accountId)
      .single();

    if (resultError || !result) {
      return NextResponse.json(
        { error: 'Research result not found' },
        { status: 404 }
      );
    }

    // Unlink the result
    const { error: updateError } = await serviceSupabase
      .from('keyword_research_results')
      .update({
        keyword_id: null,
        linked_at: null,
      })
      .eq('id', resultId);

    if (updateError) {
      console.error('❌ [KeywordResearch] Failed to unlink result:', updateError);
      return NextResponse.json(
        { error: 'Failed to unlink result' },
        { status: 500 }
      );
    }

    console.log(`✅ [KeywordResearch] Unlinked result ${resultId}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ [KeywordResearch] Unlink error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
