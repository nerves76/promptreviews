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
