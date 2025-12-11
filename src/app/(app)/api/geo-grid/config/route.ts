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
 * Get all geo grid configurations for the current account.
 * Returns array of configs (empty if none exist).
 *
 * Query params:
 * - configId: string (optional) - Get single config by ID
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

    // Check for single config request
    const { searchParams } = new URL(request.url);
    const configId = searchParams.get('configId');

    if (configId) {
      // Get single config by ID
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
        .eq('id', configId)
        .eq('account_id', accountId)
        .single();

      if (configError && configError.code !== 'PGRST116') {
        console.error('❌ [GeoGrid] Failed to fetch config:', configError);
        return NextResponse.json(
          { error: 'Failed to fetch configuration' },
          { status: 500 }
        );
      }

      if (!config) {
        return NextResponse.json({ config: null });
      }

      const transformed = transformConfigToResponse(config);
      return NextResponse.json({
        config: {
          ...transformed,
          googleBusinessLocation: config.google_business_locations || null,
        },
      });
    }

    // Get all configs for this account
    const { data: configs, error: configError } = await serviceSupabase
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
      .order('created_at', { ascending: true });

    if (configError) {
      console.error('❌ [GeoGrid] Failed to fetch configs:', configError);
      return NextResponse.json(
        { error: 'Failed to fetch configurations' },
        { status: 500 }
      );
    }

    // Transform all configs
    const transformedConfigs = (configs || []).map(config => ({
      ...transformConfigToResponse(config),
      googleBusinessLocation: config.google_business_locations || null,
    }));

    // Get account plan for tier info
    const { data: account } = await serviceSupabase
      .from('accounts')
      .select('plan')
      .eq('id', accountId)
      .single();

    const plan = account?.plan || 'grower';
    const maxConfigs = plan === 'maven' ? 10 : 1;
    const canAddMore = transformedConfigs.length < maxConfigs;

    return NextResponse.json({
      configs: transformedConfigs,
      // For backwards compatibility, also return first config as 'config'
      config: transformedConfigs[0] || null,
      // Tier info
      plan,
      maxConfigs,
      canAddMore,
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
 * Create or update geo grid configuration.
 *
 * Body:
 * - configId: string (optional) - Update specific config, or create if not provided
 * - googleBusinessLocationId: string (required for new configs with multi-location)
 * - locationName: string (optional) - Display name for the location
 * - centerLat: number (required for create)
 * - centerLng: number (required for create)
 * - radiusMiles: number (optional, default 3.0)
 * - checkPoints: string[] (optional, default ['center','n','s','e','w'])
 * - targetPlaceId: string (optional, but needed for rank checks)
 * - isEnabled: boolean (optional)
 *
 * Tier limits:
 * - Maven: up to 10 configs (one per location)
 * - Builder/Grower: 1 config only
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
    const { configId } = body;

    // Get account plan for tier enforcement
    const { data: account } = await serviceSupabase
      .from('accounts')
      .select('plan')
      .eq('id', accountId)
      .single();

    const plan = account?.plan || 'grower';
    const maxConfigs = plan === 'maven' ? 10 : 1;

    if (configId) {
      // Update existing config by ID
      const { data: existing } = await serviceSupabase
        .from('gg_configs')
        .select('id')
        .eq('id', configId)
        .eq('account_id', accountId)
        .single();

      if (!existing) {
        return NextResponse.json({ error: 'Config not found' }, { status: 404 });
      }

      return await updateConfig(configId, accountId, body);
    }

    // Creating new config - check tier limits
    const { count: existingCount } = await serviceSupabase
      .from('gg_configs')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId);

    if ((existingCount || 0) >= maxConfigs) {
      return NextResponse.json({
        error: 'Location limit reached',
        message: plan === 'maven'
          ? 'You have reached the maximum of 10 Local Ranking Grid configurations.'
          : 'Upgrade to Maven to track rankings for multiple locations.',
        maxAllowed: maxConfigs,
        currentCount: existingCount,
        upgradeRequired: plan !== 'maven',
      }, { status: 403 });
    }

    // For Maven with existing configs, require location ID for new configs
    if ((existingCount || 0) > 0 && !body.googleBusinessLocationId) {
      return NextResponse.json({
        error: 'googleBusinessLocationId is required when adding additional locations',
      }, { status: 400 });
    }

    // Check if config already exists for this location
    if (body.googleBusinessLocationId) {
      // Verify the location belongs to this account
      const { data: locationCheck } = await serviceSupabase
        .from('google_business_locations')
        .select('id')
        .eq('id', body.googleBusinessLocationId)
        .eq('account_id', accountId)
        .single();

      if (!locationCheck) {
        return NextResponse.json({
          error: 'Invalid location',
          message: 'The specified Google Business location does not belong to this account.',
        }, { status: 400 });
      }

      const { data: existingForLocation } = await serviceSupabase
        .from('gg_configs')
        .select('id')
        .eq('account_id', accountId)
        .eq('google_business_location_id', body.googleBusinessLocationId)
        .single();

      if (existingForLocation) {
        // Update existing config for this location
        return await updateConfig(existingForLocation.id, accountId, body);
      }
    }

    // Create new config
    return await createConfig(accountId, body);
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
      location_name: body.locationName || null,
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

  if ((body as any).locationName !== undefined) {
    updates.location_name = (body as any).locationName;
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

/**
 * DELETE /api/geo-grid/config
 * Delete a geo grid configuration.
 *
 * Query params:
 * - configId: string (required) - Config to delete
 */
export async function DELETE(request: NextRequest) {
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
    const configId = searchParams.get('configId');

    if (!configId) {
      return NextResponse.json({ error: 'configId is required' }, { status: 400 });
    }

    // Verify config belongs to this account
    const { data: existing } = await serviceSupabase
      .from('gg_configs')
      .select('id')
      .eq('id', configId)
      .eq('account_id', accountId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Config not found' }, { status: 404 });
    }

    // Delete config (cascade will delete related tracked_keywords, checks, summaries)
    const { error: deleteError } = await serviceSupabase
      .from('gg_configs')
      .delete()
      .eq('id', configId)
      .eq('account_id', accountId);

    if (deleteError) {
      console.error('❌ [GeoGrid] Failed to delete config:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, deleted: configId });
  } catch (error) {
    console.error('❌ [GeoGrid] Config DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
