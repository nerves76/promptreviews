import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/keywords/export
 *
 * Exports all keyword concepts for the current account as a CSV file.
 * The CSV format is compatible with the keyword upload template.
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
      return NextResponse.json({ error: 'No valid account found or access denied' }, { status: 403 });
    }

    // Fetch all keywords for this account with group names
    const { data: keywords, error: fetchError } = await serviceSupabase
      .from('keywords')
      .select(`
        phrase,
        review_phrase,
        search_query,
        aliases,
        location_scope,
        related_questions,
        status,
        review_usage_count,
        created_at,
        keyword_groups (
          name
        )
      `)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching keywords for export:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch keywords' }, { status: 500 });
    }

    // Get rank tracking group associations
    const { data: rankAssociations } = await serviceSupabase
      .from('rank_group_keywords')
      .select(`
        keyword_id,
        rank_keyword_groups (
          name
        )
      `)
      .eq('account_id', accountId);

    // Build a map of keyword_id -> rank group name
    const rankGroupMap = new Map<string, string>();
    rankAssociations?.forEach((assoc: any) => {
      if (assoc.rank_keyword_groups?.name) {
        // Note: a keyword could be in multiple rank groups, we just take the first
        if (!rankGroupMap.has(assoc.keyword_id)) {
          rankGroupMap.set(assoc.keyword_id, assoc.rank_keyword_groups.name);
        }
      }
    });

    // Also need keyword IDs for the rank group lookup
    const { data: keywordsWithIds } = await serviceSupabase
      .from('keywords')
      .select('id, phrase')
      .eq('account_id', accountId);

    const phraseToIdMap = new Map<string, string>();
    keywordsWithIds?.forEach((k: any) => {
      phraseToIdMap.set(k.phrase, k.id);
    });

    // CSV headers - match the upload template format
    const headers = [
      'phrase',
      'review_phrase',
      'search_query',
      'aliases',
      'location_scope',
      'related_questions',
      'keyword_group',
      'rank_tracking_group',
      'status',
      'review_usage_count',
      'created_at',
    ];

    // Escape CSV field - handle quotes and commas
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) {
        return '';
      }
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r') || str.includes('|')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Build CSV rows
    const rows = keywords?.map((keyword: any) => {
      const keywordId = phraseToIdMap.get(keyword.phrase);
      const rankGroupName = keywordId ? rankGroupMap.get(keywordId) : '';

      return [
        escapeCSV(keyword.phrase),
        escapeCSV(keyword.review_phrase),
        escapeCSV(keyword.search_query),
        escapeCSV(keyword.aliases?.join(', ') || ''),
        escapeCSV(keyword.location_scope),
        escapeCSV(keyword.related_questions?.join(' | ') || ''),
        escapeCSV(keyword.keyword_groups?.name || ''),
        escapeCSV(rankGroupName || ''),
        escapeCSV(keyword.status),
        escapeCSV(keyword.review_usage_count),
        escapeCSV(keyword.created_at ? new Date(keyword.created_at).toISOString().split('T')[0] : ''),
      ].join(',');
    }) || [];

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');

    // Return as CSV file download
    const filename = `keyword-concepts-export-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error in keywords export:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
