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
    // Get the template
    const template = await getEmailTemplate(templateName);
    if (!template) {
      return { success: false, error: `Template '${templateName}' not found` };
    }

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

    // Send the email
    const result = await resend.emails.send({
      from: "Prompt Reviews <noreply@updates.promptreviews.app>",
      to,
      subject,
      html: htmlContent,
      ...(textContent && { text: textContent })
    });

    return { success: true };
  } catch (error) {
    console.error(`Error sending templated email '${templateName}':`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send trial reminder email (3 days before expiry)
 */
export async function sendTrialReminderEmail(
  email: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  return sendTemplatedEmail('trial_reminder', email, { firstName });
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
  const acceptUrl = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/team/accept?token=${token}`
    : `https://app.promptreviews.app/team/accept?token=${token}`;
    
  return sendTemplatedEmail('team_invitation', email, {
    inviterName,
    businessName,
    role,
    acceptUrl,
    expirationDate
  });
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