import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import {
  GGConfigCreateInput,
  GGConfigUpdateInput,
  CheckPoint,
  DEFAULT_CHECK_POINTS,
} from '@/features/geo-grid/utils/types';
import { transformConfigToResponse } from '@/features/geo-grid/utils/transforms';
import {
  validateCoordinates,
  validateRadius,
  validateCheckPoints,
} from '@/features/geo-grid/services/point-calculator';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/geo-grid/config
 * Get the geo grid configuration for the current account.
 * Returns null if no config exists (user needs to set up).
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

    // Get config for this account
    const { data: config, error: configError } = await serviceSupabase
      .from('gg_configs')
      .select(`
        *,
        google_business_locations (
          id,
          location_name,
          address
        )
      `)
      .eq('account_id', accountId)
      .single();

    if (configError && configError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (expected if not set up)
      console.error('❌ [GeoGrid] Failed to fetch config:', configError);
      return NextResponse.json(
        { error: 'Failed to fetch configuration' },
        { status: 500 }
      );
    }

    if (!config) {
      return NextResponse.json({ config: null });
    }

    // Transform and return
    const transformed = transformConfigToResponse(config);

    return NextResponse.json({
      config: {
        ...transformed,
        googleBusinessLocation: config.google_business_locations || null,
      },
    });
  } catch (error) {
    console.error('❌ [GeoGrid] Config GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/geo-grid/config
 * Create or update the geo grid configuration for the current account.
 *
 * Body:
 * - centerLat: number (required for create)
 * - centerLng: number (required for create)
 * - radiusMiles: number (optional, default 3.0)
 * - checkPoints: string[] (optional, default ['center','n','s','e','w'])
 * - googleBusinessLocationId: string (optional)
 * - targetPlaceId: string (optional, but needed for rank checks)
 * - isEnabled: boolean (optional)
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

    // Check if config already exists
    const { data: existing } = await serviceSupabase
      .from('gg_configs')
      .select('id')
      .eq('account_id', accountId)
      .single();

    if (existing) {
      // Update existing config
      return await updateConfig(existing.id, accountId, body);
    } else {
      // Create new config
      return await createConfig(accountId, body);
    }
  } catch (error) {
    console.error('❌ [GeoGrid] Config POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createConfig(accountId: string, body: GGConfigCreateInput) {
  // Validate required fields
  if (body.centerLat === undefined || body.centerLng === undefined) {
    return NextResponse.json(
      { error: 'centerLat and centerLng are required' },
      { status: 400 }
    );
  }

  // Validate coordinates
  const coordValidation = validateCoordinates(body.centerLat, body.centerLng);
  if (!coordValidation.valid) {
    return NextResponse.json({ error: coordValidation.error }, { status: 400 });
  }

  // Validate radius if provided
  const radiusMiles = body.radiusMiles ?? 3.0;
  const radiusValidation = validateRadius(radiusMiles);
  if (!radiusValidation.valid) {
    return NextResponse.json({ error: radiusValidation.error }, { status: 400 });
  }

  // Validate check points if provided
  const checkPoints = body.checkPoints ?? DEFAULT_CHECK_POINTS;
  const pointsValidation = validateCheckPoints(checkPoints);
  if (!pointsValidation.valid) {
    return NextResponse.json({ error: pointsValidation.error }, { status: 400 });
  }

  // Create config
  const { data: config, error: createError } = await serviceSupabase
    .from('gg_configs')
    .insert({
      account_id: accountId,
      google_business_location_id: body.googleBusinessLocationId || null,
      center_lat: body.centerLat,
      center_lng: body.centerLng,
      radius_miles: radiusMiles,
      check_points: checkPoints,
      target_place_id: body.targetPlaceId || null,
      is_enabled: true,
    })
    .select()
    .single();

  if (createError) {
    console.error('❌ [GeoGrid] Failed to create config:', createError);
    return NextResponse.json(
      { error: 'Failed to create configuration' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    config: transformConfigToResponse(config),
    created: true,
  });
}

async function updateConfig(
  configId: string,
  accountId: string,
  body: GGConfigUpdateInput
) {
  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  // Validate and add updates
  if (body.centerLat !== undefined && body.centerLng !== undefined) {
    const coordValidation = validateCoordinates(body.centerLat, body.centerLng);
    if (!coordValidation.valid) {
      return NextResponse.json({ error: coordValidation.error }, { status: 400 });
    }
    updates.center_lat = body.centerLat;
    updates.center_lng = body.centerLng;
  }

  if (body.radiusMiles !== undefined) {
    const radiusValidation = validateRadius(body.radiusMiles);
    if (!radiusValidation.valid) {
      return NextResponse.json({ error: radiusValidation.error }, { status: 400 });
    }
    updates.radius_miles = body.radiusMiles;
  }

  if (body.checkPoints !== undefined) {
    const pointsValidation = validateCheckPoints(body.checkPoints);
    if (!pointsValidation.valid) {
      return NextResponse.json({ error: pointsValidation.error }, { status: 400 });
    }
    updates.check_points = body.checkPoints;
  }

  if (body.targetPlaceId !== undefined) {
    updates.target_place_id = body.targetPlaceId;
  }

  if (body.isEnabled !== undefined) {
    updates.is_enabled = body.isEnabled;
  }

  // Update config
  const { data: config, error: updateError } = await serviceSupabase
    .from('gg_configs')
    .update(updates)
    .eq('id', configId)
    .eq('account_id', accountId)
    .select()
    .single();

  if (updateError) {
    console.error('❌ [GeoGrid] Failed to update config:', updateError);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    config: transformConfigToResponse(config),
    updated: true,
  });
}
