import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import {
  getKeywordVolume,
  getKeywordSuggestions,
} from '@/features/rank-tracking/api/dataforseo-serp-client';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limit: 50 discovery requests per day per account
const DAILY_DISCOVERY_LIMIT = 50;

/**
 * POST /api/rank-tracking/discovery
 * Keyword discovery with volume and trend data.
 *
 * Body:
 * - keyword: string (required) - Keyword to analyze
 * - locationCode: number (optional) - Location for volume data (default: 2840 = USA)
 *
 * Rate limited: 50/day per account
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const body = await request.json();
    const { keyword, locationCode = 2840 } = body;

    if (!keyword) {
      return NextResponse.json(
        { error: 'keyword is required' },
        { status: 400 }
      );
    }

    // Check rate limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Get or create usage record for today
    const { data: usage, error: usageError } = await serviceSupabase
      .from('rank_discovery_usage')
      .select('*')
      .eq('account_id', accountId)
      .eq('usage_date', todayStr)
      .single();

    if (usageError && usageError.code !== 'PGRST116') {
      console.error('❌ [RankTracking] Failed to check usage:', usageError);
      return NextResponse.json(
        { error: 'Failed to check rate limit' },
        { status: 500 }
      );
    }

    const currentUsage = usage?.request_count || 0;

    if (currentUsage >= DAILY_DISCOVERY_LIMIT) {
      return NextResponse.json(
        {
          error: 'Daily keyword research limit reached. Try again tomorrow.',
          limit: DAILY_DISCOVERY_LIMIT,
          used: currentUsage,
          resetsAt: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        },
        { status: 429 } // Too Many Requests
      );
    }

    console.log(`🔍 [RankTracking] Keyword discovery for "${keyword}" (account: ${accountId})`);

    // Fetch volume data
    const volumeResults = await getKeywordVolume({
      keywords: [keyword],
      locationCode,
    });

    const volumeData = volumeResults[0] || {
      keyword,
      searchVolume: 0,
      cpc: null,
      competition: null,
      competitionLevel: null,
      monthlySearches: [],
    };

    // Calculate trend from monthly data
    let trend: 'rising' | 'falling' | 'stable' | null = null;
    if (volumeData.monthlySearches && volumeData.monthlySearches.length >= 3) {
      const recent = volumeData.monthlySearches.slice(-3);
      const avgRecent = recent.reduce((sum, m) => sum + m.searchVolume, 0) / recent.length;
      const older = volumeData.monthlySearches.slice(-6, -3);
      const avgOlder = older.length > 0
        ? older.reduce((sum, m) => sum + m.searchVolume, 0) / older.length
        : avgRecent;

      if (avgRecent > avgOlder * 1.1) {
        trend = 'rising';
      } else if (avgRecent < avgOlder * 0.9) {
        trend = 'falling';
      } else {
        trend = 'stable';
      }
    }

    // Increment usage counter
    await serviceSupabase
      .from('rank_discovery_usage')
      .upsert(
        {
          account_id: accountId,
          usage_date: todayStr,
          request_count: currentUsage + 1,
        },
        {
          onConflict: 'account_id,usage_date',
        }
      );

    console.log(`✅ [RankTracking] Discovery complete. Volume: ${volumeData.searchVolume}`);

    return NextResponse.json({
      keyword: volumeData.keyword,
      volume: volumeData.searchVolume,
      trend,
      cpc: volumeData.cpc,
      competition: volumeData.competition,
      competitionLevel: volumeData.competitionLevel,
      monthlySearches: volumeData.monthlySearches,
      rateLimit: {
        limit: DAILY_DISCOVERY_LIMIT,
        used: currentUsage + 1,
        remaining: DAILY_DISCOVERY_LIMIT - currentUsage - 1,
        resetsAt: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ [RankTracking] Discovery POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rank-tracking/discovery/suggestions
 * Get keyword suggestions based on a seed keyword.
 *
 * Query params:
 * - seed: string (required) - Seed keyword
 * - locationCode: number (optional) - Location (default: 2840 = USA)
 * - limit: number (optional) - Max suggestions (default: 50)
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
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const seed = searchParams.get('seed');
    const locationCode = parseInt(searchParams.get('locationCode') || '2840', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!seed) {
      return NextResponse.json(
        { error: 'seed is required' },
        { status: 400 }
      );
    }

    // Check rate limit (same as discovery)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const { data: usage } = await serviceSupabase
      .from('rank_discovery_usage')
      .select('*')
      .eq('account_id', accountId)
      .eq('usage_date', todayStr)
      .single();

    const currentUsage = usage?.request_count || 0;

    if (currentUsage >= DAILY_DISCOVERY_LIMIT) {
      return NextResponse.json(
        {
          error: 'Daily keyword research limit reached. Try again tomorrow.',
          limit: DAILY_DISCOVERY_LIMIT,
          used: currentUsage,
          resetsAt: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        },
        { status: 429 }
      );
    }

    console.log(`🔍 [RankTracking] Keyword suggestions for "${seed}" (account: ${accountId})`);

    // Fetch suggestions
    const suggestions = await getKeywordSuggestions({
      seedKeyword: seed,
      locationCode,
      limit,
    });

    // Increment usage counter
    await serviceSupabase
      .from('rank_discovery_usage')
      .upsert(
        {
          account_id: accountId,
          usage_date: todayStr,
          request_count: currentUsage + 1,
        },
        {
          onConflict: 'account_id,usage_date',
        }
      );

    console.log(`✅ [RankTracking] Found ${suggestions.length} suggestions`);

    return NextResponse.json({
      suggestions: suggestions.map((s) => ({
        keyword: s.keyword,
        volume: s.searchVolume,
        cpc: s.cpc,
        competition: s.competition,
        competitionLevel: s.competitionLevel,
      })),
      rateLimit: {
        limit: DAILY_DISCOVERY_LIMIT,
        used: currentUsage + 1,
        remaining: DAILY_DISCOVERY_LIMIT - currentUsage - 1,
        resetsAt: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ [RankTracking] Suggestions GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
