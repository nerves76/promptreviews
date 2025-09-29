/**
 * Cron job to process scheduled optimizer email sends
 * Handles follow-up, nurture, and trial offer emails
 */

import { NextRequest, NextResponse } from 'next/server';
import { processBatchEmails } from '@/lib/services/optimizerEmailService';

// Verify the request is from Vercel Cron or has the correct secret
function validateCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET_TOKEN;

  if (!cronSecret) {
    console.error('CRON_SECRET_TOKEN not configured');
    return false;
  }

  // Check for Vercel Cron secret
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Check for custom secret in header
  const customSecret = request.headers.get('x-cron-secret');
  if (customSecret === cronSecret) {
    return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    // Validate cron request
    if (!validateCronRequest(request)) {
      console.warn('Unauthorized cron request to send-optimizer-emails');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 Starting optimizer email cron job...');

    const results = {
      followup: { processed: 0, successful: 0, failed: 0, errors: [] },
      nurture_tips: { processed: 0, successful: 0, failed: 0, errors: [] },
      nurture_case_study: { processed: 0, successful: 0, failed: 0, errors: [] },
      trial_offer: { processed: 0, successful: 0, failed: 0, errors: [] }
    };

    // Process each email type in sequence
    const emailTypes = ['followup', 'nurture_tips', 'nurture_case_study', 'trial_offer'] as const;

    for (const emailType of emailTypes) {
      console.log(`Processing ${emailType} emails...`);

      try {
        results[emailType] = await processBatchEmails(emailType, 100); // Process up to 100 at a time

        console.log(`✅ ${emailType}: ${results[emailType].successful} successful, ${results[emailType].failed} failed`);

        // Rate limiting between batches
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Error processing ${emailType} emails:`, error);
        results[emailType].errors.push(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // Calculate totals
    const totals = {
      processed: Object.values(results).reduce((sum, r) => sum + r.processed, 0),
      successful: Object.values(results).reduce((sum, r) => sum + r.successful, 0),
      failed: Object.values(results).reduce((sum, r) => sum + r.failed, 0),
      errors: Object.values(results).flatMap(r => r.errors)
    };

    console.log(`🎉 Optimizer email cron job completed:`, totals);

    return NextResponse.json({
      success: true,
      summary: totals,
      details: results
    });

  } catch (error) {
    console.error('❌ Error in optimizer email cron job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support GET for manual testing (with secret)
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET_TOKEN;

  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Forward to POST handler
  return POST(request);
}