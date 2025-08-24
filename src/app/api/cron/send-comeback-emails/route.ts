/**
 * Comeback Email Campaign Cron Job
 * 
 * Sends comeback offers to accounts cancelled ~3 months ago
 * Runs monthly on the 15th and checks for accounts that:
 * 1. Were cancelled 75-105 days ago (wider window for monthly runs)
 * 2. Haven't already received a comeback email
 * 3. Haven't reactivated since cancellation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
);

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_TOKEN}`) {
      console.error('❌ Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🚀 Starting comeback email campaign (monthly run)...');

    // Find accounts cancelled around 90 days ago
    // Since we run monthly, check a wider window (75-105 days)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 105); // 105 days ago
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 75); // 75 days ago

    console.log(`📅 Looking for accounts cancelled between ${startDate.toISOString()} and ${endDate.toISOString()}`);

    // Get cancelled accounts in the target window
    const { data: cancelledAccounts, error: fetchError } = await supabaseAdmin
      .from('accounts')
      .select('id, email, first_name, last_name, deleted_at')
      .gte('deleted_at', startDate.toISOString())
      .lte('deleted_at', endDate.toISOString())
      .not('deleted_at', 'is', null);

    if (fetchError) {
      console.error('❌ Error fetching cancelled accounts:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }

    if (!cancelledAccounts || cancelledAccounts.length === 0) {
      console.log('ℹ️ No accounts found in the comeback window');
      return NextResponse.json({ 
        success: true, 
        message: 'No accounts to email',
        checked: 0,
        sent: 0 
      });
    }

    console.log(`📊 Found ${cancelledAccounts.length} cancelled accounts to check`);

    // Check which accounts haven't received comeback email yet
    const { data: emailHistory, error: historyError } = await supabaseAdmin
      .from('communication_history')
      .select('account_id')
      .eq('type', 'comeback_email_3m')
      .in('account_id', cancelledAccounts.map(a => a.id));

    if (historyError) {
      console.error('❌ Error checking email history:', historyError);
    }

    const alreadyEmailed = new Set(emailHistory?.map(h => h.account_id) || []);
    const accountsToEmail = cancelledAccounts.filter(a => !alreadyEmailed.has(a.id));

    if (accountsToEmail.length === 0) {
      console.log('ℹ️ All eligible accounts have already received comeback emails');
      return NextResponse.json({ 
        success: true, 
        message: 'All accounts already emailed',
        checked: cancelledAccounts.length,
        sent: 0 
      });
    }

    console.log(`📧 Sending comeback emails to ${accountsToEmail.length} accounts`);

    // Get the email template
    const { data: template, error: templateError } = await supabaseAdmin
      .from('email_templates')
      .select('subject, html_content, text_content')
      .eq('name', 'comeback_3_months')
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      console.error('❌ Error fetching email template:', templateError);
      return NextResponse.json({ error: 'Email template not found' }, { status: 500 });
    }

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    // Send emails
    for (const account of accountsToEmail) {
      try {
        // Replace template variables
        const replacements = {
          '{{first_name}}': account.first_name || 'there',
          '{{email}}': account.email,
          '{{days_since_cancel}}': Math.floor((Date.now() - new Date(account.deleted_at).getTime()) / (1000 * 60 * 60 * 24))
        };

        let htmlContent = template.html_content;
        let textContent = template.text_content;
        let subject = template.subject;

        Object.entries(replacements).forEach(([key, value]) => {
          htmlContent = htmlContent.replace(new RegExp(key, 'g'), String(value));
          textContent = textContent.replace(new RegExp(key, 'g'), String(value));
          subject = subject.replace(new RegExp(key, 'g'), String(value));
        });

        // Send email via Resend
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: 'PromptReviews <hello@promptreviews.app>',
          to: account.email,
          subject: subject,
          html: htmlContent,
          text: textContent,
          tags: [
            { name: 'campaign', value: 'comeback_3_months' },
            { name: 'account_id', value: account.id }
          ]
        });

        if (emailError) {
          throw emailError;
        }

        console.log(`✅ Email sent to ${account.email}`);

        // Record the communication
        const { error: recordError } = await supabaseAdmin
          .from('communication_history')
          .insert({
            account_id: account.id,
            type: 'comeback_email_3m',
            status: 'sent',
            subject: subject,
            content: textContent,
            metadata: {
              email_id: emailData?.id,
              days_since_cancel: replacements['{{days_since_cancel}}'],
              template: 'comeback_3_months'
            }
          });

        if (recordError) {
          console.error('⚠️ Failed to record communication:', recordError);
        }

        successCount++;

        // Rate limiting - wait between emails
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`❌ Failed to send email to ${account.email}:`, error);
        errors.push(`${account.email}: ${error}`);
        failCount++;

        // Record the failure
        try {
          await supabaseAdmin
            .from('communication_history')
            .insert({
              account_id: account.id,
              type: 'comeback_email_3m',
              status: 'failed',
              subject: template.subject,
              content: template.text_content,
              metadata: {
                error: String(error),
                template: 'comeback_3_months'
              }
            });
        } catch (recordError) {
          console.error('⚠️ Failed to record failure:', recordError);
        }
      }
    }

    const summary = {
      success: true,
      message: `Comeback email campaign completed`,
      stats: {
        checked: cancelledAccounts.length,
        eligible: accountsToEmail.length,
        sent: successCount,
        failed: failCount
      },
      errors: errors.length > 0 ? errors : undefined
    };

    console.log('📊 Campaign summary:', summary);

    return NextResponse.json(summary);

  } catch (error) {
    console.error('❌ Comeback email cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// POST endpoint for manual triggering (admin only)
export async function POST(request: NextRequest) {
  try {
    // Check for admin authentication
    const authHeader = request.headers.get('authorization');
    
    // You can implement your own admin auth check here
    // For now, we'll use the same cron token
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call the GET handler
    return GET(request);
    
  } catch (error) {
    console.error('Manual trigger error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger comeback emails' },
      { status: 500 }
    );
  }
}