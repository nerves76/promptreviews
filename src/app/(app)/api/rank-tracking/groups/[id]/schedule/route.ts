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
 * GET /api/rank-tracking/groups/[id]/schedule
 * Get schedule settings for a group.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Get group schedule settings
    const { data: group, error: groupError } = await serviceSupabase
      .from('rank_keyword_groups')
      .select(`
        id,
        name,
        schedule_frequency,
        schedule_day_of_week,
        schedule_day_of_month,
        schedule_hour,
        next_scheduled_at,
        last_scheduled_run_at,
        is_enabled
      `)
      .eq('id', groupId)
      .eq('account_id', accountId)
      .single();

    if (groupError && groupError.code !== 'PGRST116') {
      console.error('❌ [RankTracking] Failed to fetch group:', groupError);
      return NextResponse.json(
        { error: 'Failed to fetch group' },
        { status: 500 }
      );
    }

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json({
      schedule: {
        frequency: group.schedule_frequency,
        dayOfWeek: group.schedule_day_of_week,
        dayOfMonth: group.schedule_day_of_month,
        hour: group.schedule_hour,
        nextScheduledAt: group.next_scheduled_at,
        lastScheduledRunAt: group.last_scheduled_run_at,
        isEnabled: group.is_enabled,
      },
    });
  } catch (error) {
    console.error('❌ [RankTracking] Schedule GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/rank-tracking/groups/[id]/schedule
 * Update schedule settings for a group.
 *
 * Body:
 * - frequency: 'daily' | 'weekly' | 'monthly' | null
 * - dayOfWeek: number (0-6, for weekly)
 * - dayOfMonth: number (1-28, for monthly)
 * - hour: number (0-23)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Verify group belongs to this account
    const { data: existing } = await serviceSupabase
      .from('rank_keyword_groups')
      .select('id')
      .eq('id', groupId)
      .eq('account_id', accountId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const body = await request.json();
    const { frequency, dayOfWeek, dayOfMonth, hour } = body;

    // Validate frequency
    if (frequency !== null && !['daily', 'weekly', 'monthly'].includes(frequency)) {
      return NextResponse.json(
        { error: 'frequency must be "daily", "weekly", "monthly", or null' },
        { status: 400 }
      );
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    updates.schedule_frequency = frequency;

    if (dayOfWeek !== undefined) {
      if (dayOfWeek !== null && (dayOfWeek < 0 || dayOfWeek > 6)) {
        return NextResponse.json(
          { error: 'dayOfWeek must be between 0 and 6' },
          { status: 400 }
        );
      }
      updates.schedule_day_of_week = dayOfWeek;
    }

    if (dayOfMonth !== undefined) {
      if (dayOfMonth !== null && (dayOfMonth < 1 || dayOfMonth > 28)) {
        return NextResponse.json(
          { error: 'dayOfMonth must be between 1 and 28' },
          { status: 400 }
        );
      }
      updates.schedule_day_of_month = dayOfMonth;
    }

    if (hour !== undefined) {
      if (hour < 0 || hour > 23) {
        return NextResponse.json(
          { error: 'hour must be between 0 and 23' },
          { status: 400 }
        );
      }
      updates.schedule_hour = hour;
    }

    // Calculate next scheduled time if frequency is being set
    if (frequency) {
      const now = new Date();
      const targetHour = hour ?? 9;

      if (frequency === 'daily') {
        const next = new Date(now);
        next.setHours(targetHour, 0, 0, 0);
        if (next <= now) {
          next.setDate(next.getDate() + 1);
        }
        updates.next_scheduled_at = next.toISOString();
      } else if (frequency === 'weekly') {
        const targetDay = dayOfWeek ?? 1; // Monday default
        const next = new Date(now);
        next.setHours(targetHour, 0, 0, 0);
        const daysUntilTarget = (targetDay - next.getDay() + 7) % 7;
        next.setDate(next.getDate() + (daysUntilTarget || 7));
        updates.next_scheduled_at = next.toISOString();
      } else if (frequency === 'monthly') {
        const targetDay = dayOfMonth ?? 1;
        const next = new Date(now);
        next.setHours(targetHour, 0, 0, 0);
        next.setDate(targetDay);
        if (next <= now) {
          next.setMonth(next.getMonth() + 1);
        }
        updates.next_scheduled_at = next.toISOString();
      }
    } else {
      updates.next_scheduled_at = null;
    }

    // Update group
    const { data: group, error: updateError } = await serviceSupabase
      .from('rank_keyword_groups')
      .update(updates)
      .eq('id', groupId)
      .eq('account_id', accountId)
      .select(`
        id,
        name,
        schedule_frequency,
        schedule_day_of_week,
        schedule_day_of_month,
        schedule_hour,
        next_scheduled_at,
        last_scheduled_run_at,
        is_enabled
      `)
      .single();

    if (updateError) {
      console.error('❌ [RankTracking] Failed to update schedule:', updateError);
      return NextResponse.json(
        { error: 'Failed to update schedule' },
        { status: 500 }
      );
    }

    console.log(`✅ [RankTracking] Updated schedule for group: ${group.name} (${groupId})`);

    return NextResponse.json({
      schedule: {
        frequency: group.schedule_frequency,
        dayOfWeek: group.schedule_day_of_week,
        dayOfMonth: group.schedule_day_of_month,
        hour: group.schedule_hour,
        nextScheduledAt: group.next_scheduled_at,
        lastScheduledRunAt: group.last_scheduled_run_at,
        isEnabled: group.is_enabled,
      },
      updated: true,
    });
  } catch (error) {
    console.error('❌ [RankTracking] Schedule PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
