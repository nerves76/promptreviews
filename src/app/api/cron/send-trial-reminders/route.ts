/**
 * Cron Job: Send Trial Reminders
 * 
 * Automatically sends reminder emails to users whose trial expires in 3 days.
 * This endpoint is called by Vercel's cron service daily at 9 AM UTC.
 * 
 * Security: Uses a secret token to ensure only Vercel can call this endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTrialReminderEmail } from '../../../../utils/emailTemplates';

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel cron
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (!expectedToken) {
      console.error('CRON_SECRET_TOKEN environment variable not set');
      return NextResponse.json(
        { error: 'Cron secret not configured' }, 
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
      console.error('Invalid cron authorization token');
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Create Supabase client with service role key for admin access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Calculate the date 3 days from now
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysFromNowISO = threeDaysFromNow.toISOString();

    // Find users whose trial expires in 3 days
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select(`
        id,
        trial_end,
        profiles!inner(
          first_name,
          email
        )
      `)
      .eq('plan', 'grower')
      .not('trial_end', 'is', null)
      .gte('trial_end', threeDaysFromNowISO)
      .lt('trial_end', new Date(threeDaysFromNow.getTime() + 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('Error fetching accounts for trial reminders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch accounts' }, 
        { status: 500 }
      );
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Send reminder emails
    for (const account of accounts || []) {
      try {
        // Check if we've already sent a reminder for this account today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data: existingReminders } = await supabase
          .from('trial_reminder_logs')
          .select('id')
          .eq('account_id', account.id)
          .eq('reminder_type', 'trial_reminder')
          .gte('sent_at', today.toISOString())
          .limit(1);

        if (existingReminders && existingReminders.length > 0) {
          skippedCount++;
          results.push({
            accountId: account.id,
            email: account.profiles.email,
            status: 'skipped',
            reason: 'Already sent today'
          });
          continue;
        }

        const result = await sendTrialReminderEmail(
          account.profiles.email,
          account.profiles.first_name || 'there'
        );

        // Log the reminder attempt
        await supabase
          .from('trial_reminder_logs')
          .insert({
            account_id: account.id,
            email: account.profiles.email,
            reminder_type: 'trial_reminder',
            success: result.success,
            error_message: result.error || null
          });

        if (result.success) {
          successCount++;
          results.push({
            accountId: account.id,
            email: account.profiles.email,
            status: 'sent'
          });
        } else {
          errorCount++;
          results.push({
            accountId: account.id,
            email: account.profiles.email,
            status: 'failed',
            error: result.error
          });
        }
      } catch (error) {
        errorCount++;
        
        // Log the error
        await supabase
          .from('trial_reminder_logs')
          .insert({
            account_id: account.id,
            email: account.profiles.email,
            reminder_type: 'trial_reminder',
            success: false,
            error_message: error instanceof Error ? error.message : 'Unknown error'
          });

        results.push({
          accountId: account.id,
          email: account.profiles.email,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`Cron job completed: ${successCount} reminders sent, ${errorCount} failed, ${skippedCount} skipped`);

    return NextResponse.json({
      success: true,
      summary: {
        total: accounts?.length || 0,
        sent: successCount,
        failed: errorCount,
        skipped: skippedCount
      },
      results
    });

  } catch (error) {
    console.error('Error in trial reminder cron job:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 