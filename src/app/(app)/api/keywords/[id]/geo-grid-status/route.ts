import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { positionToBucket, type CheckPoint, type PositionBucket } from '@/features/geo-grid/utils/types';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/keywords/[id]/geo-grid-status
 *
 * Get the geo grid tracking status for a keyword.
 * Returns the config, latest check results per grid point, and summary stats.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: keywordId } = await params;

    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Verify keyword belongs to this account
    const { data: keyword } = await serviceSupabase
      .from('keywords')
      .select('id, phrase')
      .eq('id', keywordId)
      .eq('account_id', accountId)
      .single();

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
    }

    // Check if keyword is tracked in geo grid
    const { data: trackedKeyword } = await serviceSupabase
      .from('gg_tracked_keywords')
      .select(`
        id,
        config_id,
        is_enabled,
        gg_configs (
          id,
          location_name,
          center_lat,
          center_lng,
          radius_miles,
          check_points,
          last_checked_at
        )
      `)
      .eq('keyword_id', keywordId)
      .eq('account_id', accountId)
      .single();

    if (!trackedKeyword || !trackedKeyword.gg_configs) {
      return NextResponse.json({
        isTracked: false,
        keyword: {
          id: keyword.id,
          phrase: keyword.phrase,
        },
        config: null,
        latestResults: [],
        summary: null,
      });
    }

    const config = trackedKeyword.gg_configs as unknown as {
      id: string;
      location_name: string | null;
      center_lat: number;
      center_lng: number;
      radius_miles: number;
      check_points: CheckPoint[];
      last_checked_at: string | null;
    };

    // Get the most recent check for each check point
    // Using a raw query approach with DISTINCT ON for efficiency
    const { data: latestChecks } = await serviceSupabase
      .from('gg_checks')
      .select(`
        id,
        check_point,
        position,
        position_bucket,
        our_place_id,
        checked_at
      `)
      .eq('keyword_id', keywordId)
      .eq('config_id', config.id)
      .eq('account_id', accountId)
      .order('checked_at', { ascending: false })
      .limit(50); // Get recent checks and filter in code

    // Deduplicate to get only the latest per check point
    const latestByPoint = new Map<CheckPoint, {
      checkPoint: CheckPoint;
      position: number | null;
      positionBucket: PositionBucket;
      businessFound: boolean;
      checkedAt: string;
    }>();

    for (const check of latestChecks || []) {
      const point = check.check_point as CheckPoint;
      if (!latestByPoint.has(point)) {
        latestByPoint.set(point, {
          checkPoint: point,
          position: check.position,
          positionBucket: (check.position_bucket as PositionBucket) || positionToBucket(check.position),
          businessFound: check.our_place_id !== null,
          checkedAt: check.checked_at,
        });
      }
    }

    const latestResults = Array.from(latestByPoint.values());

    // Calculate summary stats
    const totalPoints = latestResults.length;
    const positions = latestResults.map(r => r.position).filter((p): p is number => p !== null);
    const averagePosition = positions.length > 0
      ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10
      : null;
    const bestPosition = positions.length > 0 ? Math.min(...positions) : null;

    const summary = {
      averagePosition,
      bestPosition,
      pointsInTop3: latestResults.filter(r => r.positionBucket === 'top3').length,
      pointsInTop10: latestResults.filter(r => r.positionBucket === 'top10' || r.positionBucket === 'top3').length,
      pointsInTop20: latestResults.filter(r => r.positionBucket !== 'none').length,
      pointsNotFound: latestResults.filter(r => r.positionBucket === 'none').length,
      totalPoints,
    };

    return NextResponse.json({
      isTracked: true,
      keyword: {
        id: keyword.id,
        phrase: keyword.phrase,
      },
      config: {
        id: config.id,
        locationName: config.location_name,
        centerLat: config.center_lat,
        centerLng: config.center_lng,
        radiusMiles: config.radius_miles,
        checkPoints: config.check_points,
        lastCheckedAt: config.last_checked_at,
      },
      latestResults,
      summary,
    });
  } catch (error) {
    console.error('❌ [Keywords] Geo grid status GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
