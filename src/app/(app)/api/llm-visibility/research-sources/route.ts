/**
 * API endpoint to aggregate and rank websites that AI assistants use for research.
 *
 * This helps users identify high-value link building targets - if a website
 * frequently appears in AI research, getting a link from them could improve
 * AI visibility.
 *
 * GET /api/llm-visibility/research-sources
 * Query params:
 *   - conceptId (optional): Filter to a specific keyword/concept
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

interface ResearchSource {
  domain: string;
  frequency: number;
  lastSeen: string;
  sampleUrls: string[];
  sampleTitles: string[];
  concepts: string[];
  isOurs: boolean;
}

interface ResearchSourcesResponse {
  sources: ResearchSource[];
  totalChecks: number;
  uniqueDomains: number;
  yourDomainAppearances: number;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found' }, { status: 403 });
    }

    // Get optional concept filter
    const { searchParams } = new URL(request.url);
    const conceptId = searchParams.get('conceptId');

    // Fetch all checks with search_results for this account
    let query = supabase
      .from('llm_visibility_checks')
      .select(`
        id,
        keyword_id,
        search_results,
        checked_at,
        keywords!inner (
          id,
          phrase
        )
      `)
      .eq('account_id', accountId)
      .not('search_results', 'is', null);

    if (conceptId) {
      query = query.eq('keyword_id', conceptId);
    }

    const { data: checks, error } = await query;

    if (error) {
      console.error('[research-sources] Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    // Aggregate search_results by domain
    const domainMap = new Map<string, {
      frequency: number;
      lastSeen: Date;
      urls: Set<string>;
      titles: Set<string>;
      concepts: Set<string>;
      isOurs: boolean;
    }>();

    let totalChecksWithResults = 0;
    let yourDomainAppearances = 0;

    for (const check of checks || []) {
      const searchResults = check.search_results as Array<{
        url: string;
        domain: string;
        title: string | null;
        description: string | null;
        isOurs: boolean;
      }> | null;

      if (!searchResults || !Array.isArray(searchResults) || searchResults.length === 0) {
        continue;
      }

      totalChecksWithResults++;
      const conceptName = (check.keywords as any)?.phrase || 'Unknown';
      const checkedAt = new Date(check.checked_at);

      for (const result of searchResults) {
        if (!result.domain) continue;

        const domain = result.domain.toLowerCase();

        if (!domainMap.has(domain)) {
          domainMap.set(domain, {
            frequency: 0,
            lastSeen: checkedAt,
            urls: new Set(),
            titles: new Set(),
            concepts: new Set(),
            isOurs: false,
          });
        }

        const entry = domainMap.get(domain)!;
        entry.frequency++;
        if (checkedAt > entry.lastSeen) {
          entry.lastSeen = checkedAt;
        }
        if (result.url) {
          entry.urls.add(result.url);
        }
        if (result.title) {
          entry.titles.add(result.title);
        }
        entry.concepts.add(conceptName);
        if (result.isOurs) {
          entry.isOurs = true;
          yourDomainAppearances++;
        }
      }
    }

    // Convert map to sorted array
    const sources: ResearchSource[] = Array.from(domainMap.entries())
      .map(([domain, data]) => ({
        domain,
        frequency: data.frequency,
        lastSeen: data.lastSeen.toISOString(),
        sampleUrls: Array.from(data.urls).slice(0, 5),
        sampleTitles: Array.from(data.titles).slice(0, 5),
        concepts: Array.from(data.concepts).slice(0, 10),
        isOurs: data.isOurs,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 100); // Limit to top 100 domains

    const response: ResearchSourcesResponse = {
      sources,
      totalChecks: totalChecksWithResults,
      uniqueDomains: domainMap.size,
      yourDomainAppearances,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[research-sources] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
