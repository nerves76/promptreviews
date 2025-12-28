/**
 * Concept Schedule Cost Preview API
 *
 * Returns cost breakdown for a concept schedule without creating it.
 * Also checks for existing individual schedules that would be paused.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { calculateConceptScheduleCost } from '@/features/concept-schedule/services/credits';
import {
  findExistingSchedules,
  formatSchedulesForDisplay,
} from '@/features/concept-schedule/services/override-manager';
import type { LLMProvider } from '@/features/llm-visibility/utils/types';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/concept-schedule/cost-preview
 * Calculate cost breakdown for a concept schedule configuration.
 *
 * Body:
 * - keywordId: string (required)
 * - searchRankEnabled: boolean
 * - geoGridEnabled: boolean
 * - llmVisibilityEnabled: boolean
 * - llmProviders: LLMProvider[]
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
      searchRankEnabled = true,
      geoGridEnabled = true,
      llmVisibilityEnabled = true,
      llmProviders = ['chatgpt', 'claude', 'gemini', 'perplexity'],
      reviewMatchingEnabled = false,
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
      .select('id, name, search_terms, related_questions')
      .eq('id', keywordId)
      .eq('account_id', accountId)
      .single();

    if (keywordError || !keyword) {
      return NextResponse.json(
        { error: 'Keyword not found' },
        { status: 404 }
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
        reviewMatchingEnabled,
      }
    );

    // Check for existing individual schedules
    const existingSchedules = await findExistingSchedules(
      serviceSupabase,
      accountId,
      keywordId
    );

    // Check if concept schedule already exists
    const { data: existingConceptSchedule } = await serviceSupabase
      .from('concept_schedules')
      .select('id')
      .eq('keyword_id', keywordId)
      .eq('account_id', accountId)
      .single();

    // Format for display
    const schedulesToPause = formatSchedulesForDisplay(existingSchedules);

    return NextResponse.json({
      costBreakdown,
      keyword: {
        id: keyword.id,
        name: keyword.name,
        searchTermCount: Array.isArray(keyword.search_terms) ? keyword.search_terms.length : 0,
        questionCount: Array.isArray(keyword.related_questions) ? keyword.related_questions.length : 0,
      },
      hasExistingConceptSchedule: !!existingConceptSchedule,
      hasExistingIndividualSchedules: schedulesToPause.length > 0,
      schedulesToPause,
      existingSchedules: existingSchedules.llmSchedule
        ? {
            llmSchedule: {
              id: existingSchedules.llmSchedule.id,
              frequency: existingSchedules.llmSchedule.scheduleFrequency,
              providers: existingSchedules.llmSchedule.providers,
              isEnabled: existingSchedules.llmSchedule.isEnabled,
            },
          }
        : null,
    });
  } catch (error) {
    console.error('❌ [ConceptSchedule] Error in cost-preview:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
