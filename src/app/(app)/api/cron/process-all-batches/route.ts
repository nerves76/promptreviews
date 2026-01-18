/**
 * Cron Job: Process All Batch Runs
 *
 * Combined batch processor that handles LLM, Rank, Concept, and Analysis batch runs.
 * This consolidates multiple cron jobs into one to stay within Vercel's
 * 20 cron job limit.
 *
 * Runs every minute and processes each batch type sequentially.
 */

import { NextRequest } from 'next/server';
import { logCronExecution, verifyCronSecret } from '@/lib/cronLogger';

// Extend timeout for this route
export const maxDuration = 300; // 5 minutes

// Helper to call internal API endpoints
async function callInternalEndpoint(path: string, cronSecret: string): Promise<{ success: boolean; message: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.promptreviews.app';

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
      },
    });

    const data = await response.json();
    return {
      success: response.ok,
      message: data.message || data.error || 'Unknown response',
    };
  } catch (error) {
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
    const results: Record<string, { success: boolean; message: string }> = {};

    // Process LLM batch runs
    console.log('📋 [AllBatches] Processing LLM batch runs...');
    results.llmBatch = await callInternalEndpoint('/api/cron/process-llm-batch', cronSecret);
    console.log(`📋 [AllBatches] LLM batch: ${results.llmBatch.success ? 'success' : 'failed'} - ${results.llmBatch.message}`);

    // Process Rank batch runs
    console.log('📋 [AllBatches] Processing Rank batch runs...');
    results.rankBatch = await callInternalEndpoint('/api/cron/process-rank-batch', cronSecret);
    console.log(`📋 [AllBatches] Rank batch: ${results.rankBatch.success ? 'success' : 'failed'} - ${results.rankBatch.message}`);

    // Process Concept check runs
    console.log('📋 [AllBatches] Processing Concept check runs...');
    results.conceptChecks = await callInternalEndpoint('/api/cron/process-concept-checks', cronSecret);
    console.log(`📋 [AllBatches] Concept checks: ${results.conceptChecks.success ? 'success' : 'failed'} - ${results.conceptChecks.message}`);

    // Process Analysis batch runs (domain and competitor analysis)
    console.log('📋 [AllBatches] Processing Analysis batch runs...');
    results.analysisBatch = await callInternalEndpoint('/api/cron/process-analysis-batch', cronSecret);
    console.log(`📋 [AllBatches] Analysis batch: ${results.analysisBatch.success ? 'success' : 'failed'} - ${results.analysisBatch.message}`);

    const allSuccessful = Object.values(results).every(r => r.success);

    return {
      success: true,
      summary: {
        message: allSuccessful ? 'All batch processors completed successfully' : 'Some batch processors had issues',
        results,
      },
    };
  });
}
