import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { transformTrackedKeywordToResponse } from '@/features/geo-grid/utils/transforms';
import { ScheduleMode, ScheduleFrequency } from '@/features/geo-grid/utils/types';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/geo-grid/tracked-keywords
 * List all tracked keywords for the account's geo grid config.
 *
 * Query params:
 * - configId: string (optional) - Config ID to fetch keywords for (defaults to first config)
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const configId = searchParams.get('configId') || undefined;

    // Get config - by ID if provided, otherwise first config for account
    let config: { id: string } | null = null;

    if (configId) {
      const { data } = await serviceSupabase
        .from('gg_configs')
        .select('id')
        .eq('id', configId)
        .eq('account_id', accountId)
        .single();
      config = data;
    } else {
      const { data } = await serviceSupabase
        .from('gg_configs')
        .select('id')
        .eq('account_id', accountId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
      config = data;
    }

    if (!config) {
      return NextResponse.json({
        trackedKeywords: [],
        message: 'No geo grid configuration found. Set up your config first.',
      });
    }

    // Get tracked keywords with keyword details
    const { data: trackedKeywords, error: keywordsError } = await serviceSupabase
      .from('gg_tracked_keywords')
      .select(`
        id,
        config_id,
        keyword_id,
        account_id,
        is_enabled,
        created_at,
        schedule_mode,
        schedule_frequency,
        schedule_day_of_week,
        schedule_day_of_month,
        schedule_hour,
        next_scheduled_at,
        last_scheduled_run_at,
        keywords (
          id,
          phrase,
          normalized_phrase,
          review_usage_count,
          status
        )
      `)
      .eq('config_id', config.id)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (keywordsError) {
      console.error('❌ [GeoGrid] Failed to fetch tracked keywords:', keywordsError);
      return NextResponse.json(
        { error: 'Failed to fetch tracked keywords' },
        { status: 500 }
      );
    }

    const transformed = (trackedKeywords || []).map((row) =>
      transformTrackedKeywordToResponse(row as any)
    );

    return NextResponse.json({ trackedKeywords: transformed });
  } catch (error) {
    console.error('❌ [GeoGrid] Tracked keywords GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/geo-grid/tracked-keywords
 * Add keywords to track.
 *
 * Body:
 * - configId: string (optional) - Config to add keywords to (defaults to first config)
 * - keywordIds: string[] (required) - IDs of keywords to track
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
    const { configId, keywordIds } = body;

    if (!keywordIds || !Array.isArray(keywordIds) || keywordIds.length === 0) {
      return NextResponse.json(
        { error: 'keywordIds array is required' },
        { status: 400 }
      );
    }

    // Get config - by ID if provided, otherwise first config for account
    let config: { id: string } | null = null;

    if (configId) {
      const { data } = await serviceSupabase
        .from('gg_configs')
        .select('id')
        .eq('id', configId)
        .eq('account_id', accountId)
        .single();
      config = data;
    } else {
      const { data } = await serviceSupabase
        .from('gg_configs')
        .select('id')
        .eq('account_id', accountId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
      config = data;
    }

    if (!config) {
      return NextResponse.json(
        { error: 'No geo grid configuration found. Set up your config first.' },
        { status: 400 }
      );
    }

    // Verify keywords belong to this account
    const { data: validKeywords, error: verifyError } = await serviceSupabase
      .from('keywords')
      .select('id')
      .eq('account_id', accountId)
      .in('id', keywordIds);

    if (verifyError) {
      console.error('❌ [GeoGrid] Failed to verify keywords:', verifyError);
      return NextResponse.json(
        { error: 'Failed to verify keywords' },
        { status: 500 }
      );
    }

    const validKeywordIds = new Set((validKeywords || []).map((k) => k.id));
    const invalidIds = keywordIds.filter((id: string) => !validKeywordIds.has(id));

    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Invalid keyword IDs: ${invalidIds.join(', ')}` },
        { status: 400 }
      );
    }

    // Insert tracked keywords (upsert to handle duplicates)
    const toInsert = keywordIds.map((keywordId: string) => ({
      config_id: config.id,
      keyword_id: keywordId,
      account_id: accountId,
      is_enabled: true,
    }));

    const { data: inserted, error: insertError } = await serviceSupabase
      .from('gg_tracked_keywords')
      .upsert(toInsert, {
        onConflict: 'config_id,keyword_id',
        ignoreDuplicates: false,
      })
      .select(`
        id,
        config_id,
        keyword_id,
        account_id,
        is_enabled,
        created_at,
        schedule_mode,
        schedule_frequency,
        schedule_day_of_week,
        schedule_day_of_month,
        schedule_hour,
        next_scheduled_at,
        last_scheduled_run_at,
        keywords (
          id,
          phrase,
          normalized_phrase
        )
      `);

    if (insertError) {
      console.error('❌ [GeoGrid] Failed to add tracked keywords:', insertError);
      return NextResponse.json(
        { error: 'Failed to add tracked keywords' },
        { status: 500 }
      );
    }

    const transformed = (inserted || []).map((row) =>
      transformTrackedKeywordToResponse(row as any)
    );

    return NextResponse.json({
      trackedKeywords: transformed,
      added: transformed.length,
    });
  } catch (error) {
    console.error('❌ [GeoGrid] Tracked keywords POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/geo-grid/tracked-keywords
 * Remove keywords from tracking.
 *
 * Query params:
 * - id: string (required) - ID of the tracked keyword entry to remove
 *
 * OR Body:
 * - keywordIds: string[] (required) - IDs of keywords to stop tracking
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

    // Check for query param (single tracked keyword ID)
    const url = new URL(request.url);
    const trackedKeywordId = url.searchParams.get('id');

    // Get config for this account
    const { data: config } = await serviceSupabase
      .from('gg_configs')
      .select('id')
      .eq('account_id', accountId)
      .single();

    if (!config) {
      return NextResponse.json(
        { error: 'No geo grid configuration found.' },
        { status: 400 }
      );
    }

    // Handle single tracked keyword ID from query param
    if (trackedKeywordId) {
      const { error: deleteError } = await serviceSupabase
        .from('gg_tracked_keywords')
        .delete()
        .eq('id', trackedKeywordId)
        .eq('config_id', config.id)
        .eq('account_id', accountId);

      if (deleteError) {
        console.error('❌ [GeoGrid] Failed to remove tracked keyword:', deleteError);
        return NextResponse.json(
          { error: 'Failed to remove tracked keyword' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        removed: 1,
        success: true,
      });
    }

    // Handle array of keyword IDs from body
    const body = await request.json();
    const { keywordIds } = body;

    if (!keywordIds || !Array.isArray(keywordIds) || keywordIds.length === 0) {
      return NextResponse.json(
        { error: 'keywordIds array or id query param is required' },
        { status: 400 }
      );
    }

    // Delete tracked keywords
    const { error: deleteError } = await serviceSupabase
      .from('gg_tracked_keywords')
      .delete()
      .eq('config_id', config.id)
      .eq('account_id', accountId)
      .in('keyword_id', keywordIds);

    if (deleteError) {
      console.error('❌ [GeoGrid] Failed to remove tracked keywords:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove tracked keywords' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      removed: keywordIds.length,
      success: true,
    });
  } catch (error) {
    console.error('❌ [GeoGrid] Tracked keywords DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/geo-grid/tracked-keywords
 * Update a tracked keyword's schedule.
 *
 * Body:
 * - id: string (required) - ID of the tracked keyword to update
 * - scheduleMode: 'inherit' | 'custom' | 'off' (required)
 * - scheduleFrequency: 'daily' | 'weekly' | 'monthly' | null (required if mode is 'custom')
 * - scheduleDayOfWeek: number | null (0-6, for weekly)
 * - scheduleDayOfMonth: number | null (1-28, for monthly)
 * - scheduleHour: number (0-23, default 9)
 */
export async function PATCH(request: NextRequest) {
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
    const {
      id,
      scheduleMode,
      scheduleFrequency,
      scheduleDayOfWeek,
      scheduleDayOfMonth,
      scheduleHour,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    // Validate scheduleMode
    const validModes: ScheduleMode[] = ['inherit', 'custom', 'off'];
    if (!validModes.includes(scheduleMode)) {
      return NextResponse.json(
        { error: 'scheduleMode must be inherit, custom, or off' },
        { status: 400 }
      );
    }

    // Validate scheduleFrequency if mode is custom
    if (scheduleMode === 'custom') {
      const validFrequencies: ScheduleFrequency[] = ['daily', 'weekly', 'monthly'];
      if (!validFrequencies.includes(scheduleFrequency)) {
        return NextResponse.json(
          { error: 'scheduleFrequency must be daily, weekly, or monthly when mode is custom' },
          { status: 400 }
        );
      }

      // Validate day of week for weekly
      if (scheduleFrequency === 'weekly') {
        if (scheduleDayOfWeek === undefined || scheduleDayOfWeek === null ||
            scheduleDayOfWeek < 0 || scheduleDayOfWeek > 6) {
          return NextResponse.json(
            { error: 'scheduleDayOfWeek must be 0-6 for weekly frequency' },
            { status: 400 }
          );
        }
      }

      // Validate day of month for monthly
      if (scheduleFrequency === 'monthly') {
        if (scheduleDayOfMonth === undefined || scheduleDayOfMonth === null ||
            scheduleDayOfMonth < 1 || scheduleDayOfMonth > 28) {
          return NextResponse.json(
            { error: 'scheduleDayOfMonth must be 1-28 for monthly frequency' },
            { status: 400 }
          );
        }
      }
    }

    // Validate scheduleHour
    const hour = scheduleHour ?? 9;
    if (hour < 0 || hour > 23) {
      return NextResponse.json(
        { error: 'scheduleHour must be 0-23' },
        { status: 400 }
      );
    }

    // Verify tracked keyword exists and belongs to account
    const { data: existing, error: existingError } = await serviceSupabase
      .from('gg_tracked_keywords')
      .select('id, account_id')
      .eq('id', id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json(
        { error: 'Tracked keyword not found' },
        { status: 404 }
      );
    }

    if (existing.account_id !== accountId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      schedule_mode: scheduleMode,
    };

    if (scheduleMode === 'custom') {
      updateData.schedule_frequency = scheduleFrequency;
      updateData.schedule_day_of_week = scheduleFrequency === 'weekly' ? scheduleDayOfWeek : null;
      updateData.schedule_day_of_month = scheduleFrequency === 'monthly' ? scheduleDayOfMonth : null;
      updateData.schedule_hour = hour;
    } else {
      // Clear custom schedule fields when not using custom mode
      updateData.schedule_frequency = null;
      updateData.schedule_day_of_week = null;
      updateData.schedule_day_of_month = null;
      updateData.schedule_hour = 9;
    }

    // Update the tracked keyword
    const { data: updated, error: updateError } = await serviceSupabase
      .from('gg_tracked_keywords')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        config_id,
        keyword_id,
        account_id,
        is_enabled,
        created_at,
        schedule_mode,
        schedule_frequency,
        schedule_day_of_week,
        schedule_day_of_month,
        schedule_hour,
        next_scheduled_at,
        last_scheduled_run_at,
        keywords (
          id,
          phrase,
          normalized_phrase
        )
      `)
      .single();

    if (updateError) {
      console.error('❌ [GeoGrid] Failed to update tracked keyword schedule:', updateError);
      return NextResponse.json(
        { error: 'Failed to update schedule' },
        { status: 500 }
      );
    }

    const transformed = transformTrackedKeywordToResponse(updated as any);

    return NextResponse.json({
      trackedKeyword: transformed,
      success: true,
    });
  } catch (error) {
    console.error('❌ [GeoGrid] Tracked keywords PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
