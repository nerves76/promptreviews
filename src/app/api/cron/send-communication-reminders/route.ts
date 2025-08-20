/**
 * Cron Job: Send Communication Follow-up Reminders
 * 
 * This endpoint processes due follow-up reminders from the communication tracking system
 * and sends automated emails using the existing Resend email infrastructure.
 * 
 * Called daily by Vercel's cron service to check for due reminders.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/auth/providers/supabase';
import { sendTemplatedEmail } from '../../../../utils/emailTemplates';
import { captureError, captureMessage, setContext } from '@/utils/sentry';
import { resend } from '@/utils/resend';

// Type definition for reminder data from Supabase
interface ReminderData {
  id: string;
  reminder_type: string;
  reminder_date: string;
  custom_message?: string;
  contact_id: string;
  account_id: string;
  communication_records: {
    id: string;
    communication_type: string;
    subject?: string;
    message_content?: string;
    sent_at: string;
    prompt_page_id?: string;
  };
  contacts: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  accounts: {
    id: string;
    business_name?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  };
}

// Function to send admin error notification
async function sendAdminErrorNotification(error: any, context: any) {
  try {
    const adminEmail = process.env.ADMIN_ERROR_EMAIL || 'team@promptreviews.app';
    
    await resend.emails.send({
      from: 'Prompt Reviews System <team@updates.promptreviews.app>',
      to: adminEmail,
      subject: '🚨 Communication Reminder Cron Job Failed',
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc2626;">Communication Reminder Cron Job Error</h2>
          
          <div style="background-color: #fee2e2; border: 1px solid #fca5a5; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h3 style="color: #b91c1c; margin-top: 0;">Error Details:</h3>
            <pre style="background: #fff; padding: 10px; border-radius: 4px; overflow-x: auto;">
${error.message || 'Unknown error'}
            </pre>
          </div>
          
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Context:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Time:</strong> ${new Date().toISOString()}</li>
              <li><strong>Environment:</strong> ${process.env.NODE_ENV || 'production'}</li>
              <li><strong>Reminders Processed:</strong> ${context.processedCount || 0}</li>
              <li><strong>Failures:</strong> ${context.failureCount || 0}</li>
            </ul>
          </div>
          
          ${error.stack ? `
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Stack Trace:</h3>
            <pre style="font-size: 12px; overflow-x: auto; background: #fff; padding: 10px; border-radius: 4px;">
${error.stack}
            </pre>
          </div>
          ` : ''}
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            This is an automated notification. Please check the logs and Sentry for more details.
          </p>
        </div>
      `,
      text: `
Communication Reminder Cron Job Error

Error: ${error.message || 'Unknown error'}
Time: ${new Date().toISOString()}
Environment: ${process.env.NODE_ENV || 'production'}
Reminders Processed: ${context.processedCount || 0}
Failures: ${context.failureCount || 0}

${error.stack || ''}

This is an automated notification. Please check the logs and Sentry for more details.
      `
    });
  } catch (emailError) {
    console.error('Failed to send admin error notification:', emailError);
    captureError(emailError as Error, { originalError: error.message });
  }
}

export async function GET(request: NextRequest) {
  // Track metrics for monitoring
  const cronContext = {
    startTime: new Date(),
    processedCount: 0,
    failureCount: 0,
    errors: [] as Array<{ reminderId: string; error: string }>
  };

  // Set Sentry context for this cron job
  setContext('cron_job', {
    type: 'communication_reminders',
    startTime: cronContext.startTime.toISOString()
  });

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
    const supabase = createServiceRoleClient();

    console.log('📨 Starting communication reminder check...');

    // Get all pending reminders that are due (reminder_date <= now)
    const { data: dueReminders, error: remindersError } = await supabase
      .from('follow_up_reminders')
      .select(`
        id,
        reminder_type,
        reminder_date,
        custom_message,
        contact_id,
        account_id,
        communication_records!inner (
          id,
          communication_type,
          subject,
          message_content,
          sent_at,
          prompt_page_id
        ),
        contacts!inner (
          id,
          first_name,
          last_name,
          email
        ),
        accounts!inner (
          id,
          business_name,
          email,
          first_name,
          last_name
        )
      `)
      .eq('status', 'pending')
      .lte('reminder_date', new Date().toISOString())
      .limit(100); // Process in batches

    if (remindersError) {
      console.error('Error fetching due reminders:', remindersError);
      
      // Capture error in Sentry
      captureError(new Error('Failed to fetch communication reminders'), {
        remindersError,
        query: 'follow_up_reminders with status=pending'
      });
      
      // Send admin notification
      await sendAdminErrorNotification(
        { ...remindersError, message: 'Failed to fetch reminders from database' },
        cronContext
      );
      
      return NextResponse.json(
        { error: 'Failed to fetch reminders' },
        { status: 500 }
      );
    }

    if (!dueReminders || dueReminders.length === 0) {
      console.log('📭 No due communication reminders found');
      
      // Log to Sentry as info (not an error, but good to track)
      captureMessage('No due communication reminders found', 'info', {
        checkTime: new Date().toISOString()
      });
      
      return NextResponse.json({
        success: true,
        message: 'No due reminders to process',
        processed: 0
      });
    }

    console.log(`📬 Found ${dueReminders.length} due communication reminders to process`);

    let processed = 0;
    let failed = 0;
    const failedReminders: Array<{ id: string; email: string; error: string }> = [];

    // Process each due reminder
    for (const reminder of dueReminders as unknown as ReminderData[]) {
      try {
        // Skip if business/account doesn't have an email (we send reminders to the business, not the customer)
        if (!reminder.accounts?.email) {
          console.log(`⏭️ Skipping reminder ${reminder.id} - business account has no email`);
          continue;
        }

        // Get the business information
        const business = reminder.accounts;
        const contact = reminder.contacts;
        const originalCommunication = reminder.communication_records;

        // Construct reminder email data
        const businessName = business?.business_name || `${business?.first_name || ''} ${business?.last_name || ''}`.trim() || 'Your Business';
        const businessOwnerName = `${business?.first_name || ''}`.trim() || 'Business Owner';
        const customerName = `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim() || 'Customer';
        
        // Create a reminder message for the BUSINESS OWNER, not the customer
        const timeFrame = getReminderTypeLabel(reminder.reminder_type);
        const reminderMessage = `Hi ${businessOwnerName},

This is a reminder to follow up with ${customerName} about leaving a review.

${timeFrame} ago, you sent them ${originalCommunication?.communication_type === 'sms' ? 'an SMS' : 'an email'} requesting feedback. They haven't submitted a review yet, so it might be a good time to send a friendly follow-up.

Customer details:
• Name: ${customerName}
${contact?.email ? `• Email: ${contact.email}` : ''}
${contact?.phone ? `• Phone: ${contact.phone}` : ''}

Original message you sent:
"${originalCommunication?.message_content || 'No message content available'}"

You can view and manage this communication in your dashboard.`;

        // Send the follow-up reminder to the BUSINESS OWNER, not the customer
        const emailResult = await sendTemplatedEmail({
          templateName: 'communication-follow-up-reminder',
          to: business.email!, // Send to business owner
          variables: {
            customer_name: businessOwnerName, // This is who we're addressing
            business_name: businessName,
            original_subject: originalCommunication?.subject || `Review request for ${customerName}`,
            original_message: originalCommunication?.message_content || '',
            original_date: originalCommunication?.sent_at ? new Date(originalCommunication.sent_at).toLocaleDateString() : 'recently',
            review_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.promptreviews.app'}/dashboard/contacts` // Link to contacts page to follow up
          },
          // Fallback content if template doesn't exist
          fallbackSubject: `Follow-up: ${originalCommunication?.subject || 'Previous Communication'}`,
          fallbackHtml: `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>Follow-up Reminder</h2>
              <p>${reminderMessage.replace(/\n/g, '<br>')}</p>
            </div>
          `,
          fallbackText: reminderMessage
        });

        if (emailResult.success) {
          // Update reminder status to sent
          await supabase
            .from('follow_up_reminders')
            .update({ 
              status: 'sent',
              sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', reminder.id);

          // Update prompt page status to 'follow_up' if there's an associated prompt page
          if (originalCommunication?.prompt_page_id) {
            const { error: updateError } = await supabase
              .from('prompt_pages')
              .update({ 
                status: 'follow_up',
                updated_at: new Date().toISOString()
              })
              .eq('id', originalCommunication.prompt_page_id)
              .eq('account_id', reminder.account_id); // Ensure we only update pages owned by this account
            
            if (updateError) {
              console.error(`⚠️ Failed to update prompt page status for ${originalCommunication.prompt_page_id}:`, updateError);
            } else {
              console.log(`📝 Updated prompt page ${originalCommunication.prompt_page_id} status to 'follow_up'`);
            }
          }
          
          // Create a notification record in communication_records for the business owner
          // This will appear in their activity feed
          const contactLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.promptreviews.app'}/dashboard/contacts?id=${contact.id}`;
          const notificationMessage = `Reminder: You reached out to ${customerName} about a review ${timeFrame} ago. Did you verify a review was submitted? If not, give them a friendly reminder and share this link: ${contactLink}`;
          
          const { error: notificationError } = await supabase
            .from('communication_records')
            .insert({
              account_id: reminder.account_id,
              contact_id: reminder.contact_id,
              prompt_page_id: originalCommunication?.prompt_page_id,
              communication_type: 'notification',
              subject: `Follow-up reminder: ${customerName}`,
              message_content: notificationMessage,
              sent_at: new Date().toISOString(),
              sent_by: 'system',
              metadata: {
                type: 'follow_up_reminder',
                original_communication_id: originalCommunication?.id,
                reminder_id: reminder.id,
                contact_details: {
                  name: customerName,
                  email: contact?.email,
                  phone: contact?.phone
                },
                action_url: contactLink
              }
            });
            
          if (notificationError) {
            console.warn(`⚠️ Failed to create notification record for reminder ${reminder.id}:`, notificationError);
          } else {
            console.log(`📝 Created activity record for business about ${customerName}`);
          }

          console.log(`✅ Sent follow-up reminder to ${business.email} about customer ${customerName}`);
          processed++;
        } else {
          console.error(`❌ Failed to send reminder ${reminder.id}:`, emailResult.error);
          failed++;
          failedReminders.push({
            id: reminder.id,
            email: business.email || 'unknown',
            error: emailResult.error || 'Unknown error'
          });
          cronContext.errors.push({
            reminderId: reminder.id,
            error: emailResult.error || 'Unknown error'
          });
        }

      } catch (error) {
        console.error(`❌ Error processing reminder ${reminder.id}:`, error);
        failed++;
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        failedReminders.push({
          id: reminder.id,
          email: reminder.contacts?.email || 'unknown',
          error: errorMessage
        });
        cronContext.errors.push({
          reminderId: reminder.id,
          error: errorMessage
        });
        
        // Capture individual reminder failure in Sentry
        captureError(error as Error, {
          reminderId: reminder.id,
          contactEmail: reminder.contacts?.email,
          businessName: reminder.accounts?.business_name
        });
      }
    }

    // Update context with final counts
    cronContext.processedCount = processed;
    cronContext.failureCount = failed;

    console.log(`📊 Communication reminders processed: ${processed} sent, ${failed} failed`);

    // If there were failures, send admin notification
    if (failed > 0) {
      captureMessage(
        `Communication reminder cron completed with ${failed} failures`,
        'warning',
        {
          processed,
          failed,
          total: dueReminders.length,
          failedReminders
        }
      );
      
      // Send admin notification about partial failures
      await sendAdminErrorNotification(
        {
          message: `Cron job completed with ${failed} failed reminders out of ${dueReminders.length} total`,
          failedReminders,
          stack: undefined
        },
        cronContext
      );
    } else if (processed > 0) {
      // Log successful run
      captureMessage(
        `Communication reminder cron completed successfully`,
        'info',
        {
          processed,
          total: dueReminders.length
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${dueReminders.length} due reminders`,
      processed,
      failed,
      total: dueReminders.length,
      ...(failed > 0 && { failedReminders })
    });

  } catch (error) {
    console.error('❌ Critical error in communication reminders cron job:', error);
    
    // Capture critical error in Sentry
    captureError(error as Error, {
      cronJob: 'communication_reminders',
      context: cronContext
    }, {
      level: 'error',
      cronJob: 'communication_reminders'
    });
    
    // Send admin notification for critical failure
    await sendAdminErrorNotification(
      error,
      cronContext
    );
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Convert reminder type to human-readable label
 */
function getReminderTypeLabel(reminderType: string): string {
  const labels: Record<string, string> = {
    '1_week': '1 week',
    '2_weeks': '2 weeks',
    '3_weeks': '3 weeks', 
    '1_month': '1 month',
    '2_months': '2 months',
    '3_months': '3 months',
    '4_months': '4 months',
    '5_months': '5 months',
    '6_months': '6 months',
  };
  return labels[reminderType] || reminderType;
}