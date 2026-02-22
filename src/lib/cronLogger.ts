import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CronResult {
  success: boolean;
  summary?: Record<string, unknown>;
  error?: string;
}

/**
 * Creates a log entry for a cron job execution
 */
async function createLogEntry(jobName: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('cron_execution_logs')
      .insert({
        job_name: jobName,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[CronLogger] Failed to create log entry:', error);
      return null;
    }

    return data.id;
  } catch (err) {
    console.error('[CronLogger] Error creating log entry:', err);
    return null;
  }
}

/**
 * Updates a log entry with the final status
 */
async function updateLogEntry(
  logId: string | null,
  update: {
    status: 'success' | 'error';
    duration_ms: number;
    summary?: Record<string, unknown>;
    error_message?: string;
  }
): Promise<void> {
  if (!logId) return;

  try {
    const { error } = await supabaseAdmin
      .from('cron_execution_logs')
      .update({
        status: update.status,
        duration_ms: update.duration_ms,
        completed_at: new Date().toISOString(),
        summary: update.summary || null,
        error_message: update.error_message || null,
      })
      .eq('id', logId);

    if (error) {
      console.error('[CronLogger] Failed to update log entry:', error);
    }
  } catch (err) {
    console.error('[CronLogger] Error updating log entry:', err);
  }
}

/**
 * Wraps a cron job execution with automatic logging.
 *
 * Usage:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   // Auth check first
 *   const authHeader = request.headers.get('authorization');
 *   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *
 *   return logCronExecution('job-name', async () => {
 *     // Your cron job logic here
 *     return { success: true, summary: { processed: 10 } };
 *   });
 * }
 * ```
 */
export async function logCronExecution(
  jobName: string,
  executionFn: () => Promise<CronResult>
): Promise<NextResponse> {
  const startTime = Date.now();
  const logId = await createLogEntry(jobName);

  try {
    const result = await executionFn();
    const durationMs = Date.now() - startTime;

    await updateLogEntry(logId, {
      status: result.success ? 'success' : 'error',
      duration_ms: durationMs,
      summary: result.summary,
      error_message: result.error,
    });

    return NextResponse.json({
      success: result.success,
      duration_ms: durationMs,
      summary: result.summary,
      ...(result.error && { error: result.error }),
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await updateLogEntry(logId, {
      status: 'error',
      duration_ms: durationMs,
      error_message: errorMessage,
    });

    console.error(`[CronLogger] ${jobName} failed:`, error);

    return NextResponse.json(
      { success: false, error: errorMessage, duration_ms: durationMs },
      { status: 500 }
    );
  }
}

/**
 * Checks if a cron job has already completed successfully today.
 * Use this as an idempotency guard to prevent double-execution.
 *
 * @param jobName - The cron job name (must match what's passed to logCronExecution)
 * @returns true if the job already ran successfully today (UTC), false otherwise
 */
export async function hasCompletedToday(jobName: string): Promise<boolean> {
  try {
    const todayUTC = new Date().toISOString().split('T')[0];
    const { data } = await supabaseAdmin
      .from('cron_execution_logs')
      .select('id')
      .eq('job_name', jobName)
      .eq('status', 'success')
      .gte('started_at', `${todayUTC}T00:00:00Z`)
      .limit(1);

    return (data?.length ?? 0) > 0;
  } catch (err) {
    console.error(`[CronLogger] Error checking idempotency for ${jobName}:`, err);
    // On error, allow the job to run (fail open)
    return false;
  }
}

/**
 * Checks if a cron job has already completed successfully this month.
 * Use for monthly cron jobs.
 *
 * @param jobName - The cron job name
 * @returns true if the job already ran successfully this month (UTC)
 */
export async function hasCompletedThisMonth(jobName: string): Promise<boolean> {
  try {
    const now = new Date();
    const firstOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const { data } = await supabaseAdmin
      .from('cron_execution_logs')
      .select('id')
      .eq('job_name', jobName)
      .eq('status', 'success')
      .gte('started_at', firstOfMonth.toISOString())
      .limit(1);

    return (data?.length ?? 0) > 0;
  } catch (err) {
    console.error(`[CronLogger] Error checking monthly idempotency for ${jobName}:`, err);
    return false;
  }
}

/**
 * Checks if a cron job has already completed successfully this hour.
 * Use for hourly cron jobs.
 *
 * @param jobName - The cron job name
 * @returns true if the job already ran successfully this hour (UTC)
 */
export async function hasCompletedThisHour(jobName: string): Promise<boolean> {
  try {
    const now = new Date();
    const startOfHour = new Date(Date.UTC(
      now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours()
    ));
    const { data } = await supabaseAdmin
      .from('cron_execution_logs')
      .select('id')
      .eq('job_name', jobName)
      .eq('status', 'success')
      .gte('started_at', startOfHour.toISOString())
      .limit(1);

    return (data?.length ?? 0) > 0;
  } catch (err) {
    console.error(`[CronLogger] Error checking hourly idempotency for ${jobName}:`, err);
    return false;
  }
}

/**
 * Returns true if the cron job should exit early to avoid Vercel timeout.
 * Call this inside loops to break before the 30s hard limit.
 *
 * @param startTime - Date.now() captured at the beginning of the handler
 * @param bufferMs - Safety buffer in ms (default 25000 = 25s, giving 5s buffer)
 * @returns true if the job should stop processing and return early
 */
export function shouldExitEarly(startTime: number, bufferMs: number = 25000): boolean {
  return Date.now() - startTime > bufferMs;
}

/**
 * Verifies the cron secret from the request header.
 * Returns null if valid, or a NextResponse error if invalid.
 */
export function verifyCronSecret(request: Request): NextResponse | null {
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET;

  if (!expectedToken) {
    console.error('[CronLogger] CRON_SECRET not configured');
    return NextResponse.json(
      { error: 'Cron secret not configured' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${expectedToken}`) {
    console.error('[CronLogger] Invalid cron authorization token');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return null;
}
