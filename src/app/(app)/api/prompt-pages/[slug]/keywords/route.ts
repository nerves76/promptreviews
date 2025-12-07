import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service client for public access (no auth required for public prompt pages)
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/prompt-pages/[slug]/keywords
 *
 * Fetches keywords associated with a prompt page, returning the review_phrase
 * (customer-facing text) when available, falling back to the canonical phrase.
 *
 * This endpoint is designed for public access - it's used by the public
 * prompt page to display keyword suggestions to customers.
 *
 * The [slug] parameter can be either the prompt page ID (UUID) or slug.
 *
 * Query params:
 * - limit: Max keywords to return (default: 10)
 * - activeOnly: Only return keywords in the active pool (default: true)
 *
 * Returns:
 * - keywords: Array of { id, phrase, displayText } objects
 *   - displayText is review_phrase if set, otherwise phrase
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    // Try to find prompt page by ID first (UUID format), then by slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    let promptPage;
    if (isUUID) {
      const { data, error } = await serviceSupabase
        .from('prompt_pages')
        .select('id, account_id, keywords')
        .eq('id', slug)
        .single();

      if (!error) {
        promptPage = data;
      }
    }

    // Fall back to slug lookup if not found by ID
    if (!promptPage) {
      const { data, error } = await serviceSupabase
        .from('prompt_pages')
        .select('id, account_id, keywords')
        .eq('slug', slug)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: 'Prompt page not found' },
          { status: 404 }
        );
      }
      promptPage = data;
    }

    // Fetch keywords linked to this prompt page via junction table
    let query = serviceSupabase
      .from('keyword_prompt_page_usage')
      .select(`
        keyword_id,
        is_in_active_pool,
        keywords (
          id,
          phrase,
          review_phrase,
          status
        )
      `)
      .eq('prompt_page_id', promptPage.id)
      .eq('account_id', promptPage.account_id);

    // Filter to active pool if requested
    if (activeOnly) {
      query = query.eq('is_in_active_pool', true);
    }

    const { data: usageRecords, error: usageError } = await query.limit(limit);

    if (usageError) {
      console.error('❌ Failed to fetch keyword usage:', usageError);
      return NextResponse.json(
        { error: 'Failed to fetch keywords' },
        { status: 500 }
      );
    }

    // Transform to public-friendly format
    // Use review_phrase for customer display, fall back to phrase
    const keywords = (usageRecords || [])
      .filter((record: any) => record.keywords && record.keywords.status === 'active')
      .map((record: any) => ({
        id: record.keywords.id,
        phrase: record.keywords.phrase,
        displayText: record.keywords.review_phrase || record.keywords.phrase,
      }));

    // If no keywords from unified system, fall back to legacy keywords array
    if (keywords.length === 0 && Array.isArray(promptPage.keywords)) {
      const legacyKeywords = promptPage.keywords
        .slice(0, limit)
        .map((phrase: string, index: number) => ({
          id: `legacy-${index}`,
          phrase: phrase,
          displayText: phrase,
        }));

      return NextResponse.json({
        keywords: legacyKeywords,
        source: 'legacy',
      });
    }

    return NextResponse.json({
      keywords,
      source: 'unified',
    });
  } catch (error: any) {
    console.error('❌ Prompt page keywords GET error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
