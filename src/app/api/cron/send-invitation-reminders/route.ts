/**
 * Cron Job: Send Invitation Reminders
 * 
 * This endpoint sends reminder emails for pending invitations that haven't
 * been opened or accepted after 3 days. Should be called daily via cron.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { sendTeamInvitationEmail } from '@/utils/emailTemplates';

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createServiceRoleClient();

    // Verify cron job authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('📨 Starting invitation reminders check...');

    // Find invitations that need reminders:
    // - Created 3 days ago
    // - Not accepted
    // - Not expired
    // - Haven't been opened OR last activity was more than 1 day ago
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: pendingInvitations, error: invitationsError } = await supabaseAdmin
      .from('account_invitations')
      .select(`
        id,
        email,
        role,
        account_id,
        token,
        expires_at,
        created_at,
        accounts!inner (
          first_name,
          last_name
        )
      `)
      .lt('created_at', threeDaysAgo.toISOString())
      .gt('expires_at', new Date().toISOString())
      .is('accepted_at', null);

    if (invitationsError) {
      console.error('Error fetching pending invitations:', invitationsError);
      return NextResponse.json(
        { error: 'Failed to fetch pending invitations' },
        { status: 500 }
      );
    }

    if (!pendingInvitations || pendingInvitations.length === 0) {
      console.log('✅ No invitations need reminders');
      return NextResponse.json({
        success: true,
        message: 'No invitations need reminders',
        reminders_sent: 0
      });
    }

    console.log(`📧 Found ${pendingInvitations.length} invitations that might need reminders`);

    let remindersSent = 0;
    const errors = [];

    for (const invitation of pendingInvitations) {
      try {
        // Check if invitation has been opened or had recent activity
        const { data: events, error: eventsError } = await supabaseAdmin
          .from('invitation_events')
          .select('event_type, created_at')
          .eq('invitation_id', invitation.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (eventsError) {
          console.warn(`Failed to check events for invitation ${invitation.id}:`, eventsError);
          continue;
        }

        // Skip if already opened and had recent activity
        const hasOpened = events?.some(e => e.event_type === 'opened');
        const lastActivity = events?.[0]?.created_at;
        
        if (hasOpened && lastActivity && new Date(lastActivity) > oneDayAgo) {
          console.log(`⏭️ Skipping reminder for ${invitation.email} - recent activity`);
          continue;
        }

        // Check if we've already sent a reminder recently
        const recentReminder = events?.find(e => 
          e.event_type === 'sent' && 
          new Date(e.created_at) > oneDayAgo
        );

        if (recentReminder) {
          console.log(`⏭️ Skipping reminder for ${invitation.email} - reminder sent recently`);
          continue;
        }

        // Get business info for the reminder
        const { data: business, error: businessError } = await supabaseAdmin
          .from('businesses')
          .select('name')
          .eq('account_id', invitation.account_id)
          .single();

        const account = Array.isArray(invitation.accounts) ? invitation.accounts[0] : invitation.accounts;
        const inviterName = account 
          ? `${account.first_name || ''} ${account.last_name || ''}`.trim() || 'Someone'
          : 'Someone';
        const businessName = business?.name || 'their business';
        const formattedExpirationDate = new Date(invitation.expires_at).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric', 
          month: 'long',
          day: 'numeric'
        });

        // Send reminder email
        const emailResult = await sendTeamInvitationEmail(
          invitation.email,
          inviterName,
          businessName,
          invitation.role,
          invitation.token,
          formattedExpirationDate
        );

        if (emailResult.success) {
          remindersSent++;
          console.log(`✅ Sent reminder to ${invitation.email}`);
        } else {
          console.error(`❌ Failed to send reminder to ${invitation.email}:`, emailResult.error);
          errors.push(`${invitation.email}: ${emailResult.error}`);
        }

        // Small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error processing reminder for ${invitation.email}:`, error);
        errors.push(`${invitation.email}: ${error}`);
      }
    }

    console.log(`📊 Reminder summary: ${remindersSent} sent, ${errors.length} errors`);

    return NextResponse.json({
      success: true,
      message: `Sent ${remindersSent} invitation reminders`,
      reminders_sent: remindersSent,
      invitations_checked: pendingInvitations.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Invitation reminders error:', error);
    return NextResponse.json(
      { error: 'Internal server error during reminder sending' },
      { status: 500 }
    );
  }
}

// GET endpoint for checking how many reminders would be sent
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createServiceRoleClient();
    
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { count, error } = await supabaseAdmin
      .from('account_invitations')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', threeDaysAgo.toISOString())
      .gt('expires_at', new Date().toISOString())
      .is('accepted_at', null);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to count pending invitations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      eligible_for_reminders: count || 0,
      last_check: new Date().toISOString()
    });

  } catch (error) {
    console.error('Invitation reminders check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 