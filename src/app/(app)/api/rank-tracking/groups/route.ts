import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/rank-tracking/groups
 * List all keyword groups for the current account.
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

    // Get all groups for this account with keyword count
    const { data: groups, error: groupsError } = await serviceSupabase
      .from('rank_keyword_groups')
      .select(`
        *,
        keyword_count:rank_group_keywords(count)
      `)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (groupsError) {
      console.error('❌ [RankTracking] Failed to fetch groups:', groupsError);
      return NextResponse.json(
        { error: 'Failed to fetch groups' },
        { status: 500 }
      );
    }

    // Transform to camelCase
    const transformedGroups = (groups || []).map((group) => ({
      id: group.id,
      accountId: group.account_id,
      name: group.name,
      device: group.device,
      locationCode: group.location_code,
      locationName: group.location_name,
      scheduleFrequency: group.schedule_frequency,
      scheduleDayOfWeek: group.schedule_day_of_week,
      scheduleDayOfMonth: group.schedule_day_of_month,
      scheduleHour: group.schedule_hour,
      nextScheduledAt: group.next_scheduled_at,
      lastScheduledRunAt: group.last_scheduled_run_at,
      lastCheckedAt: group.last_checked_at,
      isEnabled: group.is_enabled,
      createdAt: group.created_at,
      updatedAt: group.updated_at,
      keywordCount: Array.isArray(group.keyword_count) ? group.keyword_count.length : 0,
    }));

    return NextResponse.json({ groups: transformedGroups });
  } catch (error) {
    console.error('❌ [RankTracking] Groups GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rank-tracking/groups
 * Create a new keyword group.
 *
 * Body:
 * - name: string (required)
 * - device: 'desktop' | 'mobile' (required)
 * - locationCode: number (required)
 * - locationName: string (required)
 * - scheduleFrequency: 'daily' | 'weekly' | 'monthly' (optional)
 * - scheduleDayOfWeek: number (0-6, for weekly)
 * - scheduleDayOfMonth: number (1-28, for monthly)
 * - scheduleHour: number (0-23, default 9)
 * - isEnabled: boolean (default true)
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
    const {
      name,
      device,
      locationCode,
      locationName,
      scheduleFrequency,
      scheduleDayOfWeek,
      scheduleDayOfMonth,
      scheduleHour = 9,
      isEnabled = true,
    } = body;

    // Validate required fields
    if (!name || !device || !locationCode || !locationName) {
      return NextResponse.json(
        { error: 'name, device, locationCode, and locationName are required' },
        { status: 400 }
      );
    }

    // Validate device
    if (!['desktop', 'mobile'].includes(device)) {
      return NextResponse.json(
        { error: 'device must be "desktop" or "mobile"' },
        { status: 400 }
      );
    }

    // Validate schedule frequency
    if (scheduleFrequency && !['daily', 'weekly', 'monthly'].includes(scheduleFrequency)) {
      return NextResponse.json(
        { error: 'scheduleFrequency must be "daily", "weekly", or "monthly"' },
        { status: 400 }
      );
    }

    // Calculate next scheduled time if schedule is enabled
    let nextScheduledAt = null;
    if (scheduleFrequency) {
      const now = new Date();
      const targetHour = scheduleHour || 9;

      if (scheduleFrequency === 'daily') {
        const next = new Date(now);
        next.setHours(targetHour, 0, 0, 0);
        if (next <= now) {
          next.setDate(next.getDate() + 1);
        }
        nextScheduledAt = next.toISOString();
      } else if (scheduleFrequency === 'weekly') {
        const targetDay = scheduleDayOfWeek ?? 1; // Monday default
        const next = new Date(now);
        next.setHours(targetHour, 0, 0, 0);
        const daysUntilTarget = (targetDay - next.getDay() + 7) % 7;
        next.setDate(next.getDate() + (daysUntilTarget || 7));
        nextScheduledAt = next.toISOString();
      } else if (scheduleFrequency === 'monthly') {
        const targetDay = scheduleDayOfMonth ?? 1;
        const next = new Date(now);
        next.setHours(targetHour, 0, 0, 0);
        next.setDate(targetDay);
        if (next <= now) {
          next.setMonth(next.getMonth() + 1);
        }
        nextScheduledAt = next.toISOString();
      }
    }

    // Create group
    const { data: group, error: createError } = await serviceSupabase
      .from('rank_keyword_groups')
      .insert({
        account_id: accountId,
        name,
        device,
        location_code: locationCode,
        location_name: locationName,
        schedule_frequency: scheduleFrequency || null,
        schedule_day_of_week: scheduleDayOfWeek ?? null,
        schedule_day_of_month: scheduleDayOfMonth ?? null,
        schedule_hour: scheduleHour,
        next_scheduled_at: nextScheduledAt,
        is_enabled: isEnabled,
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ [RankTracking] Failed to create group:', createError);
      return NextResponse.json(
        { error: 'Failed to create group' },
        { status: 500 }
      );
    }

    console.log(`✅ [RankTracking] Created group: ${group.name} (${group.id})`);

    return NextResponse.json({
      group: {
        id: group.id,
        accountId: group.account_id,
        name: group.name,
        device: group.device,
        locationCode: group.location_code,
        locationName: group.location_name,
        scheduleFrequency: group.schedule_frequency,
        scheduleDayOfWeek: group.schedule_day_of_week,
        scheduleDayOfMonth: group.schedule_day_of_month,
        scheduleHour: group.schedule_hour,
        nextScheduledAt: group.next_scheduled_at,
        lastScheduledRunAt: group.last_scheduled_run_at,
        lastCheckedAt: group.last_checked_at,
        isEnabled: group.is_enabled,
        createdAt: group.created_at,
        updatedAt: group.updated_at,
        keywordCount: 0,
      },
      created: true,
    });
  } catch (error) {
    console.error('❌ [RankTracking] Groups POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
