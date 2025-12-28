/**
 * Concept Schedule API
 *
 * Endpoints for managing concept-level schedules that combine
 * search rank tracking, geo-grid checks, and LLM visibility checks.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import {
  calculateConceptScheduleCost,
} from '@/features/concept-schedule/services/credits';
import {
  pauseExistingSchedules,
  restorePausedSchedulesByConceptId,
  findExistingSchedules,
} from '@/features/concept-schedule/services/override-manager';
import {
  transformConceptScheduleRow,
  type ConceptScheduleRow,
  type ScheduleFrequency,
} from '@/features/concept-schedule/utils/types';
import { LLM_PROVIDERS, type LLMProvider } from '@/features/llm-visibility/utils/types';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/concept-schedule
 * Get concept schedule for a keyword.
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
      .from('concept_schedules')
      .select('*')
      .eq('keyword_id', keywordId)
      .eq('account_id', accountId)
      .single();

    if (scheduleError && scheduleError.code !== 'PGRST116') {
      console.error('❌ [ConceptSchedule] Error fetching schedule:', scheduleError);
      return NextResponse.json(
        { error: 'Failed to fetch schedule' },
        { status: 500 }
      );
    }

    if (!schedule) {
      return NextResponse.json({ schedule: null });
    }

    // Calculate current cost breakdown
    const costBreakdown = await calculateConceptScheduleCost(
      serviceSupabase,
      accountId,
      keywordId,
      {
        searchRankEnabled: schedule.search_rank_enabled,
        geoGridEnabled: schedule.geo_grid_enabled,
        llmVisibilityEnabled: schedule.llm_visibility_enabled,
        llmProviders: schedule.llm_providers as LLMProvider[],
      }
    );

    return NextResponse.json({
      schedule: transformConceptScheduleRow(schedule as ConceptScheduleRow),
      costBreakdown,
    });
  } catch (error) {
    console.error('❌ [ConceptSchedule] Error in GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/concept-schedule
 * Create or update concept schedule for a keyword.
 *
 * Body:
 * - keywordId: string (required)
 * - scheduleFrequency: 'daily' | 'weekly' | 'monthly' | null
 * - scheduleDayOfWeek?: number (0-6, for weekly)
 * - scheduleDayOfMonth?: number (1-28, for monthly)
 * - scheduleHour?: number (0-23)
 * - searchRankEnabled?: boolean
 * - geoGridEnabled?: boolean
 * - llmVisibilityEnabled?: boolean
 * - llmProviders?: LLMProvider[]
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
      keywordId,
      scheduleFrequency,
      scheduleDayOfWeek,
      scheduleDayOfMonth,
      scheduleHour = 9,
      searchRankEnabled = true,
      geoGridEnabled = true,
      llmVisibilityEnabled = true,
      llmProviders = ['chatgpt', 'claude', 'gemini', 'perplexity'],
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

    // Validate providers
    if (llmProviders) {
      const invalidProviders = llmProviders.filter(
        (p: string) => !LLM_PROVIDERS.includes(p as LLMProvider)
      );
      if (invalidProviders.length > 0) {
        return NextResponse.json(
          { error: `Invalid providers: ${invalidProviders.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validate schedule frequency
    if (scheduleFrequency && !['daily', 'weekly', 'monthly'].includes(scheduleFrequency)) {
      return NextResponse.json(
        { error: 'Invalid schedule frequency' },
        { status: 400 }
      );
    }

    // Validate day of week
    if (scheduleDayOfWeek !== undefined && (scheduleDayOfWeek < 0 || scheduleDayOfWeek > 6)) {
      return NextResponse.json(
        { error: 'Invalid day of week (must be 0-6)' },
        { status: 400 }
      );
    }

    // Validate day of month
    if (scheduleDayOfMonth !== undefined && (scheduleDayOfMonth < 1 || scheduleDayOfMonth > 28)) {
      return NextResponse.json(
        { error: 'Invalid day of month (must be 1-28)' },
        { status: 400 }
      );
    }

    // Validate hour
    if (scheduleHour < 0 || scheduleHour > 23) {
      return NextResponse.json(
        { error: 'Invalid hour (must be 0-23)' },
        { status: 400 }
      );
    }

    // Check if schedule already exists
    const { data: existingSchedule } = await serviceSupabase
      .from('concept_schedules')
      .select('id, paused_llm_schedule_id')
      .eq('keyword_id', keywordId)
      .eq('account_id', accountId)
      .single();

    // Pause existing individual schedules (only for new concept schedules)
    let pausedSchedules = { llmScheduleId: null as string | null };
    if (!existingSchedule) {
      pausedSchedules = await pauseExistingSchedules(
        serviceSupabase,
        accountId,
        keywordId
      );
    }

    // Calculate cost breakdown
    const costBreakdown = await calculateConceptScheduleCost(
      serviceSupabase,
      accountId,
      keywordId,
      {
        searchRankEnabled,
        geoGridEnabled,
        llmVisibilityEnabled,
        llmProviders: llmProviders as LLMProvider[],
      }
    );

    // Build upsert data
    const scheduleData = {
      account_id: accountId,
      keyword_id: keywordId,
      schedule_frequency: scheduleFrequency as ScheduleFrequency | null,
      schedule_day_of_week: scheduleDayOfWeek ?? null,
      schedule_day_of_month: scheduleDayOfMonth ?? null,
      schedule_hour: scheduleHour,
      search_rank_enabled: searchRankEnabled,
      geo_grid_enabled: geoGridEnabled,
      llm_visibility_enabled: llmVisibilityEnabled,
      llm_providers: llmProviders,
      estimated_credits: costBreakdown.total,
      is_enabled: true,
      paused_llm_schedule_id: existingSchedule
        ? existingSchedule.paused_llm_schedule_id
        : pausedSchedules.llmScheduleId,
    };

    // Upsert schedule
    const { data: schedule, error: upsertError } = await serviceSupabase
      .from('concept_schedules')
      .upsert(scheduleData, {
        onConflict: 'account_id,keyword_id',
      })
      .select()
      .single();

    if (upsertError) {
      console.error('❌ [ConceptSchedule] Error upserting schedule:', upsertError);
      return NextResponse.json(
        { error: 'Failed to save schedule' },
        { status: 500 }
      );
    }

    console.log(`📅 [ConceptSchedule] Schedule saved for keyword ${keywordId}`);

    return NextResponse.json({
      schedule: transformConceptScheduleRow(schedule as ConceptScheduleRow),
      costBreakdown,
      pausedSchedules: !existingSchedule ? pausedSchedules : undefined,
    });
  } catch (error) {
    console.error('❌ [ConceptSchedule] Error in POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/concept-schedule
 * Delete concept schedule and restore paused individual schedules.
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

    // Get schedule to find paused schedule IDs before deleting
    const { data: schedule } = await serviceSupabase
      .from('concept_schedules')
      .select('id, paused_llm_schedule_id')
      .eq('keyword_id', keywordId)
      .eq('account_id', accountId)
      .single();

    if (schedule) {
      // Restore paused individual schedules
      await restorePausedSchedulesByConceptId(serviceSupabase, schedule.id);

      // Delete the concept schedule
      const { error: deleteError } = await serviceSupabase
        .from('concept_schedules')
        .delete()
        .eq('id', schedule.id);

      if (deleteError) {
        console.error('❌ [ConceptSchedule] Error deleting schedule:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete schedule' },
          { status: 500 }
        );
      }

      console.log(`🗑️ [ConceptSchedule] Schedule deleted for keyword ${keywordId}`);
    }

    return NextResponse.json({
      success: true,
      restoredSchedules: schedule?.paused_llm_schedule_id ? { llmScheduleId: schedule.paused_llm_schedule_id } : null,
    });
  } catch (error) {
    console.error('❌ [ConceptSchedule] Error in DELETE:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
