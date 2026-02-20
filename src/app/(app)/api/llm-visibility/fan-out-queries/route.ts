/**
 * API endpoint to aggregate fan-out queries across all LLM visibility checks.
 *
 * Fan-out queries are the background searches that LLMs (primarily ChatGPT)
 * perform when answering a user's question. This endpoint aggregates them
 * so users can see what topics and subtopics LLMs explore.
 *
 * GET /api/llm-visibility/fan-out-queries
 * Query params:
 *   - conceptId (optional): Filter to a specific keyword/concept
 *   - provider (optional): Comma-separated provider filter (e.g. "chatgpt,claude")
 *   - timeWindow (optional): Time window filter (e.g. "last7days", "last30days")
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { getStartDateFromTimeWindow } from '@/features/llm-visibility/utils/timeWindow';

interface FanOutQuery {
  query: string;
  frequency: number;
  lastSeen: string;
  concepts: string[];
  providers: string[];
}

interface FanOutQueriesResponse {
  queries: FanOutQuery[];
  totalChecks: number;
  uniqueQueries: number;
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
    const providerParam = searchParams.get('provider');
    const timeWindow = searchParams.get('timeWindow') || 'all';
    const startDate = getStartDateFromTimeWindow(timeWindow);

    // Fetch checks that have fan_out_queries
    let query = supabase
      .from('llm_visibility_checks')
      .select(`
        id,
        keyword_id,
        llm_provider,
        fan_out_queries,
        checked_at,
        keywords!inner (
          id,
          phrase
        )
      `)
      .eq('account_id', accountId)
      .not('fan_out_queries', 'is', null);

    if (conceptId) {
      query = query.eq('keyword_id', conceptId);
    }

    if (providerParam) {
      const providers = providerParam.split(',').map(p => p.trim()).filter(Boolean);
      if (providers.length > 0) {
        query = query.in('llm_provider', providers);
      }
    }

    if (startDate) {
      query = query.gte('checked_at', startDate.toISOString());
    }

    const { data: checks, error } = await query;

    if (error) {
      console.error('[fan-out-queries] Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    // Aggregate fan-out queries (case-insensitive)
    const queryMap = new Map<string, {
      originalQuery: string;
      frequency: number;
      lastSeen: Date;
      concepts: Set<string>;
      providers: Set<string>;
    }>();

    let totalChecksWithQueries = 0;

    for (const check of checks || []) {
      const fanOutQueries = check.fan_out_queries as string[] | null;
      if (!fanOutQueries || !Array.isArray(fanOutQueries) || fanOutQueries.length === 0) {
        continue;
      }

      totalChecksWithQueries++;
      const conceptName = (check.keywords as any)?.phrase || 'Unknown';
      const checkedAt = new Date(check.checked_at);
      const provider = (check.llm_provider as string) || 'unknown';

      for (const q of fanOutQueries) {
        if (!q || typeof q !== 'string') continue;

        const key = q.toLowerCase().trim();
        if (!key) continue;

        if (!queryMap.has(key)) {
          queryMap.set(key, {
            originalQuery: q.trim(),
            frequency: 0,
            lastSeen: checkedAt,
            concepts: new Set(),
            providers: new Set(),
          });
        }

        const entry = queryMap.get(key)!;
        entry.frequency++;
        if (checkedAt > entry.lastSeen) {
          entry.lastSeen = checkedAt;
        }
        entry.concepts.add(conceptName);
        entry.providers.add(provider);
      }
    }

    // Convert map to sorted array
    const queries: FanOutQuery[] = Array.from(queryMap.values())
      .map((data) => ({
        query: data.originalQuery,
        frequency: data.frequency,
        lastSeen: data.lastSeen.toISOString(),
        concepts: Array.from(data.concepts).slice(0, 10),
        providers: Array.from(data.providers),
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 200);

    const response: FanOutQueriesResponse = {
      queries,
      totalChecks: totalChecksWithQueries,
      uniqueQueries: queryMap.size,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[fan-out-queries] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
