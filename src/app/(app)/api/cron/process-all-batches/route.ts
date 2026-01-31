/**
 * Cron Job: Process All Batch Runs
 *
 * Combined batch processor that handles LLM, Rank, Concept, and Analysis batch runs.
 * This consolidates multiple cron jobs into one to stay within Vercel's
 * 20 cron job limit.
 *
 * Runs every minute. All batch types are dispatched in PARALLEL (fire-and-forget)
 * so each processor gets its own full 5-minute serverless timeout and they don't
 * block each other.
 */

import { NextRequest } from 'next/server';
import { logCronExecution, verifyCronSecret } from '@/lib/cronLogger';

// This route just dispatches — it doesn't need a long timeout itself
export const maxDuration = 30; // 30 seconds is plenty for dispatching

// Helper to fire off an internal API endpoint without waiting for its full response.
// We use a short timeout so this dispatcher finishes quickly. The called endpoints
// are their own serverless functions with their own 5-minute timeouts.
async function fireInternalEndpoint(path: string, cronSecret: string): Promise<{ success: boolean; message: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.promptreviews.app';

  try {
    const controller = new AbortController();
    // Wait up to 5 seconds for the response. If the endpoint takes longer,
    // it's still running in its own serverless function — we just won't
    // get the result. That's fine; the cron logger on the endpoint itself
    // captures the outcome.
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${baseUrl}${path}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    return {
      success: response.ok,
      message: data.message || data.error || 'OK',
    };
  } catch (error) {
    // AbortError means we timed out waiting — that's fine, the endpoint is
    // still running in its own process.
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: true,
        message: 'Dispatched (running in background)',
      };
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function GET(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  return logCronExecution('process-all-batches', async () => {
    const cronSecret = process.env.CRON_SECRET || '';

    // Dispatch ALL batch processors in parallel so they each get their
    // own serverless function and don't block each other.
    console.log('📋 [AllBatches] Dispatching all batch processors in parallel...');

    const [llmBatch, rankBatch, conceptChecks, analysisBatch] = await Promise.all([
      fireInternalEndpoint('/api/cron/process-llm-batch', cronSecret),
      fireInternalEndpoint('/api/cron/process-rank-batch', cronSecret),
      fireInternalEndpoint('/api/cron/process-concept-checks', cronSecret),
      fireInternalEndpoint('/api/cron/process-analysis-batch', cronSecret),
    ]);

    const results = { llmBatch, rankBatch, conceptChecks, analysisBatch };

    console.log(`📋 [AllBatches] LLM: ${llmBatch.message}`);
    console.log(`📋 [AllBatches] Rank: ${rankBatch.message}`);
    console.log(`📋 [AllBatches] Concept: ${conceptChecks.message}`);
    console.log(`📋 [AllBatches] Analysis: ${analysisBatch.message}`);

    const allSuccessful = Object.values(results).every(r => r.success);

    return {
      success: true,
      summary: {
        message: allSuccessful ? 'All batch processors dispatched successfully' : 'Some batch processors had issues',
        results,
      },
    };
  });
}
