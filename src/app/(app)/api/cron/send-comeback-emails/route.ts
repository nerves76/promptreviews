/**
 * Comeback Email Campaign Cron Job
 * 
 * Sends comeback offers to accounts cancelled ~3 months ago
 * Runs monthly on the 15th and checks for accounts that:
 * 1. Were cancelled 75-105 days ago (wider window for monthly runs)
 * 2. Haven't already received a comeback email
 * 3. Haven't reactivated since cancellation
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { logCronExecution, verifyCronSecret } from '@/lib/cronLogger';

// Helper to create Supabase admin client (lazy initialization)
function createSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    }
  );
}

// Helper to create Resend client (lazy initialization)
function createResendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function GET(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  return logCronExecution('send-comeback-emails', async () => {
    const supabaseAdmin = createSupabaseAdmin();
    const resend = createResendClient();


    // Find accounts cancelled around 90 days ago
    // Since we run monthly, check a wider window (75-105 days)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 105); // 105 days ago
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 75); // 75 days ago


    // Get cancelled accounts in the target window
    const { data: cancelledAccounts, error: fetchError } = await supabaseAdmin
      .from('accounts')
      .select('id, email, first_name, last_name, deleted_at')
      .gte('deleted_at', startDate.toISOString())
      .lte('deleted_at', endDate.toISOString())
      .not('deleted_at', 'is', null);

    if (fetchError) {
      throw new Error('Failed to fetch accounts');
    }

    if (!cancelledAccounts || cancelledAccounts.length === 0) {
      return {
        success: true,
        summary: { checked: 0, sent: 0, message: 'No accounts to email' },
      };
    }


    // Check which accounts haven't received comeback email yet
    const { data: emailHistory, error: historyError } = await supabaseAdmin
      .from('comeback_email_logs')
      .select('account_id')
      .eq('email_type', 'comeback_3_months')
      .in('account_id', cancelledAccounts.map(a => a.id));

    if (historyError) {
      console.error('❌ Error checking email history:', historyError);
    }

    const alreadyEmailed = new Set(emailHistory?.map(h => h.account_id) || []);
    const accountsToEmail = cancelledAccounts.filter(a => !alreadyEmailed.has(a.id));

    if (accountsToEmail.length === 0) {
      return {
        success: true,
        summary: { checked: cancelledAccounts.length, sent: 0, message: 'All accounts already emailed' },
      };
    }


    // Get the email template
    const { data: template, error: templateError } = await supabaseAdmin
      .from('email_templates')
      .select('subject, html_content, text_content')
      .eq('name', 'comeback_3_months')
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      throw new Error('Email template not found');
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


        // Record the send in comeback_email_logs table
        // This prevents duplicate sends on subsequent cron runs
        const { error: recordError } = await supabaseAdmin
          .from('comeback_email_logs')
          .insert({
            account_id: account.id,
            email: account.email,
            email_type: 'comeback_3_months',
            success: true,
            resend_email_id: emailData?.id,
            days_since_cancel: replacements['{{days_since_cancel}}']
          });

        if (recordError) {
          console.error('⚠️ Failed to record comeback email:', recordError);
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
            .from('comeback_email_logs')
            .insert({
              account_id: account.id,
              email: account.email,
              email_type: 'comeback_3_months',
              success: false,
              error_message: String(error)
            });
        } catch (recordError) {
          console.error('⚠️ Failed to record failure:', recordError);
        }
      }
    }

    return {
      success: true,
      summary: {
        checked: cancelledAccounts.length,
        eligible: accountsToEmail.length,
        sent: successCount,
        failed: failCount,
      },
    };
  });
}

// POST endpoint for manual triggering (admin only)
export async function POST(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  return GET(request);
}