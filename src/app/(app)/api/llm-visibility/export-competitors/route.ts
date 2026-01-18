import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

/**
 * GET /api/llm-visibility/export-competitors
 * Export competitors data as CSV including competitor analysis
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

    // Get business info to identify user's brand
    const { data: business } = await supabase
      .from('businesses')
      .select('name')
      .eq('account_id', accountId)
      .single();

    const businessName = business?.name?.toLowerCase() || '';

    // Fetch all checks with mentioned_brands
    const { data: checks, error: checksError } = await supabase
      .from('llm_visibility_checks')
      .select(`
        mentioned_brands,
        checked_at,
        keywords!inner(phrase)
      `)
      .eq('account_id', accountId)
      .not('mentioned_brands', 'is', null);

    if (checksError) {
      console.error('[export-competitors] Error fetching checks:', checksError);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    // Aggregate competitors
    const competitorMap = new Map<string, {
      name: string;
      frequency: number;
      lastSeen: string;
      categories: Set<string>;
      domains: Set<string>;
      sampleUrls: Set<string>;
      concepts: Set<string>;
      isOurs: boolean;
    }>();

    for (const check of checks || []) {
      const mentionedBrands = check.mentioned_brands as Array<{
        title: string;
        category?: string;
        urls?: Array<{ url: string; domain: string }>;
      }> | null;

      if (!mentionedBrands || !Array.isArray(mentionedBrands)) continue;

      const concept = (check.keywords as any)?.phrase || '';

      for (const brand of mentionedBrands) {
        if (!brand.title) continue;

        const key = brand.title.toLowerCase();
        const isOurs = businessName && key.includes(businessName);
        const existing = competitorMap.get(key);

        if (existing) {
          existing.frequency++;
          if (new Date(check.checked_at) > new Date(existing.lastSeen)) {
            existing.lastSeen = check.checked_at;
          }
          if (brand.category) existing.categories.add(brand.category);
          if (brand.urls) {
            for (const u of brand.urls) {
              if (u.domain) existing.domains.add(u.domain);
              if (u.url && existing.sampleUrls.size < 3) existing.sampleUrls.add(u.url);
            }
          }
          if (concept) existing.concepts.add(concept);
        } else {
          competitorMap.set(key, {
            name: brand.title,
            frequency: 1,
            lastSeen: check.checked_at,
            categories: new Set(brand.category ? [brand.category] : []),
            domains: new Set(brand.urls?.map(u => u.domain).filter(Boolean) || []),
            sampleUrls: new Set(brand.urls?.slice(0, 3).map(u => u.url).filter(Boolean) || []),
            concepts: new Set(concept ? [concept] : []),
            isOurs,
          });
        }
      }
    }

    // Fetch all competitor analyses for this account
    const { data: analyses } = await supabase
      .from('competitor_analysis_cache')
      .select('competitor_name, who_they_are, why_mentioned, how_to_differentiate')
      .eq('account_id', accountId);

    const analysisMap = new Map<string, {
      whoTheyAre: string;
      whyMentioned: string;
      howToDifferentiate: string;
    }>();

    for (const analysis of analyses || []) {
      analysisMap.set(analysis.competitor_name.toLowerCase(), {
        whoTheyAre: analysis.who_they_are || '',
        whyMentioned: analysis.why_mentioned || '',
        howToDifferentiate: analysis.how_to_differentiate || '',
      });
    }

    // Build CSV
    const headers = [
      'Competitor',
      'Mentions',
      'Last Seen',
      'Is Your Brand',
      'Categories',
      'Domains',
      'Concepts',
      'Sample URLs',
      'Who They Are',
      'Why AI Mentions Them',
      'How to Differentiate',
    ];

    const rows = Array.from(competitorMap.values())
      .sort((a, b) => b.frequency - a.frequency)
      .map(competitor => {
        const analysis = analysisMap.get(competitor.name.toLowerCase());
        return [
          competitor.name,
          competitor.frequency.toString(),
          new Date(competitor.lastSeen).toISOString().split('T')[0],
          competitor.isOurs ? 'Yes' : 'No',
          Array.from(competitor.categories).join('; '),
          Array.from(competitor.domains).join('; '),
          Array.from(competitor.concepts).join('; '),
          Array.from(competitor.sampleUrls).join('; '),
          analysis?.whoTheyAre || '',
          analysis?.whyMentioned || '',
          analysis?.howToDifferentiate || '',
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
        'Content-Disposition': `attachment; filename="competitors-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('[export-competitors] Error:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
