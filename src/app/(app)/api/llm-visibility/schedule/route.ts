import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import {
  LLMProvider,
  LLM_PROVIDERS,
  LLMVisibilitySchedule,
  LLMVisibilityScheduleRow,
} from '@/features/llm-visibility/utils/types';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Transform DB row to API response
function transformScheduleRow(row: LLMVisibilityScheduleRow): LLMVisibilitySchedule {
  return {
    id: row.id,
    accountId: row.account_id,
    keywordId: row.keyword_id,
    providers: row.providers,
    isEnabled: row.is_enabled,
    scheduleFrequency: row.schedule_frequency,
    scheduleDayOfWeek: row.schedule_day_of_week,
    scheduleDayOfMonth: row.schedule_day_of_month,
    scheduleHour: row.schedule_hour,
    nextScheduledAt: row.next_scheduled_at,
    lastScheduledRunAt: row.last_scheduled_run_at,
    lastCreditWarningSentAt: row.last_credit_warning_sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * GET /api/llm-visibility/schedule
 * Get schedule configuration for a keyword.
 *
 * Query params:
 * - keywordId: string (required)
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
    const keywordId = searchParams.get('keywordId');

    if (!keywordId) {
      return NextResponse.json(
        { error: 'Keyword ID is required' },
        { status: 400 }
      );
    }

    // Verify keyword belongs to account
    const { data: keyword, error: keywordError } = await serviceSupabase
      .from('keywords')
      .select('id')
      .eq('id', keywordId)
      .eq('account_id', accountId)
      .single();

    if (keywordError || !keyword) {
      return NextResponse.json(
        { error: 'Keyword not found' },
        { status: 404 }
      );
    }

    // Get schedule
    const { data: schedule, error: scheduleError } = await serviceSupabase
      .from('llm_visibility_schedules')
      .select('*')
      .eq('keyword_id', keywordId)
      .eq('account_id', accountId)
      .single();

    if (scheduleError && scheduleError.code !== 'PGRST116') {
      console.error('❌ [LLMVisibility] Error fetching schedule:', scheduleError);
      return NextResponse.json(
        { error: 'Failed to fetch schedule' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      schedule: schedule ? transformScheduleRow(schedule as LLMVisibilityScheduleRow) : null,
    });
  } catch (error) {
    console.error('❌ [LLMVisibility] Error in GET schedule:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/llm-visibility/schedule
 * Create or update schedule configuration for a keyword.
 *
 * Body:
 * - keywordId: string (required)
 * - providers?: LLMProvider[] (default: ['chatgpt'])
 * - scheduleFrequency?: 'daily' | 'weekly' | 'monthly' | null
 * - scheduleDayOfWeek?: number (0-6, for weekly)
 * - scheduleDayOfMonth?: number (1-28, for monthly)
 * - scheduleHour?: number (0-23)
 * - isEnabled?: boolean
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

    const body = await request.json();
    const {
      keywordId,
      providers,
      scheduleFrequency,
      scheduleDayOfWeek,
      scheduleDayOfMonth,
      scheduleHour,
      isEnabled,
    } = body;

    if (!keywordId) {
      return NextResponse.json(
        { error: 'Keyword ID is required' },
        { status: 400 }
      );
    }

    // Verify keyword belongs to account
    const { data: keyword, error: keywordError } = await serviceSupabase
      .from('keywords')
      .select('id')
      .eq('id', keywordId)
      .eq('account_id', accountId)
      .single();

    if (keywordError || !keyword) {
      return NextResponse.json(
        { error: 'Keyword not found' },
        { status: 404 }
      );
    }

    // Validate providers if provided
    if (providers) {
      const invalidProviders = providers.filter((p: string) => !LLM_PROVIDERS.includes(p as LLMProvider));
      if (invalidProviders.length > 0) {
        return NextResponse.json(
          { error: `Invalid providers: ${invalidProviders.join(', ')}. Must be one of: ${LLM_PROVIDERS.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validate schedule frequency
    if (scheduleFrequency && !['daily', 'weekly', 'monthly'].includes(scheduleFrequency)) {
      return NextResponse.json(
        { error: 'Invalid schedule frequency. Must be daily, weekly, or monthly' },
        { status: 400 }
      );
    }

    // Validate day of week (0-6)
    if (scheduleDayOfWeek !== undefined && (scheduleDayOfWeek < 0 || scheduleDayOfWeek > 6)) {
      return NextResponse.json(
        { error: 'Invalid day of week. Must be 0-6 (Sunday-Saturday)' },
        { status: 400 }
      );
    }

    // Validate day of month (1-28)
    if (scheduleDayOfMonth !== undefined && (scheduleDayOfMonth < 1 || scheduleDayOfMonth > 28)) {
      return NextResponse.json(
        { error: 'Invalid day of month. Must be 1-28' },
        { status: 400 }
      );
    }

    // Validate hour (0-23)
    if (scheduleHour !== undefined && (scheduleHour < 0 || scheduleHour > 23)) {
      return NextResponse.json(
        { error: 'Invalid hour. Must be 0-23' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: Record<string, any> = {
      account_id: accountId,
      keyword_id: keywordId,
    };

    if (providers !== undefined) {
      updateData.providers = providers;
    }
    if (scheduleFrequency !== undefined) {
      updateData.schedule_frequency = scheduleFrequency;
    }
    if (scheduleDayOfWeek !== undefined) {
      updateData.schedule_day_of_week = scheduleDayOfWeek;
    }
    if (scheduleDayOfMonth !== undefined) {
      updateData.schedule_day_of_month = scheduleDayOfMonth;
    }
    if (scheduleHour !== undefined) {
      updateData.schedule_hour = scheduleHour;
    }
    if (isEnabled !== undefined) {
      updateData.is_enabled = isEnabled;
    }

    // Upsert schedule
    const { data: schedule, error: upsertError } = await serviceSupabase
      .from('llm_visibility_schedules')
      .upsert(updateData, {
        onConflict: 'account_id,keyword_id',
      })
      .select()
      .single();

    if (upsertError) {
      console.error('❌ [LLMVisibility] Error upserting schedule:', upsertError);
      return NextResponse.json(
        { error: 'Failed to save schedule' },
        { status: 500 }
      );
    }

    console.log(`📅 [LLMVisibility] Schedule updated for keyword ${keywordId}`);

    return NextResponse.json({
      schedule: transformScheduleRow(schedule as LLMVisibilityScheduleRow),
    });
  } catch (error) {
    console.error('❌ [LLMVisibility] Error in PUT schedule:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/llm-visibility/schedule
 * Delete schedule configuration for a keyword.
 *
 * Query params:
 * - keywordId: string (required)
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
    const keywordId = searchParams.get('keywordId');

    if (!keywordId) {
      return NextResponse.json(
        { error: 'Keyword ID is required' },
        { status: 400 }
      );
    }

    // Delete schedule
    const { error: deleteError } = await serviceSupabase
      .from('llm_visibility_schedules')
      .delete()
      .eq('keyword_id', keywordId)
      .eq('account_id', accountId);

    if (deleteError) {
      console.error('❌ [LLMVisibility] Error deleting schedule:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete schedule' },
        { status: 500 }
      );
    }

    console.log(`🗑️ [LLMVisibility] Schedule deleted for keyword ${keywordId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ [LLMVisibility] Error in DELETE schedule:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
