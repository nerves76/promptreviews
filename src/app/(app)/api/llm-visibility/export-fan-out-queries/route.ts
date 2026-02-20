import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

/**
 * GET /api/llm-visibility/export-fan-out-queries
 * Export fan-out queries data as CSV
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

    // Fetch all checks with fan_out_queries
    const { data: checks, error: checksError } = await supabase
      .from('llm_visibility_checks')
      .select(`
        fan_out_queries,
        llm_provider,
        checked_at,
        keywords!inner(phrase)
      `)
      .eq('account_id', accountId)
      .not('fan_out_queries', 'is', null);

    if (checksError) {
      console.error('[export-fan-out-queries] Error fetching checks:', checksError);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    // Aggregate fan-out queries (case-insensitive)
    const queryMap = new Map<string, {
      originalQuery: string;
      frequency: number;
      lastSeen: string;
      concepts: Set<string>;
      providers: Set<string>;
    }>();

    for (const check of checks || []) {
      const fanOutQueries = check.fan_out_queries as string[] | null;
      if (!fanOutQueries || !Array.isArray(fanOutQueries) || fanOutQueries.length === 0) {
        continue;
      }

      const conceptName = (check.keywords as any)?.phrase || '';
      const provider = (check.llm_provider as string) || 'unknown';

      for (const q of fanOutQueries) {
        if (!q || typeof q !== 'string') continue;

        const key = q.toLowerCase().trim();
        if (!key) continue;

        const existing = queryMap.get(key);
        if (existing) {
          existing.frequency++;
          if (new Date(check.checked_at) > new Date(existing.lastSeen)) {
            existing.lastSeen = check.checked_at;
          }
          if (conceptName) existing.concepts.add(conceptName);
          existing.providers.add(provider);
        } else {
          queryMap.set(key, {
            originalQuery: q.trim(),
            frequency: 1,
            lastSeen: check.checked_at,
            concepts: new Set(conceptName ? [conceptName] : []),
            providers: new Set([provider]),
          });
        }
      }
    }

    // Build CSV
    const headers = [
      'Query',
      'Frequency',
      'Last Seen',
      'Concepts',
      'Providers',
    ];

    const rows = Array.from(queryMap.values())
      .sort((a, b) => b.frequency - a.frequency)
      .map(entry => [
        entry.originalQuery,
        entry.frequency.toString(),
        new Date(entry.lastSeen).toISOString().split('T')[0],
        Array.from(entry.concepts).join('; '),
        Array.from(entry.providers).join('; '),
      ]);

    // Generate CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="fan-out-queries-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('[export-fan-out-queries] Error:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
