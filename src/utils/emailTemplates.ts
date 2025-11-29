/**
 * Email Templates Utility
 * 
 * Handles fetching, rendering, and sending email templates from the database
 */

import { createServiceRoleClient } from '@/auth/providers/supabase';
import { Resend } from 'resend';

// Lazy initialization to avoid build-time env var access
function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string | null;
  is_active: boolean;
}

interface TemplateVariables {
  firstName?: string;
  lastName?: string;
  email?: string;
  dashboardUrl?: string;
  loginUrl?: string;
  upgradeUrl?: string;
  [key: string]: any;
}

/**
 * Get an email template by name
 */
export async function getEmailTemplate(name: string): Promise<EmailTemplate | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('name', name)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error(`Error fetching email template '${name}':`, error);
    return null;
  }

  return data;
}

/**
 * Render template content with variables
 */
export function renderTemplate(template: string, variables: TemplateVariables): string {
  let rendered = template;
  
  // Replace variables in the format {{variableName}}
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, value || '');
  });
  
  return rendered;
}

/**
 * Send an email using a template
 */
export async function sendTemplatedEmail(
  templateNameOrOptions: string | {
    templateName: string;
    to: string;
    variables: TemplateVariables;
    fallbackSubject?: string;
    fallbackHtml?: string;
    fallbackText?: string;
  },
  to?: string,
  variables?: TemplateVariables
): Promise<{ success: boolean; error?: string }> {
  try {
    // Handle both old and new function signatures
    let templateName: string;
    let emailTo: string;
    let emailVariables: TemplateVariables;
    let fallbackSubject: string | undefined;
    let fallbackHtml: string | undefined;
    let fallbackText: string | undefined;

    if (typeof templateNameOrOptions === 'string') {
      // Old signature: sendTemplatedEmail(templateName, to, variables)
      templateName = templateNameOrOptions;
      emailTo = to!;
      emailVariables = variables!;
    } else {
      // New signature: sendTemplatedEmail(options)
      templateName = templateNameOrOptions.templateName;
      emailTo = templateNameOrOptions.to;
      emailVariables = templateNameOrOptions.variables;
      fallbackSubject = templateNameOrOptions.fallbackSubject;
      fallbackHtml = templateNameOrOptions.fallbackHtml;
      fallbackText = templateNameOrOptions.fallbackText;
    }

    // Get the template
    const template = await getEmailTemplate(templateName);
    if (!template) {
      // If template not found and we have fallbacks, use them
      if (fallbackSubject && fallbackHtml) {

        const result = await getResendClient().emails.send({
          from: "Prompt Reviews <team@updates.promptreviews.app>",
          to: emailTo,
          subject: fallbackSubject,
          html: fallbackHtml,
          ...(fallbackText && { text: fallbackText })
        });

        return { success: true };
      }
      
      return { success: false, error: `Template '${templateName}' not found` };
    }

    // Set default URLs if not provided
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.promptreviews.app';
    const defaultVariables: TemplateVariables = {
      dashboardUrl: `${baseUrl}/dashboard`,
      loginUrl: `${baseUrl}/auth/sign-in`,
      upgradeUrl: `${baseUrl}/dashboard/plan`,

      // Dashboard page URLs
      promptPagesUrl: `${baseUrl}/dashboard/edit-prompt-page/universal`,
      businessProfileUrl: `${baseUrl}/dashboard/business-profile`,
      widgetUrl: `${baseUrl}/dashboard/widget`,
      reviewsUrl: `${baseUrl}/dashboard/reviews`,
      contactsUrl: `${baseUrl}/dashboard/contacts`,
      analyticsUrl: `${baseUrl}/dashboard/analytics`,
      planUrl: `${baseUrl}/dashboard/plan`,
      teamUrl: `${baseUrl}/dashboard/team`,
      googleBusinessUrl: `${baseUrl}/dashboard/google-business`,
      communityUrl: `${baseUrl}/dashboard/community`,
      gameUrl: `${baseUrl}/game`,

      ...emailVariables
    };

    // Render the template
    const subject = renderTemplate(template.subject, defaultVariables);
    const htmlContent = renderTemplate(template.html_content, defaultVariables);
    const textContent = template.text_content 
      ? renderTemplate(template.text_content, defaultVariables)
      : undefined;

    // Send the email
    const result = await getResendClient().emails.send({
      from: "Prompt Reviews <team@updates.promptreviews.app>",
      to: emailTo,
      subject,
      html: htmlContent,
      ...(textContent && { text: textContent })
    });

    return { success: true };
  } catch (error) {
    const templateNameForLog = typeof templateNameOrOptions === 'string' ? templateNameOrOptions : templateNameOrOptions.templateName;
    console.error(`Error sending templated email '${templateNameForLog}':`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send trial reminder email using template
 */
export async function sendTrialReminderEmail(
  email: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  return sendTemplatedEmail('trial_reminder', email, { firstName });
}

/**
 * Send admin notification when a new user joins the app
 */
export async function sendAdminNewUserNotification(
  userEmail: string,
  userFirstName: string,
  userLastName: string
): Promise<{ success: boolean; error?: string }> {
  // Get admin emails from environment
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  
  if (adminEmails.length === 0) {
    return { success: true }; // Don't treat this as an error
  }

  const results = [];
  let overallSuccess = true;

  for (const adminEmail of adminEmails) {
    try {
      // Try to use the template system first
      const templateResult = await sendTemplatedEmail('admin_new_user_notification', adminEmail, {
        firstName: userFirstName,
        lastName: userLastName,
        userEmail: userEmail,
        joinDate: new Date().toLocaleString()
      });

      if (templateResult.success) {
        results.push({ email: adminEmail, success: true });
      } else {
        // Fallback to direct email if template doesn't exist

        const result = await getResendClient().emails.send({
          from: "Prompt Reviews <alerts@updates.promptreviews.app>",
          to: adminEmail,
          subject: `New user joined: ${userFirstName} ${userLastName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #475569; margin-bottom: 20px;">🎉 New User Signup</h2>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px 0;"><strong>Name:</strong> ${userFirstName} ${userLastName}</p>
                <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${userEmail}</p>
                <p style="margin: 0;"><strong>Joined:</strong> ${new Date().toLocaleString()}</p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.promptreviews.app'}/admin" 
                   style="background: #475569; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View Admin Dashboard
                </a>
              </div>

              <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px;">
                This is an automated notification from Prompt Reviews
              </p>
            </div>
          `,
          text: `
New User Signup

Name: ${userFirstName} ${userLastName}
Email: ${userEmail}
Joined: ${new Date().toLocaleString()}

View admin dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://app.promptreviews.app'}/admin
          `
        });

        results.push({ email: adminEmail, success: true });
      }
    } catch (error) {
      console.error(`❌ Failed to send admin notification to ${adminEmail}:`, error);
      results.push({ email: adminEmail, success: false, error });
      overallSuccess = false;
    }
  }

  return { 
    success: overallSuccess,
    error: overallSuccess ? undefined : `Failed to send to some admins: ${results.filter(r => !r.success).map(r => r.email).join(', ')}`
  };
}

/**
 * Send trial expired email
 */
export async function sendTrialExpiredEmail(
  email: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  return sendTemplatedEmail('trial_expired', email, { firstName });
}

/**
 * Send welcome email using template
 */
export async function sendWelcomeEmail(
  email: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  return sendTemplatedEmail('welcome', email, { firstName });
}

/**
 * Send team invitation email using template
 */
export async function sendTeamInvitationEmail(
  email: string,
  inviterName: string,
  businessName: string,
  role: string,
  token: string,
  expirationDate: string
): Promise<{ success: boolean; error?: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.promptreviews.app';
  const acceptUrl = `${baseUrl}/team/accept?token=${token}`;
  const trackingPixelUrl = `${baseUrl}/api/team/invitations/track?token=${token}&event=opened`;
  const trackingClickUrl = `${baseUrl}/api/team/invitations/track?token=${token}&event=clicked&redirect=${encodeURIComponent(acceptUrl)}`;
    
  const result = await sendTemplatedEmail('team_invitation', email, {
    inviterName,
    businessName,
    role,
    acceptUrl: trackingClickUrl, // Use tracking URL for clicks
    expirationDate,
    trackingPixel: trackingPixelUrl
  });

  // Log the 'sent' event if email was sent successfully
  if (result.success) {
    try {
      await fetch(`${baseUrl}/api/team/invitations/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitation_token: token,
          event_type: 'sent',
          event_data: {
            recipient: email,
            sent_at: new Date().toISOString()
          }
        })
      });
    } catch (trackingError) {
      console.warn('Failed to log invitation sent event:', trackingError);
      // Don't fail the email send for tracking errors
    }
  }

  return result;
}

/**
 * Get all email templates for admin interface
 */
export async function getAllEmailTemplates(): Promise<EmailTemplate[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching email templates:', error);
    return [];
  }

  return data || [];
}

/**
 * Update an email template
 */
export async function updateEmailTemplate(
  id: string,
  updates: Partial<EmailTemplate>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('email_templates')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating email template:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Send GBP profile protection alert email
 * @param changeSource - 'google' for Google suggestions, 'owner' for direct profile edits
 */
export async function sendGbpProtectionAlertEmail(
  email: string,
  firstName: string,
  locationName: string,
  fieldChanged: string,
  oldValue: string,
  newValue: string,
  changeSource: 'google' | 'owner' = 'google'
): Promise<{ success: boolean; error?: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.promptreviews.app';
  const protectionUrl = `${baseUrl}/dashboard/google-business?tab=protection`;

  const isGoogleChange = changeSource === 'google';

  // Dynamic content based on change source
  const headline = isGoogleChange
    ? 'Google Suggested a Change to Your Business Profile'
    : 'Your Business Profile Was Changed';
  const headerColor = isGoogleChange ? '#f59e0b' : '#3b82f6';
  const borderColor = isGoogleChange ? '#f59e0b' : '#3b82f6';
  const bgColor = isGoogleChange ? '#fef3c7' : '#eff6ff';
  const labelColor = isGoogleChange ? '#92400e' : '#1e40af';
  const description = isGoogleChange
    ? `Google has suggested a change to <strong>${locationName}</strong>. Review the change and decide whether to accept or reject it.`
    : `A change was made to <strong>${locationName}</strong>. This may have been done by you, a team member, or a third party with access to your Google Business Profile.`;
  const newValueLabel = isGoogleChange ? "Google's Suggestion" : 'New Value';
  const buttonText = isGoogleChange ? 'Review This Change' : 'View Change Details';
  const whyText = isGoogleChange
    ? 'You have GBP Profile Protection enabled, which monitors your Google Business Profile for changes suggested by Google and allows you to accept or reject them with one click.'
    : 'You have GBP Profile Protection enabled, which monitors your Google Business Profile for any changes and keeps you informed.';

  // Use fallback HTML since template may not exist yet
  const fallbackHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: ${headerColor}; margin-bottom: 20px;">${headline}</h2>

      <p style="color: #475569; margin-bottom: 20px;">
        Hi ${firstName || 'there'},
      </p>

      <p style="color: #475569; margin-bottom: 20px;">
        ${description}
      </p>

      <div style="background: ${bgColor}; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${borderColor};">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: ${labelColor};">
          ${fieldChanged}
        </p>
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 200px;">
            <p style="color: #dc2626; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">Previous Value</p>
            <p style="color: #475569; margin: 0; padding: 10px; background: #fff; border-radius: 4px;">${oldValue || 'Not set'}</p>
          </div>
          <div style="flex: 1; min-width: 200px;">
            <p style="color: #16a34a; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">${newValueLabel}</p>
            <p style="color: #475569; margin: 0; padding: 10px; background: #fff; border-radius: 4px;">${newValue || 'Not set'}</p>
          </div>
        </div>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${protectionUrl}"
           style="background: ${headerColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          ${buttonText}
        </a>
      </div>

      <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
        <strong>Why am I receiving this?</strong><br>
        ${whyText}
      </p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

      <p style="color: #94a3b8; font-size: 12px; text-align: center;">
        Prompt Reviews | <a href="${protectionUrl}" style="color: #94a3b8;">Manage Protection Settings</a>
      </p>
    </div>
  `;

  const fallbackText = `
${headline}

Hi ${firstName || 'there'},

${isGoogleChange
  ? `Google has suggested a change to ${locationName}. Review the change and decide whether to accept or reject it.`
  : `A change was made to ${locationName}. This may have been done by you, a team member, or a third party with access to your Google Business Profile.`}

${fieldChanged}
Previous: ${oldValue || 'Not set'}
${newValueLabel}: ${newValue || 'Not set'}

Review this change: ${protectionUrl}

Why am I receiving this?
${whyText}
  `;

  const subject = isGoogleChange
    ? `Google suggested a change to ${locationName}`
    : `Your profile "${locationName}" was changed`;

  return sendTemplatedEmail({
    templateName: isGoogleChange ? 'gbp_protection_alert' : 'gbp_protection_alert_owner',
    to: email,
    variables: {
      firstName,
      locationName,
      fieldChanged,
      oldValue,
      newValue,
      newValueLabel,
      protectionUrl,
      headline,
      description: isGoogleChange
        ? `Google has suggested a change to <strong>${locationName}</strong>. Review the change and decide whether to accept or reject it.`
        : `A change was made to <strong>${locationName}</strong>. This may have been done by you, a team member, or a third party with access to your Google Business Profile.`,
      buttonText,
      whyText
    },
    fallbackSubject: subject,
    fallbackHtml,
    fallbackText
  });
} 