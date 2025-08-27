/**
 * Send Trial Reminders API
 * 
 * Sends reminder emails to users whose trial expires in 3 days
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sendTrialReminderEmail } from '../../../utils/emailTemplates';
import { isAdmin } from '@/auth/utils/admin';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminStatus = await isAdmin(user.id, supabase);
    if (!adminStatus) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

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
        // Handle the profiles array from inner join
        const profile = Array.isArray(account.profiles) ? account.profiles[0] : account.profiles;
        if (!profile) {
          console.error('No profile found for account:', account.id);
          continue;
        }
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
            email: profile.email,
            status: 'skipped',
            reason: 'Already sent today'
          });
          continue;
        }

        const result = await sendTrialReminderEmail(
          profile.email,
          profile.first_name || 'there'
        );

        // Log the reminder attempt
        await supabase
          .from('trial_reminder_logs')
          .insert({
            account_id: account.id,
            email: profile.email,
            reminder_type: 'trial_reminder',
            success: result.success,
            error_message: result.error || null
          });

        if (result.success) {
          successCount++;
          results.push({
            accountId: account.id,
            email: profile.email,
            status: 'sent'
          });
        } else {
          errorCount++;
          results.push({
            accountId: account.id,
            email: profile.email,
            status: 'failed',
            error: result.error
          });
        }
      } catch (error) {
        errorCount++;
        // Handle the profiles array from inner join
        const profile = Array.isArray(account.profiles) ? account.profiles[0] : account.profiles;
        const email = profile?.email || 'unknown';
        // Log the error
        await supabase
          .from('trial_reminder_logs')
          .insert({
            account_id: account.id,
            email: email,
            reminder_type: 'trial_reminder',
            success: false,
            error_message: error instanceof Error ? error.message : 'Unknown error'
          });

        results.push({
          accountId: account.id,
          email: email,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

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
    console.error('Error sending trial reminders:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 