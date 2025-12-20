import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import {
  normalizePhrase,
  calculateWordCount,
  DEFAULT_GROUP_NAME,
} from '@/features/keywords/keywordUtils';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/keywords/sync-prompt-page
 * Sync keywords array from a prompt page to the keyword library.
 * Creates keywords if they don't exist, creates junction records, and removes stale records.
 *
 * Body:
 * - promptPageId: string (required)
 * - keywords: string[] (required)
 *
 * Returns:
 * - { success: true, created: number, linked: number, unlinked: number }
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
    const { promptPageId, keywords } = body;

    if (!promptPageId) {
      return NextResponse.json({ error: 'promptPageId is required' }, { status: 400 });
    }

    if (!Array.isArray(keywords)) {
      return NextResponse.json({ error: 'keywords must be an array' }, { status: 400 });
    }

    // Verify prompt page belongs to this account
    const { data: promptPage, error: pageError } = await serviceSupabase
      .from('prompt_pages')
      .select('id')
      .eq('id', promptPageId)
      .eq('account_id', accountId)
      .single();

    if (pageError || !promptPage) {
      return NextResponse.json({ error: 'Prompt page not found' }, { status: 404 });
    }

    // Get or create "General" group for this account
    let { data: generalGroup } = await serviceSupabase
      .from('keyword_groups')
      .select('id')
      .eq('account_id', accountId)
      .eq('name', DEFAULT_GROUP_NAME)
      .single();

    if (!generalGroup) {
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
        console.error('[API] Error creating General group:', groupError);
        return NextResponse.json({ error: 'Failed to create keyword group' }, { status: 500 });
      }
      generalGroup = newGroup;
    }

    const stats = {
      created: 0,
      linked: 0,
      unlinked: 0,
    };

    // Normalize all keywords
    const normalizedKeywords = keywords
      .filter((k: string) => k && k.trim())
      .map((k: string) => ({
        phrase: k.trim(),
        normalized: normalizePhrase(k.trim()),
      }));

    // Get existing keywords for this account
    const { data: existingKeywords } = await serviceSupabase
      .from('keywords')
      .select('id, normalized_phrase')
      .eq('account_id', accountId)
      .in('normalized_phrase', normalizedKeywords.map(k => k.normalized));

    const existingKeywordMap = new Map(
      (existingKeywords || []).map(k => [k.normalized_phrase, k.id])
    );

    // Create keywords that don't exist
    const keywordsToCreate = normalizedKeywords.filter(
      k => !existingKeywordMap.has(k.normalized)
    );

    if (keywordsToCreate.length > 0) {
      const { data: createdKeywords, error: createError } = await serviceSupabase
        .from('keywords')
        .insert(
          keywordsToCreate.map(k => ({
            account_id: accountId,
            group_id: generalGroup.id,
            phrase: k.phrase,
            normalized_phrase: k.normalized,
            word_count: calculateWordCount(k.phrase),
            status: 'active',
            ai_generated: false,
          }))
        )
        .select('id, normalized_phrase');

      if (createError) {
        console.error('[API] Error creating keywords:', createError);
        return NextResponse.json({ error: 'Failed to create keywords' }, { status: 500 });
      }

      // Add to map
      (createdKeywords || []).forEach(k => {
        existingKeywordMap.set(k.normalized_phrase, k.id);
      });

      stats.created = keywordsToCreate.length;
    }

    // Get all keyword IDs for the current keywords array
    const currentKeywordIds = normalizedKeywords
      .map(k => existingKeywordMap.get(k.normalized))
      .filter((id): id is string => id !== undefined);

    // Get existing junction records for this prompt page
    const { data: existingJunctions } = await serviceSupabase
      .from('keyword_prompt_page_usage')
      .select('id, keyword_id')
      .eq('prompt_page_id', promptPageId)
      .eq('account_id', accountId);

    const existingJunctionKeywordIds = new Set(
      (existingJunctions || []).map(j => j.keyword_id)
    );

    // Create junction records for keywords not yet linked
    const keywordsToLink = currentKeywordIds.filter(
      id => !existingJunctionKeywordIds.has(id)
    );

    if (keywordsToLink.length > 0) {
      const { error: linkError } = await serviceSupabase
        .from('keyword_prompt_page_usage')
        .insert(
          keywordsToLink.map((keywordId, index) => ({
            account_id: accountId,
            keyword_id: keywordId,
            prompt_page_id: promptPageId,
            is_in_active_pool: true,
            display_order: index,
          }))
        );

      if (linkError) {
        console.error('[API] Error linking keywords:', linkError);
        // Don't fail the whole operation, just log
      } else {
        stats.linked = keywordsToLink.length;
      }
    }

    // Remove junction records for keywords no longer in the array
    const keywordsToUnlink = (existingJunctions || []).filter(
      j => !currentKeywordIds.includes(j.keyword_id)
    );

    if (keywordsToUnlink.length > 0) {
      const { error: unlinkError } = await serviceSupabase
        .from('keyword_prompt_page_usage')
        .delete()
        .in('id', keywordsToUnlink.map(j => j.id));

      if (unlinkError) {
        console.error('[API] Error unlinking keywords:', unlinkError);
        // Don't fail the whole operation, just log
      } else {
        stats.unlinked = keywordsToUnlink.length;
      }
    }

    console.log(
      `[API] Synced keywords for prompt page ${promptPageId}: ` +
      `${stats.created} created, ${stats.linked} linked, ${stats.unlinked} unlinked`
    );

    return NextResponse.json({
      success: true,
      ...stats,
    });
  } catch (error) {
    console.error('[API] Error in keywords/sync-prompt-page:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
