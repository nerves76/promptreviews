/**
 * Google Biz Optimizer Email Service
 *
 * Handles automated email sequences for optimizer leads including:
 * - Welcome email (immediate)
 * - Follow-up email (24 hours if no PDF download)
 * - Nurture emails (tips and case studies)
 * - Trial offer email (14 days if not converted)
 */

import { createServiceRoleClient } from '@/auth/providers/supabase';
import { sendResendEmail } from '@/utils/resend';
import { getEmailTemplate, renderTemplate } from '@/utils/emailTemplates';

interface EmailSendRecord {
  id: string;
  lead_id: string;
  email_type: string;
  sent_at: string;
  success: boolean;
  error_message?: string;
}

interface OptimizerLead {
  id: string;
  email: string;
  business_name?: string;
  created_at: string;
  pdf_downloaded: boolean;
  pdf_download_date?: string;
  signed_up_for_trial: boolean;
  trial_start_date?: string;
  converted_to_customer: boolean;
  customer_conversion_date?: string;
  email_unsubscribed?: boolean;
  email_unsubscribed_at?: string;
}

/**
 * Get lead by ID
 */
export async function getOptimizerLead(leadId: string): Promise<OptimizerLead | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('optimizer_leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (error) {
    console.error(`Error fetching optimizer lead ${leadId}:`, error);
    return null;
  }

  return data;
}

/**
 * Get leads that need specific email types
 */
export async function getLeadsForEmailType(emailType: string): Promise<OptimizerLead[]> {
  const supabase = createServiceRoleClient();
  let query = supabase.from('optimizer_leads')
    .select('*')
    .eq('email_unsubscribed', false); // Only include leads who haven't unsubscribed

  const now = new Date();

  switch (emailType) {
    case 'followup':
      // Leads who haven't downloaded PDF after 24 hours
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      query = query
        .eq('pdf_downloaded', false)
        .lt('created_at', twentyFourHoursAgo.toISOString())
        // Exclude leads who already received this email
        .not('id', 'in', `(SELECT lead_id FROM optimizer_email_sends WHERE email_type = 'followup')`);
      break;

    case 'nurture_tips':
      // Leads created 3 days ago
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      query = query
        .lt('created_at', threeDaysAgo.toISOString())
        .gt('created_at', new Date(threeDaysAgo.getTime() - 24 * 60 * 60 * 1000).toISOString())
        .not('id', 'in', `(SELECT lead_id FROM optimizer_email_sends WHERE email_type = 'nurture_tips')`);
      break;

    case 'nurture_case_study':
      // Leads created 7 days ago
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      query = query
        .lt('created_at', sevenDaysAgo.toISOString())
        .gt('created_at', new Date(sevenDaysAgo.getTime() - 24 * 60 * 60 * 1000).toISOString())
        .not('id', 'in', `(SELECT lead_id FROM optimizer_email_sends WHERE email_type = 'nurture_case_study')`);
      break;

    case 'trial_offer':
      // Leads created 14 days ago who haven't converted
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      query = query
        .eq('signed_up_for_trial', false)
        .eq('converted_to_customer', false)
        .lt('created_at', fourteenDaysAgo.toISOString())
        .gt('created_at', new Date(fourteenDaysAgo.getTime() - 24 * 60 * 60 * 1000).toISOString())
        .not('id', 'in', `(SELECT lead_id FROM optimizer_email_sends WHERE email_type = 'trial_offer')`);
      break;

    default:
      console.error(`Unknown email type: ${emailType}`);
      return [];
  }

  const { data, error } = await query;

  if (error) {
    console.error(`Error fetching leads for email type ${emailType}:`, error);
    return [];
  }

  return data || [];
}

/**
 * Check if email was already sent to a lead
 */
export async function wasEmailSent(leadId: string, emailType: string): Promise<boolean> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('optimizer_email_sends')
    .select('id')
    .eq('lead_id', leadId)
    .eq('email_type', emailType)
    .eq('success', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error(`Error checking email send status:`, error);
    return false;
  }

  return !!data;
}

/**
 * Record email send attempt
 */
export async function recordEmailSend(
  leadId: string,
  emailType: string,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('optimizer_email_sends')
    .insert({
      lead_id: leadId,
      email_type: emailType,
      sent_at: new Date().toISOString(),
      success,
      error_message: errorMessage
    });

  if (error) {
    console.error(`Error recording email send:`, error);
  }
}

/**
 * Generate email variables for template rendering
 */
function generateEmailVariables(lead: OptimizerLead): Record<string, any> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.promptreviews.app';

  return {
    businessName: lead.business_name || 'there',
    email: lead.email,
    reportUrl: `${baseUrl}/optimizer-report/${lead.id}`,
    unsubscribeUrl: `${baseUrl}/unsubscribe/optimizer/${lead.id}`,
    signupUrl: `${baseUrl}/auth/sign-up?utm_source=optimizer&utm_campaign=email`,
    trialUrl: `${baseUrl}/auth/sign-up?utm_source=optimizer&utm_campaign=trial_offer&promo=OPTIMIZER30`,
  };
}

/**
 * Send welcome email immediately after lead capture
 */
export async function sendWelcomeEmail(leadId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const lead = await getOptimizerLead(leadId);
    if (!lead) {
      return { success: false, error: 'Lead not found' };
    }

    // Check if lead has unsubscribed
    if (lead.email_unsubscribed) {
      return { success: true }; // Don't send to unsubscribed leads
    }

    // Check if already sent
    const alreadySent = await wasEmailSent(leadId, 'welcome');
    if (alreadySent) {
      return { success: true }; // Don't send duplicates
    }

    const template = await getEmailTemplate('optimizer_welcome');
    if (!template) {
      return { success: false, error: 'Welcome email template not found' };
    }

    const variables = generateEmailVariables(lead);
    const subject = renderTemplate(template.subject, variables);
    const htmlContent = renderTemplate(template.html_content, variables);
    const textContent = template.text_content
      ? renderTemplate(template.text_content, variables)
      : undefined;

    const result = await sendResendEmail({
      to: lead.email,
      subject,
      html: htmlContent,
      text: textContent,
      from: "PromptReviews <optimizer@updates.promptreviews.app>"
    });

    await recordEmailSend(leadId, 'welcome', true);
    return { success: true };

  } catch (error) {
    console.error('Error sending welcome email:', error);
    await recordEmailSend(leadId, 'welcome', false, error instanceof Error ? error.message : 'Unknown error');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send follow-up email if PDF not downloaded after 24 hours
 */
export async function sendFollowupEmail(leadId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const lead = await getOptimizerLead(leadId);
    if (!lead) {
      return { success: false, error: 'Lead not found' };
    }

    // Don't send if they already downloaded the PDF
    if (lead.pdf_downloaded) {
      return { success: true };
    }

    // Check if already sent
    const alreadySent = await wasEmailSent(leadId, 'followup');
    if (alreadySent) {
      return { success: true };
    }

    const template = await getEmailTemplate('optimizer_followup');
    if (!template) {
      return { success: false, error: 'Follow-up email template not found' };
    }

    const variables = generateEmailVariables(lead);
    const subject = renderTemplate(template.subject, variables);
    const htmlContent = renderTemplate(template.html_content, variables);
    const textContent = template.text_content
      ? renderTemplate(template.text_content, variables)
      : undefined;

    const result = await sendResendEmail({
      to: lead.email,
      subject,
      html: htmlContent,
      text: textContent,
      from: "PromptReviews <optimizer@updates.promptreviews.app>"
    });

    await recordEmailSend(leadId, 'followup', true);
    return { success: true };

  } catch (error) {
    console.error('Error sending follow-up email:', error);
    await recordEmailSend(leadId, 'followup', false, error instanceof Error ? error.message : 'Unknown error');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send nurture email with tips (3 days after signup)
 */
export async function sendNurtureTipsEmail(leadId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const lead = await getOptimizerLead(leadId);
    if (!lead) {
      return { success: false, error: 'Lead not found' };
    }

    // Don't send if they already converted
    if (lead.converted_to_customer) {
      return { success: true };
    }

    // Check if already sent
    const alreadySent = await wasEmailSent(leadId, 'nurture_tips');
    if (alreadySent) {
      return { success: true };
    }

    const template = await getEmailTemplate('optimizer_nurture_tips');
    if (!template) {
      return { success: false, error: 'Nurture tips email template not found' };
    }

    const variables = generateEmailVariables(lead);
    const subject = renderTemplate(template.subject, variables);
    const htmlContent = renderTemplate(template.html_content, variables);
    const textContent = template.text_content
      ? renderTemplate(template.text_content, variables)
      : undefined;

    const result = await sendResendEmail({
      to: lead.email,
      subject,
      html: htmlContent,
      text: textContent,
      from: "PromptReviews <optimizer@updates.promptreviews.app>"
    });

    await recordEmailSend(leadId, 'nurture_tips', true);
    return { success: true };

  } catch (error) {
    console.error('Error sending nurture tips email:', error);
    await recordEmailSend(leadId, 'nurture_tips', false, error instanceof Error ? error.message : 'Unknown error');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send case study email (7 days after signup)
 */
export async function sendCaseStudyEmail(leadId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const lead = await getOptimizerLead(leadId);
    if (!lead) {
      return { success: false, error: 'Lead not found' };
    }

    // Don't send if they already converted
    if (lead.converted_to_customer) {
      return { success: true };
    }

    // Check if already sent
    const alreadySent = await wasEmailSent(leadId, 'nurture_case_study');
    if (alreadySent) {
      return { success: true };
    }

    const template = await getEmailTemplate('optimizer_case_study');
    if (!template) {
      return { success: false, error: 'Case study email template not found' };
    }

    const variables = generateEmailVariables(lead);
    const subject = renderTemplate(template.subject, variables);
    const htmlContent = renderTemplate(template.html_content, variables);
    const textContent = template.text_content
      ? renderTemplate(template.text_content, variables)
      : undefined;

    const result = await sendResendEmail({
      to: lead.email,
      subject,
      html: htmlContent,
      text: textContent,
      from: "PromptReviews <optimizer@updates.promptreviews.app>"
    });

    await recordEmailSend(leadId, 'nurture_case_study', true);
    return { success: true };

  } catch (error) {
    console.error('Error sending case study email:', error);
    await recordEmailSend(leadId, 'nurture_case_study', false, error instanceof Error ? error.message : 'Unknown error');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send trial offer email (14 days after signup if not converted)
 */
export async function sendTrialOfferEmail(leadId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const lead = await getOptimizerLead(leadId);
    if (!lead) {
      return { success: false, error: 'Lead not found' };
    }

    // Don't send if they already converted or started trial
    if (lead.converted_to_customer || lead.signed_up_for_trial) {
      return { success: true };
    }

    // Check if already sent
    const alreadySent = await wasEmailSent(leadId, 'trial_offer');
    if (alreadySent) {
      return { success: true };
    }

    const template = await getEmailTemplate('optimizer_trial_offer');
    if (!template) {
      return { success: false, error: 'Trial offer email template not found' };
    }

    const variables = generateEmailVariables(lead);
    const subject = renderTemplate(template.subject, variables);
    const htmlContent = renderTemplate(template.html_content, variables);
    const textContent = template.text_content
      ? renderTemplate(template.text_content, variables)
      : undefined;

    const result = await sendResendEmail({
      to: lead.email,
      subject,
      html: htmlContent,
      text: textContent,
      from: "PromptReviews <optimizer@updates.promptreviews.app>"
    });

    await recordEmailSend(leadId, 'trial_offer', true);
    return { success: true };

  } catch (error) {
    console.error('Error sending trial offer email:', error);
    await recordEmailSend(leadId, 'trial_offer', false, error instanceof Error ? error.message : 'Unknown error');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Process batch email sends for scheduled emails
 */
export async function processBatchEmails(emailType: string, batchSize: number = 50): Promise<{
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
}> {
  console.log(`Processing batch emails for type: ${emailType}`);

  const leads = await getLeadsForEmailType(emailType);
  const totalLeads = leads.length;
  const processLeads = leads.slice(0, batchSize);

  console.log(`Found ${totalLeads} leads for ${emailType}, processing ${processLeads.length}`);

  let successful = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const lead of processLeads) {
    let result;

    switch (emailType) {
      case 'followup':
        result = await sendFollowupEmail(lead.id);
        break;
      case 'nurture_tips':
        result = await sendNurtureTipsEmail(lead.id);
        break;
      case 'nurture_case_study':
        result = await sendCaseStudyEmail(lead.id);
        break;
      case 'trial_offer':
        result = await sendTrialOfferEmail(lead.id);
        break;
      default:
        result = { success: false, error: 'Unknown email type' };
    }

    if (result.success) {
      successful++;
      console.log(`✅ Sent ${emailType} email to ${lead.email}`);
    } else {
      failed++;
      const error = `Failed to send ${emailType} to ${lead.email}: ${result.error}`;
      errors.push(error);
      console.error(`❌ ${error}`);
    }

    // Rate limiting - small delay between sends
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return {
    processed: processLeads.length,
    successful,
    failed,
    errors
  };
}

/**
 * Update lead conversion status
 */
export async function updateLeadConversionStatus(
  leadId: string,
  updates: {
    pdf_downloaded?: boolean;
    pdf_download_date?: string;
    signed_up_for_trial?: boolean;
    trial_start_date?: string;
    converted_to_customer?: boolean;
    customer_conversion_date?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('optimizer_leads')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', leadId);

  if (error) {
    console.error(`Error updating lead ${leadId}:`, error);
    return { success: false, error: error.message };
  }

  return { success: true };
}