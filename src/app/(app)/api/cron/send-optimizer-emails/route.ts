/**
 * Cron job to process scheduled optimizer email sends
 * Handles follow-up, nurture, and trial offer emails
 */

import { NextRequest } from 'next/server';
import { processBatchEmails } from '@/lib/services/optimizerEmailService';
import { logCronExecution, verifyCronSecret } from '@/lib/cronLogger';

async function runOptimizerEmails() {
  const results = {
    followup: { processed: 0, successful: 0, failed: 0, errors: [] as string[] },
    nurture_tips: { processed: 0, successful: 0, failed: 0, errors: [] as string[] },
    nurture_case_study: { processed: 0, successful: 0, failed: 0, errors: [] as string[] },
    trial_offer: { processed: 0, successful: 0, failed: 0, errors: [] as string[] }
  };

  const emailTypes = ['followup', 'nurture_tips', 'nurture_case_study', 'trial_offer'] as const;

  for (const emailType of emailTypes) {
    try {
      results[emailType] = await processBatchEmails(emailType, 100);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      results[emailType].errors.push(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  const totals = {
    processed: Object.values(results).reduce((sum, r) => sum + r.processed, 0),
    successful: Object.values(results).reduce((sum, r) => sum + r.successful, 0),
    failed: Object.values(results).reduce((sum, r) => sum + r.failed, 0),
  };

  return { success: true, summary: totals };
}

export async function POST(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  return logCronExecution('send-optimizer-emails', runOptimizerEmails);
}

export async function GET(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  return logCronExecution('send-optimizer-emails', runOptimizerEmails);
}