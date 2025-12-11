/**
 * Cron Job: Send Credit Warnings
 *
 * Runs daily at 8am UTC to warn users about upcoming scheduled geo-grid checks
 * that may fail due to insufficient credits.
 *
 * Security: Uses CRON_SECRET_TOKEN for authorization.
 *
 * Flow:
 * 1. Find all configs with next_scheduled_at in the next 24 hours
 * 2. For each config:
 *    a. Calculate required credits
 *    b. Check current balance
 *    c. If insufficient and not warned recently, send notification
 * 3. Return summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateGeogridCost, getBalance, ensureBalanceExists } from '@/lib/credits';
import { sendNotificationToAccount } from '@/utils/notifications';

// Only send one warning per 24 hours
const WARNING_COOLDOWN_HOURS = 24;

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('🔔 [Credit Warnings] Starting credit warning job');

  try {
    // Verify the request is from Vercel cron
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (!expectedToken) {
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
      console.error('❌ [Credit Warnings] Invalid cron authorization token');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all configs with next_scheduled_at in the next 24 hours
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: upcomingConfigs, error: configsError } = await supabase
      .from('gg_configs')
      .select('*')
      .not('schedule_frequency', 'is', null)
      .eq('is_enabled', true)
      .gte('next_scheduled_at', now.toISOString())
      .lte('next_scheduled_at', in24Hours.toISOString());

    if (configsError) {
      console.error('❌ [Credit Warnings] Failed to fetch configs:', configsError);
      return NextResponse.json(
        { error: 'Failed to fetch configurations' },
        { status: 500 }
      );
    }

    console.log(`📋 [Credit Warnings] Found ${upcomingConfigs?.length || 0} configs with upcoming checks`);

    const results = {
      checked: 0,
      warningsSent: 0,
      sufficientCredits: 0,
      skippedCooldown: 0,
      errors: 0,
      details: [] as Array<{
        configId: string;
        accountId: string;
        required: number;
        available: number;
        status: 'warning_sent' | 'sufficient' | 'cooldown' | 'error';
        scheduledFor?: string;
        error?: string;
      }>,
    };

    // Check the cooldown time
    const cooldownTime = new Date(now.getTime() - WARNING_COOLDOWN_HOURS * 60 * 60 * 1000);

    // Process each config
    for (const configRow of upcomingConfigs || []) {
      const accountId = configRow.account_id;
      const configId = configRow.id;

      try {
        results.checked++;

        // Count tracked keywords
        const { count: keywordCount } = await supabase
          .from('gg_tracked_keywords')
          .select('*', { count: 'exact', head: true })
          .eq('config_id', configId)
          .eq('is_enabled', true);

        if (!keywordCount || keywordCount === 0) {
          // No keywords, no cost
          results.sufficientCredits++;
          results.details.push({
            configId,
            accountId,
            required: 0,
            available: 0,
            status: 'sufficient',
          });
          continue;
        }

        // Calculate credit cost
        const checkPoints = configRow.check_points || [];
        const pointCount = checkPoints.length || 1;
        const gridSize = Math.sqrt(pointCount);
        const requiredCredits = calculateGeogridCost(gridSize, keywordCount);

        // Ensure balance exists and get current balance
        await ensureBalanceExists(supabase, accountId);
        const balance = await getBalance(supabase, accountId);
        const availableCredits = balance.totalCredits;

        // Check if they have enough credits
        if (availableCredits >= requiredCredits) {
          results.sufficientCredits++;
          results.details.push({
            configId,
            accountId,
            required: requiredCredits,
            available: availableCredits,
            status: 'sufficient',
            scheduledFor: configRow.next_scheduled_at,
          });
          continue;
        }

        // Check if we've warned recently
        if (configRow.last_credit_warning_sent_at) {
          const lastWarning = new Date(configRow.last_credit_warning_sent_at);
          if (lastWarning > cooldownTime) {
            console.log(`⏭️ [Credit Warnings] Skipping ${accountId} - warned ${lastWarning.toISOString()}`);
            results.skippedCooldown++;
            results.details.push({
              configId,
              accountId,
              required: requiredCredits,
              available: availableCredits,
              status: 'cooldown',
              scheduledFor: configRow.next_scheduled_at,
            });
            continue;
          }
        }

        // Format scheduled time for notification
        const scheduledDate = new Date(configRow.next_scheduled_at);
        const scheduledFor = scheduledDate.toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short',
        });

        // Send warning notification
        console.log(`⚠️ [Credit Warnings] Sending warning to ${accountId}: need ${requiredCredits}, have ${availableCredits}`);

        await sendNotificationToAccount(accountId, 'credit_warning_upcoming', {
          required: requiredCredits,
          available: availableCredits,
          scheduledFor,
        });

        // Update last warning timestamp
        await supabase
          .from('gg_configs')
          .update({ last_credit_warning_sent_at: now.toISOString() })
          .eq('id', configId);

        results.warningsSent++;
        results.details.push({
          configId,
          accountId,
          required: requiredCredits,
          available: availableCredits,
          status: 'warning_sent',
          scheduledFor: configRow.next_scheduled_at,
        });

        // Small delay between notifications
        await new Promise((resolve) => setTimeout(resolve, 100));

      } catch (error: any) {
        console.error(`❌ [Credit Warnings] Error processing ${configId}:`, error);
        results.errors++;
        results.details.push({
          configId,
          accountId,
          required: 0,
          available: 0,
          status: 'error',
          error: error.message,
        });
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [Credit Warnings] Job complete in ${duration}ms`);
    console.log(`   Checked: ${results.checked}, Warnings: ${results.warningsSent}, Sufficient: ${results.sufficientCredits}, Cooldown: ${results.skippedCooldown}, Errors: ${results.errors}`);

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      summary: {
        total: upcomingConfigs?.length || 0,
        checked: results.checked,
        warningsSent: results.warningsSent,
        sufficientCredits: results.sufficientCredits,
        skippedCooldown: results.skippedCooldown,
        errors: results.errors,
      },
      details: results.details,
    });
  } catch (error) {
    console.error('❌ [Credit Warnings] Fatal error in cron job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
