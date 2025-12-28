/**
 * Concept Schedule Override Manager
 *
 * Handles pausing and restoring individual schedules when
 * a concept-level schedule is enabled/disabled.
 *
 * When a concept schedule is enabled:
 * - Find existing LLM visibility schedules for the keyword
 * - Pause them (set is_enabled = false)
 * - Store their IDs for restoration
 *
 * When a concept schedule is disabled:
 * - Restore previously paused schedules (set is_enabled = true)
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { PausedSchedules } from '../utils/types';
import type { LLMProvider } from '@/features/llm-visibility/utils/types';

// ============================================
// Types
// ============================================

export interface ExistingLLMSchedule {
  id: string;
  keywordId: string;
  providers: LLMProvider[];
  isEnabled: boolean;
  scheduleFrequency: string | null;
  scheduleDayOfWeek: number | null;
  scheduleDayOfMonth: number | null;
  scheduleHour: number;
}

export interface ExistingScheduleInfo {
  llmSchedule: ExistingLLMSchedule | null;
}

// ============================================
// Find Existing Schedules
// ============================================

/**
 * Find existing individual schedules for a keyword
 *
 * Used to warn users about what will be paused and to
 * check if there are schedules to restore.
 */
export async function findExistingSchedules(
  supabase: SupabaseClient,
  accountId: string,
  keywordId: string
): Promise<ExistingScheduleInfo> {
  // Find LLM visibility schedule for this keyword
  const { data: llmSchedule } = await supabase
    .from('llm_visibility_schedules')
    .select(
      `
      id,
      keyword_id,
      providers,
      is_enabled,
      schedule_frequency,
      schedule_day_of_week,
      schedule_day_of_month,
      schedule_hour
    `
    )
    .eq('account_id', accountId)
    .eq('keyword_id', keywordId)
    .single();

  return {
    llmSchedule: llmSchedule
      ? {
          id: llmSchedule.id,
          keywordId: llmSchedule.keyword_id,
          providers: llmSchedule.providers as LLMProvider[],
          isEnabled: llmSchedule.is_enabled,
          scheduleFrequency: llmSchedule.schedule_frequency,
          scheduleDayOfWeek: llmSchedule.schedule_day_of_week,
          scheduleDayOfMonth: llmSchedule.schedule_day_of_month,
          scheduleHour: llmSchedule.schedule_hour,
        }
      : null,
  };
}

/**
 * Check if there are any active individual schedules that would be paused
 */
export async function hasActiveIndividualSchedules(
  supabase: SupabaseClient,
  accountId: string,
  keywordId: string
): Promise<boolean> {
  const existing = await findExistingSchedules(supabase, accountId, keywordId);
  return existing.llmSchedule?.isEnabled === true;
}

// ============================================
// Pause Schedules
// ============================================

/**
 * Pause existing individual schedules when enabling concept schedule
 *
 * @returns IDs of paused schedules for later restoration
 */
export async function pauseExistingSchedules(
  supabase: SupabaseClient,
  accountId: string,
  keywordId: string
): Promise<PausedSchedules> {
  const existing = await findExistingSchedules(supabase, accountId, keywordId);
  const result: PausedSchedules = {
    llmScheduleId: null,
  };

  // Pause LLM schedule if it exists and is enabled
  if (existing.llmSchedule?.isEnabled) {
    const { error } = await supabase
      .from('llm_visibility_schedules')
      .update({
        is_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.llmSchedule.id);

    if (!error) {
      result.llmScheduleId = existing.llmSchedule.id;
    } else {
      console.error('Failed to pause LLM schedule:', error);
    }
  }

  return result;
}

// ============================================
// Restore Schedules
// ============================================

/**
 * Restore previously paused schedules when disabling concept schedule
 */
export async function restorePausedSchedules(
  supabase: SupabaseClient,
  pausedSchedules: PausedSchedules
): Promise<void> {
  // Restore LLM schedule if it was paused
  if (pausedSchedules.llmScheduleId) {
    const { error } = await supabase
      .from('llm_visibility_schedules')
      .update({
        is_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pausedSchedules.llmScheduleId);

    if (error) {
      console.error('Failed to restore LLM schedule:', error);
    }
  }
}

/**
 * Restore paused schedules by concept schedule ID
 *
 * Used when deleting a concept schedule to restore any
 * individual schedules that were paused.
 */
export async function restorePausedSchedulesByConceptId(
  supabase: SupabaseClient,
  conceptScheduleId: string
): Promise<void> {
  // Get the concept schedule to find paused schedule IDs
  const { data: conceptSchedule } = await supabase
    .from('concept_schedules')
    .select('paused_llm_schedule_id')
    .eq('id', conceptScheduleId)
    .single();

  if (!conceptSchedule) return;

  const pausedSchedules: PausedSchedules = {
    llmScheduleId: conceptSchedule.paused_llm_schedule_id,
  };

  await restorePausedSchedules(supabase, pausedSchedules);
}

// ============================================
// Format for User Display
// ============================================

export interface PausedScheduleDisplay {
  type: 'llm';
  frequency: string;
  details: string;
}

/**
 * Format existing schedules for display in override warning modal
 */
export function formatSchedulesForDisplay(
  existing: ExistingScheduleInfo
): PausedScheduleDisplay[] {
  const displays: PausedScheduleDisplay[] = [];

  if (existing.llmSchedule?.isEnabled) {
    const schedule = existing.llmSchedule;
    const frequencyLabel = schedule.scheduleFrequency
      ? capitalize(schedule.scheduleFrequency)
      : 'Custom';

    let details = '';
    if (schedule.scheduleFrequency === 'weekly' && schedule.scheduleDayOfWeek !== null) {
      details = `${getDayName(schedule.scheduleDayOfWeek)}s at ${formatHour(schedule.scheduleHour)}`;
    } else if (schedule.scheduleFrequency === 'monthly' && schedule.scheduleDayOfMonth !== null) {
      details = `Day ${schedule.scheduleDayOfMonth} at ${formatHour(schedule.scheduleHour)}`;
    } else if (schedule.scheduleFrequency === 'daily') {
      details = `Daily at ${formatHour(schedule.scheduleHour)}`;
    } else {
      details = `${schedule.providers.length} provider${schedule.providers.length !== 1 ? 's' : ''}`;
    }

    displays.push({
      type: 'llm',
      frequency: frequencyLabel,
      details,
    });
  }

  return displays;
}

// ============================================
// Helpers
// ============================================

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek] || 'Unknown';
}

function formatHour(hour: number): string {
  if (hour === 0) return '12:00 AM';
  if (hour === 12) return '12:00 PM';
  if (hour < 12) return `${hour}:00 AM`;
  return `${hour - 12}:00 PM`;
}

// ============================================
// Exports
// ============================================

export const overrideManager = {
  findExistingSchedules,
  hasActiveIndividualSchedules,
  pauseExistingSchedules,
  restorePausedSchedules,
  restorePausedSchedulesByConceptId,
  formatSchedulesForDisplay,
};

export default overrideManager;
