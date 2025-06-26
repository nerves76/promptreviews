/**
 * Send Trial Reminders API
 * 
 * Sends reminder emails to users whose trial expires in 3 days
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { sendTrialReminderEmail } from '../../../utils/emailTemplates';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminCheck } = await supabase
      .from('admins')
      .select('id')
      .eq('account_id', user.id)
      .single();

    if (!adminCheck) {
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

    // Send reminder emails
    for (const account of accounts || []) {
      try {
        const result = await sendTrialReminderEmail(
          account.profiles.email,
          account.profiles.first_name || 'there'
        );

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
        results.push({
          accountId: account.id,
          email: account.profiles.email,
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
        failed: errorCount
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