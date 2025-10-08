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

export async function runHealthCheck(): Promise<HealthCheckResult> {
  const checks: Record<string, HealthCheckEntry> = {
    app: { status: 'ok' },
  };

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('articles').select('id').limit(1);
    if (error) {
      throw error;
    }
    checks.supabase = { status: 'ok' };
  } catch (error: any) {
    checks.supabase = {
      status: 'error',
      message: error?.message || 'Failed to query Supabase',
    };
  }

  const healthy = Object.values(checks).every((check) => check.status === 'ok');

  return { healthy, checks };
}

