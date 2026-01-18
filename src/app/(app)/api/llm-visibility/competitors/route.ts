/**
 * API endpoint to aggregate competitor/brand mentions from AI visibility checks.
 *
 * Shows which brands/competitors are being mentioned by AI assistants
 * in response to the user's keyword questions.
 *
 * GET /api/llm-visibility/competitors
 * Query params:
 *   - conceptId (optional): Filter to a specific keyword/concept
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

interface LLMBrandEntity {
  title: string;
  category: string | null;
  urls: Array<{ url: string; domain: string }> | null;
}

interface CompetitorMention {
  name: string;
  frequency: number;
  lastSeen: string;
  categories: string[];
  domains: string[];
  sampleUrls: string[];
  concepts: string[];
  isOurs: boolean;
}

interface CompetitorsResponse {
  competitors: CompetitorMention[];
  totalChecks: number;
  uniqueCompetitors: number;
  yourBrandMentions: number;
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

    // Get business name for identifying "our" brand
    const { data: business } = await supabase
      .from('businesses')
      .select('name')
      .eq('account_id', accountId)
      .single();

    const businessName = business?.name?.toLowerCase() || '';

    // Fetch all checks with mentioned_brands for this account
    let query = supabase
      .from('llm_visibility_checks')
      .select(`
        id,
        keyword_id,
        mentioned_brands,
        checked_at,
        keywords!inner (
          id,
          phrase
        )
      `)
      .eq('account_id', accountId)
      .not('mentioned_brands', 'is', null);

    if (conceptId) {
      query = query.eq('keyword_id', conceptId);
    }

    const { data: checks, error } = await query;

    if (error) {
      console.error('[competitors] Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    // Aggregate mentioned_brands by brand name
    const brandMap = new Map<string, {
      frequency: number;
      lastSeen: Date;
      categories: Set<string>;
      domains: Set<string>;
      urls: Set<string>;
      concepts: Set<string>;
      isOurs: boolean;
    }>();

    let totalChecksWithBrands = 0;
    let yourBrandMentions = 0;

    for (const check of checks || []) {
      const mentionedBrands = check.mentioned_brands as LLMBrandEntity[] | null;

      if (!mentionedBrands || !Array.isArray(mentionedBrands) || mentionedBrands.length === 0) {
        continue;
      }

      totalChecksWithBrands++;
      const conceptName = (check.keywords as any)?.phrase || 'Unknown';
      const checkedAt = new Date(check.checked_at);

      for (const brand of mentionedBrands) {
        if (!brand.title) continue;

        const brandName = brand.title.trim();
        const brandKey = brandName.toLowerCase();

        if (!brandMap.has(brandKey)) {
          brandMap.set(brandKey, {
            frequency: 0,
            lastSeen: checkedAt,
            categories: new Set(),
            domains: new Set(),
            urls: new Set(),
            concepts: new Set(),
            isOurs: false,
          });
        }

        const entry = brandMap.get(brandKey)!;
        entry.frequency++;
        if (checkedAt > entry.lastSeen) {
          entry.lastSeen = checkedAt;
        }
        if (brand.category) {
          entry.categories.add(brand.category);
        }
        if (brand.urls && Array.isArray(brand.urls)) {
          for (const urlObj of brand.urls) {
            if (urlObj.domain) {
              entry.domains.add(urlObj.domain);
            }
            if (urlObj.url) {
              entry.urls.add(urlObj.url);
            }
          }
        }
        entry.concepts.add(conceptName);

        // Check if this is our brand
        if (businessName && brandKey.includes(businessName)) {
          entry.isOurs = true;
          yourBrandMentions++;
        }
      }
    }

    // Convert map to sorted array, excluding user's own brand
    const competitors: CompetitorMention[] = Array.from(brandMap.entries())
      .filter(([, data]) => !data.isOurs) // Exclude user's own brand
      .map(([key, data]) => {
        // Use the original casing from the first occurrence
        const originalName = Array.from(brandMap.keys()).find(k => k.toLowerCase() === key) || key;
        return {
          name: originalName.charAt(0).toUpperCase() + originalName.slice(1), // Title case
          frequency: data.frequency,
          lastSeen: data.lastSeen.toISOString(),
          categories: Array.from(data.categories).slice(0, 5),
          domains: Array.from(data.domains).slice(0, 5),
          sampleUrls: Array.from(data.urls).slice(0, 5),
          concepts: Array.from(data.concepts).slice(0, 10),
          isOurs: data.isOurs,
        };
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 100); // Limit to top 100 competitors

    // Count unique competitors (excluding user's brand)
    const uniqueCompetitorCount = Array.from(brandMap.values()).filter(data => !data.isOurs).length;

    const response: CompetitorsResponse = {
      competitors,
      totalChecks: totalChecksWithBrands,
      uniqueCompetitors: uniqueCompetitorCount,
      yourBrandMentions,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[competitors] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
