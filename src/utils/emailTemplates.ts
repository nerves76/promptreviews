/**
 * Email Templates Utility
 * 
 * Handles fetching, rendering, and sending email templates from the database
 */

import { createServiceRoleClient } from '@/utils/supabaseClient';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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
  templateName: string,
  to: string,
  variables: TemplateVariables
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🎯 sendTemplatedEmail called:', {
      templateName,
      to,
      variableKeys: Object.keys(variables)
    });

    // Get the template
    const template = await getEmailTemplate(templateName);
    if (!template) {
      console.error('❌ Template not found:', templateName);
      return { success: false, error: `Template '${templateName}' not found` };
    }

    console.log('✅ Template found:', {
      templateName: template.name,
      isActive: template.is_active,
      subjectLength: template.subject.length,
      htmlContentLength: template.html_content.length
    });

    // Set default URLs if not provided
    const defaultVariables: TemplateVariables = {
      dashboardUrl: process.env.NEXT_PUBLIC_APP_URL 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
        : 'https://app.promptreviews.app/dashboard',
      loginUrl: process.env.NEXT_PUBLIC_APP_URL 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/sign-in`
        : 'https://app.promptreviews.app/auth/sign-in',
      upgradeUrl: process.env.NEXT_PUBLIC_APP_URL 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/plan`
        : 'https://app.promptreviews.app/dashboard/plan',
      ...variables
    };

    // Render the template
    const subject = renderTemplate(template.subject, defaultVariables);
    const htmlContent = renderTemplate(template.html_content, defaultVariables);
    const textContent = template.text_content 
      ? renderTemplate(template.text_content, defaultVariables)
      : undefined;

    console.log('📧 About to send email with Resend:', {
      from: "Prompt Reviews <team@updates.promptreviews.app>",
      to,
      subjectLength: subject.length,
      hasHtml: !!htmlContent,
      hasText: !!textContent
    });

    // Send the email
    const result = await resend.emails.send({
      from: "Prompt Reviews <team@updates.promptreviews.app>",
      to,
      subject,
      html: htmlContent,
      ...(textContent && { text: textContent })
    });

    console.log('✅ Resend API success:', {
      id: result.data?.id,
      from: "team@updates.promptreviews.app"
    });

    return { success: true };
  } catch (error) {
    console.error(`❌ Error sending templated email '${templateName}':`, error);
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
    console.log('No admin emails configured, skipping admin notification');
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
        console.log(`✅ Admin notification sent to ${adminEmail} using template`);
      } else {
        // Fallback to direct email if template doesn't exist
        console.log(`Template not found, falling back to direct email for ${adminEmail}`);
        
        const result = await resend.emails.send({
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
        console.log(`✅ Admin notification sent to ${adminEmail} using fallback method`);
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
  console.log('🎯 sendTeamInvitationEmail called with:', {
    email,
    inviterName,
    businessName,
    role,
    tokenPresent: !!token,
    expirationDate
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.promptreviews.app';
  const acceptUrl = `${baseUrl}/team/accept?token=${token}`;
  const trackingPixelUrl = `${baseUrl}/api/team/invitations/track?token=${token}&event=opened`;
  const trackingClickUrl = `${baseUrl}/api/team/invitations/track?token=${token}&event=clicked&redirect=${encodeURIComponent(acceptUrl)}`;
    
  console.log('🔗 Generated URLs:', {
    baseUrl,
    acceptUrl: acceptUrl.substring(0, 50) + '...',
    trackingPixelUrl: trackingPixelUrl.substring(0, 50) + '...',
    trackingClickUrl: trackingClickUrl.substring(0, 50) + '...'
  });

  const result = await sendTemplatedEmail('team_invitation', email, {
    inviterName,
    businessName,
    role,
    acceptUrl: trackingClickUrl, // Use tracking URL for clicks
    expirationDate,
    trackingPixel: trackingPixelUrl
  });

  console.log('📧 sendTemplatedEmail result:', {
    success: result.success,
    error: result.error,
    templateName: 'team_invitation'
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