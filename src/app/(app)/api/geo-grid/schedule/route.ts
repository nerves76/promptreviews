/**
 * Geo Grid Schedule API
 *
 * GET - Get current schedule settings
 * PUT - Update schedule settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { ScheduleFrequency } from '@/features/geo-grid/utils/types';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ScheduleUpdateBody {
  scheduleFrequency: ScheduleFrequency;
  scheduleDayOfWeek?: number | null;
  scheduleDayOfMonth?: number | null;
  scheduleHour?: number;
}

/**
 * GET /api/geo-grid/schedule
 * Get current schedule settings
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

    const { data: config, error } = await serviceSupabase
      .from('gg_configs')
      .select('schedule_frequency, schedule_day_of_week, schedule_day_of_month, schedule_hour, next_scheduled_at, last_scheduled_run_at')
      .eq('account_id', accountId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Failed to fetch schedule:', error);
      return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
    }

    return NextResponse.json({
      schedule: config ? {
        frequency: config.schedule_frequency,
        dayOfWeek: config.schedule_day_of_week,
        dayOfMonth: config.schedule_day_of_month,
        hour: config.schedule_hour ?? 9,
        nextScheduledAt: config.next_scheduled_at,
        lastScheduledRunAt: config.last_scheduled_run_at,
      } : null,
    });
  } catch (error) {
    console.error('Schedule GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/geo-grid/schedule
 * Update schedule settings
 */
export async function PUT(request: NextRequest) {
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

    const body: ScheduleUpdateBody = await request.json();

    // Validate frequency
    if (body.scheduleFrequency && !['daily', 'weekly', 'monthly'].includes(body.scheduleFrequency)) {
      return NextResponse.json({ error: 'Invalid schedule frequency' }, { status: 400 });
    }

    // Validate day of week (0-6)
    if (body.scheduleDayOfWeek !== null && body.scheduleDayOfWeek !== undefined) {
      if (body.scheduleDayOfWeek < 0 || body.scheduleDayOfWeek > 6) {
        return NextResponse.json({ error: 'Day of week must be 0-6' }, { status: 400 });
      }
    }

    // Validate day of month (1-28)
    if (body.scheduleDayOfMonth !== null && body.scheduleDayOfMonth !== undefined) {
      if (body.scheduleDayOfMonth < 1 || body.scheduleDayOfMonth > 28) {
        return NextResponse.json({ error: 'Day of month must be 1-28' }, { status: 400 });
      }
    }

    // Validate hour (0-23)
    if (body.scheduleHour !== undefined) {
      if (body.scheduleHour < 0 || body.scheduleHour > 23) {
        return NextResponse.json({ error: 'Hour must be 0-23' }, { status: 400 });
      }
    }

    // Build update object
    const updateData: Record<string, any> = {
      schedule_frequency: body.scheduleFrequency,
      schedule_hour: body.scheduleHour ?? 9,
      updated_at: new Date().toISOString(),
    };

    // Set day fields based on frequency
    if (body.scheduleFrequency === 'weekly') {
      updateData.schedule_day_of_week = body.scheduleDayOfWeek ?? 1; // Default to Monday
      updateData.schedule_day_of_month = null;
    } else if (body.scheduleFrequency === 'monthly') {
      updateData.schedule_day_of_week = null;
      updateData.schedule_day_of_month = body.scheduleDayOfMonth ?? 1; // Default to 1st
    } else {
      updateData.schedule_day_of_week = null;
      updateData.schedule_day_of_month = null;
    }

    // Update the config (trigger will calculate next_scheduled_at)
    const { data: config, error } = await serviceSupabase
      .from('gg_configs')
      .update(updateData)
      .eq('account_id', accountId)
      .select('schedule_frequency, schedule_day_of_week, schedule_day_of_month, schedule_hour, next_scheduled_at')
      .single();

    if (error) {
      console.error('Failed to update schedule:', error);
      return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      schedule: {
        frequency: config.schedule_frequency,
        dayOfWeek: config.schedule_day_of_week,
        dayOfMonth: config.schedule_day_of_month,
        hour: config.schedule_hour,
        nextScheduledAt: config.next_scheduled_at,
      },
    });
  } catch (error) {
    console.error('Schedule PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
