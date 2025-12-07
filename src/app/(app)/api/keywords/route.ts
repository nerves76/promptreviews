import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import {
  normalizePhrase,
  calculateWordCount,
  transformKeywordToResponse,
  DEFAULT_GROUP_NAME,
  type KeywordData,
} from '@/features/keywords/keywordUtils';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/keywords
 * List all keywords for the account, optionally filtered by group or prompt page.
 *
 * Query params:
 * - groupId: Filter by keyword group
 * - promptPageId: Filter by prompt page
 * - includeUsage: Include prompt page usage data (default: false)
 */
export async function GET(request: NextRequest) {
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
    const groupId = searchParams.get('groupId');
    const promptPageId = searchParams.get('promptPageId');
    const includeUsage = searchParams.get('includeUsage') === 'true';

    // Build query - include new concept fields
    let query = serviceSupabase
      .from('keywords')
      .select(`
        id,
        phrase,
        normalized_phrase,
        word_count,
        status,
        review_usage_count,
        last_used_in_review_at,
        group_id,
        created_at,
        updated_at,
        review_phrase,
        search_query,
        aliases,
        location_scope,
        ai_generated,
        ai_suggestions,
        keyword_groups (
          id,
          name
        )
      `)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (groupId) {
      query = query.eq('group_id', groupId);
    }

    const { data: keywords, error: keywordsError } = await query;

    if (keywordsError) {
      console.error('❌ Failed to fetch keywords:', keywordsError);
      return NextResponse.json(
        { error: 'Failed to fetch keywords' },
        { status: 500 }
      );
    }

    // If filtering by prompt page, get the junction records
    let promptPageKeywordIds: Set<string> | null = null;
    if (promptPageId) {
      const { data: usageData } = await serviceSupabase
        .from('keyword_prompt_page_usage')
        .select('keyword_id')
        .eq('prompt_page_id', promptPageId)
        .eq('account_id', accountId);

      promptPageKeywordIds = new Set(usageData?.map(u => u.keyword_id) || []);
    }

    // Transform and filter results
    let transformedKeywords: KeywordData[] = (keywords || []).map((kw: any) => {
      const groupName = kw.keyword_groups?.name || null;
      return transformKeywordToResponse(kw, groupName);
    });

    // Filter by prompt page if specified
    if (promptPageKeywordIds) {
      transformedKeywords = transformedKeywords.filter(kw =>
        promptPageKeywordIds!.has(kw.id)
      );
    }

    // Optionally include prompt page usage data
    let usage: Record<string, string[]> = {};
    if (includeUsage) {
      const { data: usageData } = await serviceSupabase
        .from('keyword_prompt_page_usage')
        .select(`
          keyword_id,
          prompt_page_id,
          prompt_pages (
            id,
            slug,
            name
          )
        `)
        .eq('account_id', accountId);

      // Group by keyword_id
      for (const record of usageData || []) {
        if (!usage[record.keyword_id]) {
          usage[record.keyword_id] = [];
        }
        const page = record.prompt_pages as any;
        if (page) {
          usage[record.keyword_id].push(page.name || page.slug || page.id);
        }
      }
    }

    return NextResponse.json({
      keywords: transformedKeywords,
      ...(includeUsage && { promptPageUsage: usage }),
    });
  } catch (error: any) {
    console.error('❌ Keywords GET error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/keywords
 * Create a new keyword.
 *
 * Body:
 * - phrase: string (required)
 * - groupId?: string (optional, defaults to "General" group)
 * - promptPageId?: string (optional, also assigns to this prompt page)
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
    const { phrase, groupId, promptPageId, review_phrase, search_query, aliases, location_scope, ai_generated } = body;

    if (!phrase || typeof phrase !== 'string' || phrase.trim().length === 0) {
      return NextResponse.json(
        { error: 'Keyword phrase is required' },
        { status: 400 }
      );
    }

    const normalizedPhrase = normalizePhrase(phrase);
    const wordCount = calculateWordCount(phrase);

    // Get or create the group
    let targetGroupId = groupId;
    if (!targetGroupId) {
      // Get or create "General" group
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

    // Check if keyword already exists for this account
    const { data: existingKeyword } = await serviceSupabase
      .from('keywords')
      .select('id')
      .eq('account_id', accountId)
      .eq('normalized_phrase', normalizedPhrase)
      .maybeSingle();

    if (existingKeyword) {
      // Keyword already exists - if promptPageId provided, just link it
      if (promptPageId) {
        await serviceSupabase
          .from('keyword_prompt_page_usage')
          .upsert({
            keyword_id: existingKeyword.id,
            prompt_page_id: promptPageId,
            account_id: accountId,
          }, { onConflict: 'keyword_id,prompt_page_id' });

        // Fetch and return the existing keyword
        const { data: keyword } = await serviceSupabase
          .from('keywords')
          .select(`
            id,
            phrase,
            normalized_phrase,
            word_count,
            status,
            review_usage_count,
            last_used_in_review_at,
            group_id,
            created_at,
            updated_at,
            keyword_groups (
              id,
              name
            )
          `)
          .eq('id', existingKeyword.id)
          .single();

        return NextResponse.json({
          keyword: transformKeywordToResponse(keyword!, (keyword as any).keyword_groups?.name),
          created: false,
          message: 'Keyword already exists, linked to prompt page',
        });
      }

      return NextResponse.json(
        { error: 'This keyword already exists', existingId: existingKeyword.id },
        { status: 409 }
      );
    }

    // Create the keyword with concept fields
    const { data: newKeyword, error: insertError } = await serviceSupabase
      .from('keywords')
      .insert({
        account_id: accountId,
        group_id: targetGroupId,
        phrase: phrase.trim(),
        normalized_phrase: normalizedPhrase,
        word_count: wordCount,
        status: 'active',
        review_usage_count: 0,
        // New concept fields
        review_phrase: review_phrase || null,
        search_query: search_query || null,
        aliases: aliases || [],
        location_scope: location_scope || null,
        ai_generated: ai_generated || false,
      })
      .select(`
        id,
        phrase,
        normalized_phrase,
        word_count,
        status,
        review_usage_count,
        last_used_in_review_at,
        group_id,
        created_at,
        updated_at,
        review_phrase,
        search_query,
        aliases,
        location_scope,
        ai_generated,
        ai_suggestions,
        keyword_groups (
          id,
          name
        )
      `)
      .single();

    if (insertError) {
      console.error('❌ Failed to create keyword:', insertError);
      return NextResponse.json(
        { error: 'Failed to create keyword' },
        { status: 500 }
      );
    }

    // If promptPageId provided, also create the junction record
    if (promptPageId) {
      await serviceSupabase
        .from('keyword_prompt_page_usage')
        .insert({
          keyword_id: newKeyword.id,
          prompt_page_id: promptPageId,
          account_id: accountId,
        });
    }

    return NextResponse.json(
      {
        keyword: transformKeywordToResponse(newKeyword, (newKeyword as any).keyword_groups?.name),
        created: true,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ Keywords POST error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
