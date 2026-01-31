/**
 * Batch Completion Stats
 *
 * Computes improved/declined/unchanged stats by comparing the latest batch run
 * results with previous results for rank tracking, LLM visibility, and geo-grid.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface BatchCompletionStats {
  feature: 'rank_tracking' | 'llm_visibility' | 'geo_grid';
  totalChecked: number;
  improved: number;
  declined: number;
  unchanged: number;
  newEntries: number;
  successfulChecks: number;
  failedChecks: number;
}

/**
 * Compute stats for a completed rank tracking batch run.
 *
 * Compares desktop positions for each keyword: lower position = improved.
 * Position = null means not found (treated as 101 for comparison).
 */
export async function computeRankBatchStats(
  supabase: SupabaseClient,
  runId: string,
  accountId: string
): Promise<BatchCompletionStats> {
  // Get keyword IDs from this batch run
  const { data: items } = await supabase
    .from('rank_batch_run_items')
    .select('keyword_id, desktop_status, mobile_status')
    .eq('batch_run_id', runId);

  if (!items || items.length === 0) {
    return {
      feature: 'rank_tracking',
      totalChecked: 0, improved: 0, declined: 0,
      unchanged: 0, newEntries: 0, successfulChecks: 0, failedChecks: 0,
    };
  }

  const successfulItems = items.filter(
    i => i.desktop_status === 'completed' && i.mobile_status === 'completed'
  );
  const failedItems = items.filter(
    i => i.desktop_status === 'failed' || i.mobile_status === 'failed'
  );

  let improved = 0;
  let declined = 0;
  let unchanged = 0;
  let newEntries = 0;

  // For each keyword, get the latest 2 desktop rank checks
  for (const item of successfulItems) {
    const { data: checks } = await supabase
      .from('rank_checks')
      .select('position, checked_at')
      .eq('account_id', accountId)
      .eq('keyword_id', item.keyword_id)
      .eq('device', 'desktop')
      .order('checked_at', { ascending: false })
      .limit(2);

    if (!checks || checks.length === 0) {
      newEntries++;
      continue;
    }

    if (checks.length === 1) {
      // First-ever check for this keyword
      newEntries++;
      continue;
    }

    const currentPos = checks[0].position ?? 101;
    const previousPos = checks[1].position ?? 101;

    if (currentPos < previousPos) {
      improved++;
    } else if (currentPos > previousPos) {
      declined++;
    } else {
      unchanged++;
    }
  }

  return {
    feature: 'rank_tracking',
    totalChecked: items.length,
    improved,
    declined,
    unchanged,
    newEntries,
    successfulChecks: successfulItems.length,
    failedChecks: failedItems.length,
  };
}

/**
 * Compute stats for a completed LLM visibility batch run.
 *
 * For each keyword×provider, compares domain_cited:
 *   false→true = improved, true→false = declined.
 */
export async function computeLlmBatchStats(
  supabase: SupabaseClient,
  runId: string,
  accountId: string
): Promise<BatchCompletionStats> {
  // Get items from this batch run
  const { data: items } = await supabase
    .from('llm_batch_run_items')
    .select('keyword_id, status')
    .eq('batch_run_id', runId);

  if (!items || items.length === 0) {
    return {
      feature: 'llm_visibility',
      totalChecked: 0, improved: 0, declined: 0,
      unchanged: 0, newEntries: 0, successfulChecks: 0, failedChecks: 0,
    };
  }

  const successfulItems = items.filter(i => i.status === 'completed');
  const failedItems = items.filter(i => i.status === 'failed');

  // Get the providers used in this batch run
  const { data: batchRun } = await supabase
    .from('llm_batch_runs')
    .select('providers')
    .eq('id', runId)
    .single();

  const providers: string[] = batchRun?.providers || [];

  let improved = 0;
  let declined = 0;
  let unchanged = 0;
  let newEntries = 0;

  // Deduplicate keyword_ids (multiple questions per keyword)
  const uniqueKeywordIds = [...new Set(successfulItems.map(i => i.keyword_id))];

  for (const keywordId of uniqueKeywordIds) {
    for (const provider of providers) {
      // Get the latest 2 checks for this keyword×provider
      const { data: checks } = await supabase
        .from('llm_visibility_checks')
        .select('domain_cited, checked_at')
        .eq('account_id', accountId)
        .eq('keyword_id', keywordId)
        .eq('llm_provider', provider)
        .order('checked_at', { ascending: false })
        .limit(2);

      if (!checks || checks.length === 0) {
        newEntries++;
        continue;
      }

      if (checks.length === 1) {
        newEntries++;
        continue;
      }

      const currentCited = checks[0].domain_cited;
      const previousCited = checks[1].domain_cited;

      if (!previousCited && currentCited) {
        improved++;
      } else if (previousCited && !currentCited) {
        declined++;
      } else {
        unchanged++;
      }
    }
  }

  const totalComparisons = improved + declined + unchanged + newEntries;

  return {
    feature: 'llm_visibility',
    totalChecked: totalComparisons || items.length,
    improved,
    declined,
    unchanged,
    newEntries,
    successfulChecks: successfulItems.length,
    failedChecks: failedItems.length,
  };
}

/**
 * Compute stats for a geo-grid run for a single config.
 *
 * Compares average position across grid points per keyword.
 * Lower average position = improved.
 */
export async function computeGeoGridStats(
  supabase: SupabaseClient,
  accountId: string,
  configId: string,
  keywordIds: string[],
  checkedAfter: string
): Promise<BatchCompletionStats> {
  if (!keywordIds || keywordIds.length === 0) {
    return {
      feature: 'geo_grid',
      totalChecked: 0, improved: 0, declined: 0,
      unchanged: 0, newEntries: 0, successfulChecks: 0, failedChecks: 0,
    };
  }

  let improved = 0;
  let declined = 0;
  let unchanged = 0;
  let newEntries = 0;
  let successfulChecks = 0;

  for (const keywordId of keywordIds) {
    // Get checks from this run (after checkedAfter)
    const { data: currentChecks } = await supabase
      .from('gg_checks')
      .select('position')
      .eq('account_id', accountId)
      .eq('config_id', configId)
      .eq('keyword_id', keywordId)
      .gte('checked_at', checkedAfter);

    if (!currentChecks || currentChecks.length === 0) {
      continue;
    }

    successfulChecks += currentChecks.length;

    // Calculate current average position (null positions treated as 21 = not found)
    const currentPositions = currentChecks.map(c => c.position ?? 21);
    const currentAvg = currentPositions.reduce((a, b) => a + b, 0) / currentPositions.length;

    // Get the most recent check before this run for comparison
    const { data: previousChecks } = await supabase
      .from('gg_checks')
      .select('position, checked_at')
      .eq('account_id', accountId)
      .eq('config_id', configId)
      .eq('keyword_id', keywordId)
      .lt('checked_at', checkedAfter)
      .order('checked_at', { ascending: false })
      .limit(currentChecks.length); // Same number of grid points

    if (!previousChecks || previousChecks.length === 0) {
      newEntries++;
      continue;
    }

    const previousPositions = previousChecks.map(c => c.position ?? 21);
    const previousAvg = previousPositions.reduce((a, b) => a + b, 0) / previousPositions.length;

    // Compare averages (lower = better)
    const diff = previousAvg - currentAvg;
    if (diff > 0.1) {
      improved++;
    } else if (diff < -0.1) {
      declined++;
    } else {
      unchanged++;
    }
  }

  return {
    feature: 'geo_grid',
    totalChecked: keywordIds.length,
    improved,
    declined,
    unchanged,
    newEntries,
    successfulChecks,
    failedChecks: 0,
  };
}

/**
 * Merge two BatchCompletionStats objects together (for aggregating geo-grid results).
 */
export function mergeBatchStats(
  a: BatchCompletionStats,
  b: BatchCompletionStats
): BatchCompletionStats {
  return {
    feature: a.feature,
    totalChecked: a.totalChecked + b.totalChecked,
    improved: a.improved + b.improved,
    declined: a.declined + b.declined,
    unchanged: a.unchanged + b.unchanged,
    newEntries: a.newEntries + b.newEntries,
    successfulChecks: a.successfulChecks + b.successfulChecks,
    failedChecks: a.failedChecks + b.failedChecks,
  };
}
