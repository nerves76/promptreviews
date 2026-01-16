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
 * GET /api/llm-visibility/export
 *
 * Exports all LLM visibility check results for the current account as a CSV file.
 * Includes full responses for detailed analysis.
 *
 * Query params:
 * - keywordId: Optional - filter to a specific keyword
 * - provider: Optional - filter to a specific provider (chatgpt, claude, gemini, perplexity)
 * - startDate: Optional - filter checks from this date (ISO format)
 * - endDate: Optional - filter checks until this date (ISO format)
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const keywordId = searchParams.get('keywordId');
    const provider = searchParams.get('provider');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query for LLM visibility checks
    let query = serviceSupabase
      .from('llm_visibility_checks')
      .select(`
        id,
        keyword_id,
        question,
        llm_provider,
        domain_cited,
        brand_mentioned,
        citation_position,
        citation_url,
        total_citations,
        response_snippet,
        full_response,
        citations,
        api_cost_usd,
        checked_at
      `)
      .eq('account_id', accountId)
      .order('checked_at', { ascending: false });

    // Apply filters
    if (keywordId) {
      query = query.eq('keyword_id', keywordId);
    }
    if (provider) {
      query = query.eq('llm_provider', provider);
    }
    if (startDate) {
      query = query.gte('checked_at', startDate);
    }
    if (endDate) {
      query = query.lte('checked_at', endDate);
    }

    const { data: checks, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching LLM visibility checks for export:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch LLM visibility data' }, { status: 500 });
    }

    // Fetch keyword phrases for the keyword_ids in the results
    const keywordIds = [...new Set(checks?.map((c: any) => c.keyword_id) || [])];
    const { data: keywords } = await serviceSupabase
      .from('keywords')
      .select('id, phrase')
      .in('id', keywordIds);

    // Build keyword phrase map
    const keywordPhraseMap = new Map<string, string>();
    keywords?.forEach((k: any) => {
      keywordPhraseMap.set(k.id, k.phrase);
    });

    // CSV headers
    const headers = [
      'concept_name',
      'question',
      'llm_provider',
      'domain_cited',
      'brand_mentioned',
      'citation_position',
      'citation_url',
      'total_citations',
      'citations_summary',
      'response_snippet',
      'full_response',
      'api_cost_usd',
      'checked_at',
    ];

    // Escape CSV field - handle quotes, commas, and newlines
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) {
        return '';
      }
      const str = String(value);
      // Always quote fields that could contain special characters
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Build CSV rows
    const rows = checks?.map((check: any) => {
      const keywordPhrase = keywordPhraseMap.get(check.keyword_id) || '';

      // Format citations as a summary string: domain1 (pos 1), domain2 (pos 2)
      let citationsSummary = '';
      if (check.citations && Array.isArray(check.citations)) {
        citationsSummary = check.citations
          .map((c: any) => `${c.domain}${c.isOurs ? ' [OURS]' : ''} (pos ${c.position})`)
          .join('; ');
      }

      return [
        escapeCSV(keywordPhrase),
        escapeCSV(check.question),
        escapeCSV(check.llm_provider),
        escapeCSV(check.domain_cited ? 'Yes' : 'No'),
        escapeCSV(check.brand_mentioned ? 'Yes' : 'No'),
        escapeCSV(check.citation_position),
        escapeCSV(check.citation_url),
        escapeCSV(check.total_citations),
        escapeCSV(citationsSummary),
        escapeCSV(check.response_snippet),
        escapeCSV(check.full_response),
        escapeCSV(check.api_cost_usd),
        escapeCSV(check.checked_at ? new Date(check.checked_at).toISOString() : ''),
      ].join(',');
    }) || [];

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');

    // Generate filename with optional filters
    let filename = 'llm-visibility-export';
    if (keywordId) {
      const phrase = keywordPhraseMap.get(keywordId);
      if (phrase) {
        filename += `-${phrase.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30)}`;
      }
    }
    if (provider) {
      filename += `-${provider}`;
    }
    filename += `-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error in LLM visibility export:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
