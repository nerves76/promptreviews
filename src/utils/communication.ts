/**
 * Communication tracking utilities
 * Handles creating, updating and managing communication records and follow-up reminders
 */

import { createClient } from '@/auth/providers/supabase';

export interface CommunicationRecord {
  id: string;
  account_id: string;
  contact_id: string;
  prompt_page_id?: string;
  communication_type: 'email' | 'sms';
  status: 'draft' | 'sent' | 'failed';
  subject?: string;
  message_content: string;
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FollowUpReminder {
  id: string;
  communication_record_id: string;
  account_id: string;
  contact_id: string;
  reminder_type: string;
  reminder_date: string;
  status: 'pending' | 'sent' | 'completed' | 'cancelled';
  custom_message?: string;
  created_at: string;
  updated_at: string;
}

export interface CommunicationTemplate {
  id: string;
  account_id: string;
  name: string;
  communication_type: 'email' | 'sms';
  template_type: 'initial' | 'follow_up';
  subject_template?: string;
  message_template: string;
  is_default: boolean;
  is_active: boolean;
}

export interface CreateCommunicationData {
  contactId: string;
  promptPageId?: string;
  communicationType: 'email' | 'sms';
  subject?: string;
  message: string;
  followUpReminder?: string;
}

/**
 * Create a communication record
 */
export async function createCommunicationRecord(
  data: CreateCommunicationData,
  accountId: string,
  supabase?: any
): Promise<CommunicationRecord> {
  // Use provided supabase client or create new one
  const client = supabase || createClient();
  
  // Check account ID
  if (!accountId) {
    throw new Error('No account ID provided');
  }

  // Create communication record
  const { data: record, error } = await client
    .from('communication_records')
    .insert({
      account_id: accountId,
      contact_id: data.contactId,
      prompt_page_id: data.promptPageId,
      communication_type: data.communicationType,
      status: 'sent', // Mark as sent since user is manually opening app
      subject: data.subject,
      message_content: data.message,
      sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create communication record: ${error.message}`);
  }

  // Create follow-up reminder if requested
  if (data.followUpReminder) {
    await createFollowUpReminder(record.id, data.followUpReminder, accountId, data.contactId, client);
  }

  return record;
}

/**
 * Create a follow-up reminder
 */
export async function createFollowUpReminder(
  communicationRecordId: string,
  reminderType: string,
  accountId: string,
  contactId: string,
  supabase?: any
): Promise<FollowUpReminder> {
  const client = supabase || createClient();
  
  // Calculate reminder date
  const reminderDate = calculateReminderDate(reminderType);
  
  const { data: reminder, error } = await client
    .from('follow_up_reminders')
    .insert({
      communication_record_id: communicationRecordId,
      account_id: accountId,
      contact_id: contactId,
      reminder_type: reminderType,
      reminder_date: reminderDate.toISOString(),
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create follow-up reminder: ${error.message}`);
  }

  return reminder;
}

/**
 * Get communication history for a contact
 */
export async function getCommunicationHistory(
  contactId: string,
  accountId: string
): Promise<CommunicationRecord[]> {
  const supabase = createClient();
  
  if (!accountId) {
    // Return empty array if no account ID provided
    console.log('No account ID provided for communication history - returning empty array');
    return [];
  }

  const { data: records, error } = await supabase
    .from('communication_records')
    .select(`
      *,
      follow_up_reminders (
        id,
        reminder_type,
        reminder_date,
        status
      )
    `)
    .eq('contact_id', contactId)
    .eq('account_id', accountId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch communication history: ${error.message}`);
  }

  return records || [];
}

/**
 * Get pending follow-up reminders
 */
export async function getPendingReminders(
  accountId: string,
  limit = 50
): Promise<FollowUpReminder[]> {
  const supabase = createClient();
  
  if (!accountId) {
    // Return empty array if no account ID provided
    console.log('No account ID provided for pending reminders - returning empty array');
    return [];
  }

  const { data: reminders, error } = await supabase
    .from('follow_up_reminders')
    .select(`
      *,
      communication_records (
        id,
        communication_type,
        subject,
        message_content
      ),
      contacts (
        id,
        first_name,
        last_name,
        email,
        phone
      )
    `)
    .eq('account_id', accountId)
    .eq('status', 'pending')
    .lte('reminder_date', new Date().toISOString())
    .order('reminder_date', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch pending reminders: ${error.message}`);
  }

  return reminders || [];
}

/**
 * Mark reminder as completed
 */
export async function completeReminder(
  reminderId: string,
  accountId: string
): Promise<void> {
  const supabase = createClient();
  
  if (!accountId) {
    throw new Error('No account ID provided');
  }

  const { error } = await supabase
    .from('follow_up_reminders')
    .update({ status: 'completed' })
    .eq('id', reminderId)
    .eq('account_id', accountId);

  if (error) {
    throw new Error(`Failed to complete reminder: ${error.message}`);
  }
}

/**
 * Get or create default communication templates for an account
 */
export async function getDefaultTemplates(
  accountId: string,
  communicationType: 'email' | 'sms'
): Promise<CommunicationTemplate[]> {
  const supabase = createClient();
  
  if (!accountId) {
    throw new Error('No account ID provided');
  }

  // First, try to get existing templates
  const { data: existingTemplates } = await supabase
    .from('communication_templates')
    .select('*')
    .eq('account_id', accountId)
    .eq('communication_type', communicationType)
    .eq('is_active', true);

  if (existingTemplates && existingTemplates.length > 0) {
    return existingTemplates;
  }

  // Create default templates if none exist
  return await createDefaultTemplates(accountId, communicationType, supabase);
}

/**
 * Create default templates for an account
 */
async function createDefaultTemplates(
  accountId: string,
  communicationType: 'email' | 'sms',
  supabase: any
): Promise<CommunicationTemplate[]> {
  const templates = getDefaultTemplateContent(communicationType);
  
  const { data: createdTemplates, error } = await supabase
    .from('communication_templates')
    .insert(
      templates.map(template => ({
        ...template,
        account_id: accountId
      }))
    )
    .select();

  if (error) {
    throw new Error(`Failed to create default templates: ${error.message}`);
  }

  return createdTemplates || [];
}

/**
 * Calculate reminder date based on reminder type
 */
function calculateReminderDate(reminderType: string): Date {
  const now = new Date();
  
  switch (reminderType) {
    case '1_week':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case '2_weeks':
      return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    case '3_weeks':
      return new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);
    case '1_month':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case '2_months':
      return new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    case '3_months':
      return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    case '4_months':
      return new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000);
    case '5_months':
      return new Date(now.getTime() + 150 * 24 * 60 * 60 * 1000);
    case '6_months':
      return new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
    default:
      throw new Error(`Invalid reminder type: ${reminderType}`);
  }
}

/**
 * Get default template content
 */
function getDefaultTemplateContent(communicationType: 'email' | 'sms') {
  if (communicationType === 'email') {
    return [
      {
        name: 'Initial Review Request',
        communication_type: 'email',
        template_type: 'initial',
        subject_template: 'Review Request from {{business_name}}',
        message_template: `Hi {{customer_name}},

Thank you for choosing {{business_name}}! We hope you had a great experience with us.

We would greatly appreciate it if you could take a moment to share your feedback by leaving us a review. Your review helps us improve our services and helps other customers find us.

You can leave your review here: {{review_url}}

Thank you for your time and support!

Best regards,
{{business_name}} Team`,
        is_default: true,
        is_active: true
      },
      {
        name: 'Follow-up Reminder',
        communication_type: 'email',
        template_type: 'follow_up',
        subject_template: 'Friendly reminder - {{business_name}}',
        message_template: `Hi {{customer_name}},

We hope you're doing well! This is just a friendly reminder about leaving us a review.

We'd still love to hear about your experience with {{business_name}}. Your feedback means the world to us and helps other customers discover our services.

You can leave your review here: {{review_url}}

Thank you so much!

Best regards,
{{business_name}} Team`,
        is_default: false,
        is_active: true
      }
    ];
  } else {
    return [
      {
        name: 'Initial Review Request',
        communication_type: 'sms',
        template_type: 'initial',
        message_template: 'Hi {{customer_name}}! Thanks for choosing {{business_name}}. We\'d love your feedback! Please leave us a review: {{review_url}} Your review helps us serve you better. Thank you!',
        is_default: true,
        is_active: true
      },
      {
        name: 'Follow-up Reminder',
        communication_type: 'sms',
        template_type: 'follow_up',
        message_template: 'Hi {{customer_name}}! Friendly reminder from {{business_name}} - we\'d still appreciate your review: {{review_url}} Thank you!',
        is_default: false,
        is_active: true
      }
    ];
  }
}