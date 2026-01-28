import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type HealthCheckStatus = 'ok' | 'error';

export interface HealthCheckEntry {
  status: HealthCheckStatus;
  message?: string;
}

export interface HealthCheckResult {
  healthy: boolean;
  checks: Record<string, HealthCheckEntry>;
}

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function checkSupabaseWithRetry(maxRetries = 3, delayMs = 1000): Promise<HealthCheckEntry> {
  const supabase = getSupabaseClient();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { error } = await supabase.from('articles').select('id').limit(1);
      if (error) {
        throw error;
      }
      return { status: 'ok' };
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries;
      const isNetworkError = error?.message?.includes('fetch failed') ||
                            error?.message?.includes('ECONNREFUSED') ||
                            error?.message?.includes('ETIMEDOUT');

      if (isLastAttempt || !isNetworkError) {
        return {
          status: 'error',
          message: `${error?.message || 'Failed to query Supabase'} (after ${attempt} attempt${attempt > 1 ? 's' : ''})`,
        };
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return { status: 'error', message: 'Unexpected error in retry loop' };
}

async function checkStuckBatches(): Promise<HealthCheckEntry & { stuckCount?: number; details?: string[] }> {
  const supabase = getSupabaseClient();
  const stuckThresholdMinutes = 15;
  const stuckThreshold = new Date(Date.now() - stuckThresholdMinutes * 60 * 1000).toISOString();

  const details: string[] = [];
  let totalStuck = 0;

  try {
    // Check rank batch runs
    const { data: rankStuck } = await supabase
      .from('rank_batch_runs')
      .select('id, account_id, processed_keywords, total_keywords, started_at')
      .eq('status', 'processing')
      .lt('started_at', stuckThreshold)
      .eq('processed_keywords', 0);

    if (rankStuck && rankStuck.length > 0) {
      totalStuck += rankStuck.length;
      details.push(`${rankStuck.length} stuck rank batch(es)`);
    }

    // Check LLM batch runs
    const { data: llmStuck } = await supabase
      .from('llm_batch_runs')
      .select('id, account_id, processed_questions, total_questions, started_at')
      .eq('status', 'processing')
      .lt('started_at', stuckThreshold)
      .eq('processed_questions', 0);

    if (llmStuck && llmStuck.length > 0) {
      totalStuck += llmStuck.length;
      details.push(`${llmStuck.length} stuck LLM batch(es)`);
    }

    // Check concept check runs
    const { data: conceptStuck } = await supabase
      .from('concept_check_runs')
      .select('id, account_id, started_at')
      .eq('status', 'processing')
      .lt('started_at', stuckThreshold);

    if (conceptStuck && conceptStuck.length > 0) {
      totalStuck += conceptStuck.length;
      details.push(`${conceptStuck.length} stuck concept check(s)`);
    }

    if (totalStuck > 0) {
      return {
        status: 'error',
        message: `${totalStuck} stuck batch run(s): ${details.join(', ')}`,
        stuckCount: totalStuck,
        details,
      };
    }

    return { status: 'ok' };
  } catch (error: any) {
    return {
      status: 'error',
      message: `Failed to check batch status: ${error?.message}`,
    };
  }
}

export async function runHealthCheck(): Promise<HealthCheckResult> {
  const checks: Record<string, HealthCheckEntry> = {
    app: { status: 'ok' },
  };

  checks.supabase = await checkSupabaseWithRetry(3, 1000);
  checks.batches = await checkStuckBatches();

  const healthy = Object.values(checks).every((check) => check.status === 'ok');

  return { healthy, checks };
}

