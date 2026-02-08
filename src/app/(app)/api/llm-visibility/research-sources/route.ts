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
 *   - view (optional): 'domain' (default) or 'url' - aggregate by domain or individual URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

interface ResearchSourceUrl {
  url: string;
  count: number;
}

interface ResearchSource {
  domain: string;
  frequency: number;
  lastSeen: string;
  sampleUrls: ResearchSourceUrl[];
  sampleTitles: string[];
  concepts: string[];
  isOurs: boolean;
}

interface URLResearchSource {
  url: string;
  domain: string;
  frequency: number;
  lastSeen: string;
  concepts: string[];
  isOurs: boolean;
}

interface ResearchSourcesResponse {
  sources: ResearchSource[];
  totalChecks: number;
  uniqueDomains: number;
  yourDomainAppearances: number;
}

interface URLResearchSourcesResponse {
  sources: URLResearchSource[];
  totalChecks: number;
  uniqueUrls: number;
  yourUrlAppearances: number;
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

    // Get optional filters
    const { searchParams } = new URL(request.url);
    const conceptId = searchParams.get('conceptId');
    const view = searchParams.get('view') || 'domain';

    // Fetch all ChatGPT checks for this account (only ChatGPT returns sources)
    let query = supabase
      .from('llm_visibility_checks')
      .select(`
        id,
        keyword_id,
        search_results,
        citations,
        checked_at,
        keywords!inner (
          id,
          phrase
        )
      `)
      .eq('account_id', accountId)
      .eq('llm_provider', 'chatgpt');

    if (conceptId) {
      query = query.eq('keyword_id', conceptId);
    }

    const { data: checks, error } = await query;

    if (error) {
      console.error('[research-sources] Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    // Debug: log what we got from the database
    const totalChecksFound = checks?.length || 0;
    const checksWithSearchResults = (checks || []).filter(c => c.search_results != null);
    const checksWithCitations = (checks || []).filter(c => c.citations != null);
    console.log(`[research-sources] Found ${totalChecksFound} ChatGPT checks, ${checksWithSearchResults.length} with search_results, ${checksWithCitations.length} with citations`);

    // Parse checks into a flat list of results
    type ParsedResult = {
      url: string;
      domain: string;
      title: string | null;
      isOurs: boolean;
      conceptName: string;
      checkedAt: Date;
    };

    const allResults: ParsedResult[] = [];
    let totalChecksWithResults = 0;

    for (const check of checks || []) {
      const searchResults = check.search_results as Array<{
        url: string;
        domain: string;
        title: string | null;
        description: string | null;
        isOurs: boolean;
      }> | null;

      const citations = check.citations as Array<{
        url: string | null;
        domain: string;
        title: string | null;
        position: number;
        isOurs: boolean;
      }> | null;

      // Use search_results if available, otherwise fall back to citations
      const hasSearchResults = searchResults && Array.isArray(searchResults) && searchResults.length > 0;
      const hasCitations = citations && Array.isArray(citations) && citations.length > 0;

      if (!hasSearchResults && !hasCitations) {
        continue;
      }

      totalChecksWithResults++;
      const conceptName = (check.keywords as any)?.phrase || 'Unknown';
      const checkedAt = new Date(check.checked_at);

      if (hasSearchResults) {
        for (const result of searchResults) {
          if (!result.domain) continue;
          allResults.push({
            url: result.url,
            domain: result.domain.toLowerCase(),
            title: result.title,
            isOurs: result.isOurs,
            conceptName,
            checkedAt,
          });
        }
      } else if (hasCitations) {
        for (const citation of citations) {
          if (!citation.domain) continue;
          allResults.push({
            url: citation.url || '',
            domain: citation.domain.toLowerCase(),
            title: citation.title,
            isOurs: citation.isOurs,
            conceptName,
            checkedAt,
          });
        }
      }
    }

    // --- URL view ---
    if (view === 'url') {
      const urlMap = new Map<string, {
        domain: string;
        frequency: number;
        lastSeen: Date;
        concepts: Set<string>;
        isOurs: boolean;
      }>();

      let yourUrlAppearances = 0;

      for (const r of allResults) {
        if (!r.url) continue;

        if (!urlMap.has(r.url)) {
          urlMap.set(r.url, {
            domain: r.domain,
            frequency: 0,
            lastSeen: r.checkedAt,
            concepts: new Set(),
            isOurs: false,
          });
        }

        const entry = urlMap.get(r.url)!;
        entry.frequency++;
        if (r.checkedAt > entry.lastSeen) {
          entry.lastSeen = r.checkedAt;
        }
        entry.concepts.add(r.conceptName);
        if (r.isOurs) {
          entry.isOurs = true;
          yourUrlAppearances++;
        }
      }

      const urlSources: URLResearchSource[] = Array.from(urlMap.entries())
        .map(([url, data]) => ({
          url,
          domain: data.domain,
          frequency: data.frequency,
          lastSeen: data.lastSeen.toISOString(),
          concepts: Array.from(data.concepts).slice(0, 10),
          isOurs: data.isOurs,
        }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 200);

      const urlResponse = {
        sources: urlSources,
        totalChecks: totalChecksWithResults,
        uniqueUrls: urlMap.size,
        yourUrlAppearances,
        _debug: {
          totalChatGPTChecks: totalChecksFound,
          checksWithSearchResults: checksWithSearchResults.length,
          checksWithCitations: checksWithCitations.length,
          parsedResults: allResults.length,
        },
      };

      return NextResponse.json(urlResponse);
    }

    // --- Domain view (default) ---
    const domainMap = new Map<string, {
      frequency: number;
      lastSeen: Date;
      urls: Map<string, number>;
      titles: Set<string>;
      concepts: Set<string>;
      isOurs: boolean;
    }>();

    let yourDomainAppearances = 0;

    for (const r of allResults) {
      if (!domainMap.has(r.domain)) {
        domainMap.set(r.domain, {
          frequency: 0,
          lastSeen: r.checkedAt,
          urls: new Map(),
          titles: new Set(),
          concepts: new Set(),
          isOurs: false,
        });
      }

      const entry = domainMap.get(r.domain)!;
      entry.frequency++;
      if (r.checkedAt > entry.lastSeen) {
        entry.lastSeen = r.checkedAt;
      }
      if (r.url) {
        entry.urls.set(r.url, (entry.urls.get(r.url) || 0) + 1);
      }
      if (r.title) {
        entry.titles.add(r.title);
      }
      entry.concepts.add(r.conceptName);
      if (r.isOurs) {
        entry.isOurs = true;
        yourDomainAppearances++;
      }
    }

    // Convert map to sorted array
    const sources: ResearchSource[] = Array.from(domainMap.entries())
      .map(([domain, data]) => ({
        domain,
        frequency: data.frequency,
        lastSeen: data.lastSeen.toISOString(),
        sampleUrls: Array.from(data.urls.entries())
          .map(([url, count]) => ({ url, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        sampleTitles: Array.from(data.titles).slice(0, 5),
        concepts: Array.from(data.concepts).slice(0, 10),
        isOurs: data.isOurs,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 100); // Limit to top 100 domains

    const response = {
      sources,
      totalChecks: totalChecksWithResults,
      uniqueDomains: domainMap.size,
      yourDomainAppearances,
      _debug: {
        totalChatGPTChecks: totalChecksFound,
        checksWithSearchResults: checksWithSearchResults.length,
        checksWithCitations: checksWithCitations.length,
        parsedResults: allResults.length,
      },
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
