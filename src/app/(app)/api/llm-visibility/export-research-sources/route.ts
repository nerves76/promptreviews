import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

/**
 * GET /api/llm-visibility/export-research-sources
 * Export research sources data as CSV including domain analysis
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Fetch all checks with search_results
    const { data: checks, error: checksError } = await supabase
      .from('llm_visibility_checks')
      .select(`
        search_results,
        checked_at,
        keywords!inner(phrase)
      `)
      .eq('account_id', accountId)
      .not('search_results', 'is', null);

    if (checksError) {
      console.error('[export-research-sources] Error fetching checks:', checksError);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    // Aggregate domains
    const domainMap = new Map<string, {
      domain: string;
      frequency: number;
      lastSeen: string;
      concepts: Set<string>;
      sampleUrls: string[];
      isOurs: boolean;
    }>();

    for (const check of checks || []) {
      const searchResults = check.search_results as Array<{
        url: string;
        domain: string;
        title: string;
        isOurs?: boolean;
      }> | null;

      if (!searchResults || !Array.isArray(searchResults)) continue;

      const concept = (check.keywords as any)?.phrase || '';

      for (const result of searchResults) {
        if (!result.domain) continue;

        const domain = result.domain.toLowerCase();
        const existing = domainMap.get(domain);

        if (existing) {
          existing.frequency++;
          if (new Date(check.checked_at) > new Date(existing.lastSeen)) {
            existing.lastSeen = check.checked_at;
          }
          if (concept) existing.concepts.add(concept);
          if (result.url && existing.sampleUrls.length < 3 && !existing.sampleUrls.includes(result.url)) {
            existing.sampleUrls.push(result.url);
          }
          if (result.isOurs) existing.isOurs = true;
        } else {
          domainMap.set(domain, {
            domain,
            frequency: 1,
            lastSeen: check.checked_at,
            concepts: new Set(concept ? [concept] : []),
            sampleUrls: result.url ? [result.url] : [],
            isOurs: result.isOurs || false,
          });
        }
      }
    }

    // Fetch all domain analyses
    const { data: analyses } = await supabase
      .from('domain_analysis_cache')
      .select('domain, difficulty, site_type, strategy');

    const analysisMap = new Map<string, {
      difficulty: string;
      siteType: string;
      strategy: string;
    }>();

    for (const analysis of analyses || []) {
      analysisMap.set(analysis.domain.toLowerCase(), {
        difficulty: analysis.difficulty || '',
        siteType: analysis.site_type || '',
        strategy: analysis.strategy || '',
      });
    }

    // Build CSV
    const headers = [
      'Domain',
      'Frequency',
      'Last Seen',
      'Is Your Domain',
      'Concepts',
      'Sample URLs',
      'Site Type',
      'Difficulty',
      'Strategy',
    ];

    const rows = Array.from(domainMap.values())
      .sort((a, b) => b.frequency - a.frequency)
      .map(source => {
        const analysis = analysisMap.get(source.domain);
        return [
          source.domain,
          source.frequency.toString(),
          new Date(source.lastSeen).toISOString().split('T')[0],
          source.isOurs ? 'Yes' : 'No',
          Array.from(source.concepts).join('; '),
          source.sampleUrls.join('; '),
          analysis?.siteType || '',
          analysis?.difficulty || '',
          analysis?.strategy || '',
        ];
      });

    // Generate CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    // Return as CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="visibility-opportunities-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('[export-research-sources] Error:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
