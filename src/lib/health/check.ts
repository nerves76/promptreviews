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

export async function runHealthCheck(): Promise<HealthCheckResult> {
  const checks: Record<string, HealthCheckEntry> = {
    app: { status: 'ok' },
  };

  checks.supabase = await checkSupabaseWithRetry(3, 1000);

  const healthy = Object.values(checks).every((check) => check.status === 'ok');

  return { healthy, checks };
}

