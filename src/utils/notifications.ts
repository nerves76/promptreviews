/**
 * Notifications Utility
 *
 * Centralized notification system with registry pattern.
 * Adding a new notification type requires:
 * 1. Add to NotificationType union
 * 2. Add config to NOTIFICATION_REGISTRY
 * 3. Add email template to database (name = notification type)
 * 4. Add preference columns to notification_preferences table
 */

import { createServiceRoleClient } from '@/auth/providers/supabase';
import { sendTemplatedEmail } from './emailTemplates';

// =============================================================================
// TYPES
// =============================================================================

export type NotificationType =
  | 'gbp_change_detected'
  | 'new_review_received'
  | 'team_invitation'
  | 'subscription_update'
  | 'system_announcement'
  | 'review_auto_verified';

export interface NotificationData {
  [key: string]: any;
}

export interface NotificationConfig {
  /** Preference field for in-app notifications */
  inAppPrefField: string;
  /** Preference field for email notifications */
  emailPrefField: string;
  /** Email template name (defaults to notification type if not specified) */
  emailTemplate?: string;
  /** Generate notification title from data */
  getTitle: (data: NotificationData) => string;
  /** Generate notification message from data */
  getMessage: (data: NotificationData) => string;
  /** Default action URL */
  actionUrl?: string;
  /** Default action label */
  actionLabel?: string;
  /** Transform data for email variables (optional, defaults to passing data as-is) */
  getEmailVariables?: (data: NotificationData, baseUrl: string) => Record<string, any>;
}

export interface SendNotificationParams {
  accountId: string;
  /** If provided, notification only goes to this user. If null, goes to all account users */
  userId?: string | null;
  /** The notification type (must be in registry) */
  type: NotificationType;
  /** Data for the notification (passed to title/message generators) */
  data: NotificationData;
  /** Override action URL from registry */
  actionUrl?: string;
  /** Override action label from registry */
  actionLabel?: string;
}

export interface SendNotificationResult {
  success: boolean;
  notificationId?: string;
  emailSent?: boolean;
  error?: string;
}

// =============================================================================
// NOTIFICATION REGISTRY
// =============================================================================

/**
 * Central registry for all notification types.
 * Each type defines its preferences fields, content generators, and email config.
 */
export const NOTIFICATION_REGISTRY: Record<NotificationType, NotificationConfig> = {
  'gbp_change_detected': {
    inAppPrefField: 'in_app_gbp_changes',
    emailPrefField: 'email_gbp_changes',
    emailTemplate: 'gbp_protection_alert',
    getTitle: (data) => data.changeSource === 'google'
      ? 'Google Suggested a Change'
      : 'Profile Change Detected',
    getMessage: (data) => data.changeSource === 'google'
      ? `Google suggested a change to ${data.fieldChanged} for ${data.locationName}`
      : `${data.fieldChanged} was changed for ${data.locationName}`,
    actionUrl: '/dashboard/google-business?tab=protection',
    actionLabel: 'Review Change',
    getEmailVariables: (data, baseUrl) => ({
      firstName: data.firstName || 'there',
      locationName: data.locationName,
      fieldChanged: data.fieldChanged,
      oldValue: data.oldValue,
      newValue: data.newValue,
      protectionUrl: `${baseUrl}/dashboard/google-business?tab=protection`,
    }),
  },

  'new_review_received': {
    inAppPrefField: 'in_app_new_reviews',
    emailPrefField: 'email_new_reviews',
    getTitle: () => 'New Review Received',
    getMessage: (data) => `${data.reviewerName || 'Someone'} left a ${data.starRating || 5}-star review`,
    actionUrl: '/dashboard/reviews',
    actionLabel: 'View Review',
  },

  'team_invitation': {
    inAppPrefField: 'in_app_team_updates',
    emailPrefField: 'email_team_updates',
    getTitle: () => 'Team Invitation',
    getMessage: (data) => `You've been invited to join ${data.businessName || 'a team'}`,
    actionUrl: '/dashboard/team',
    actionLabel: 'View Invitation',
  },

  'subscription_update': {
    inAppPrefField: 'in_app_subscription_updates',
    emailPrefField: 'email_subscription_updates',
    getTitle: (data) => data.title || 'Subscription Update',
    getMessage: (data) => data.message || 'Your subscription has been updated',
    actionUrl: '/dashboard/plan',
    actionLabel: 'View Plan',
  },

  'system_announcement': {
    inAppPrefField: 'in_app_announcements',
    emailPrefField: 'email_announcements',
    getTitle: (data) => data.title || 'Announcement',
    getMessage: (data) => data.message || 'You have a new announcement',
  },

  'review_auto_verified': {
    inAppPrefField: 'in_app_review_auto_verified',
    emailPrefField: 'email_review_auto_verified',
    getTitle: () => 'Review Verified on Google',
    getMessage: (data) => {
      const truncated = data.reviewContent && data.reviewContent.length > 100
        ? data.reviewContent.substring(0, 100) + '...'
        : data.reviewContent || '';
      const locationPart = data.locationName ? ` for ${data.locationName}` : '';
      return `${data.reviewerName || 'A customer'} left a ${data.starRating || 5}-star review${locationPart}: "${truncated}"`;
    },
    actionUrl: '/dashboard/reviews',
    actionLabel: 'View Reviews',
    getEmailVariables: (data, baseUrl) => ({
      firstName: data.firstName || 'there',
      reviewerName: data.reviewerName || 'A customer',
      reviewContent: data.reviewContent || '',
      starRatingStars: '★'.repeat(data.starRating || 5) + '☆'.repeat(5 - (data.starRating || 5)),
      locationName: data.locationName || '',
      reviewsUrl: `${baseUrl}/dashboard/reviews`,
      accountUrl: `${baseUrl}/dashboard/account`,
    }),
  },
};

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Send a notification (in-app + email if enabled)
 *
 * This is the main entry point for sending notifications.
 * It handles preference checking, notification creation, and email sending.
 *
 * @example
 * await sendNotification({
 *   accountId: 'abc123',
 *   type: 'review_auto_verified',
 *   data: {
 *     reviewerName: 'John Doe',
 *     reviewContent: 'Great service!',
 *     starRating: 5,
 *   }
 * });
 */
export async function sendNotification(params: SendNotificationParams): Promise<SendNotificationResult> {
  const { accountId, userId, type, data, actionUrl, actionLabel } = params;

  const config = NOTIFICATION_REGISTRY[type];
  if (!config) {
    console.error(`Unknown notification type: ${type}`);
    return { success: false, error: `Unknown notification type: ${type}` };
  }

  try {
    const supabase = createServiceRoleClient();

    // Fetch preferences once
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('account_id', accountId)
      .single();

    // Check if in-app notification is enabled
    const inAppEnabled = !preferences || preferences[config.inAppPrefField] !== false;

    let notificationId: string | undefined;

    if (inAppEnabled) {
      // Create in-app notification
      const { data: notifData, error: notifError } = await supabase
        .from('notifications')
        .insert({
          account_id: accountId,
          user_id: userId || null,
          type,
          title: config.getTitle(data),
          message: config.getMessage(data),
          action_url: actionUrl || config.actionUrl || null,
          action_label: actionLabel || config.actionLabel || null,
          metadata: data,
        })
        .select('id')
        .single();

      if (notifError) {
        console.error('Error creating notification:', notifError);
        return { success: false, error: notifError.message };
      }

      notificationId = notifData.id;
    }

    // Check if email is enabled
    const emailEnabled = !preferences || preferences[config.emailPrefField] !== false;
    let emailSent = false;

    if (emailEnabled && data.email) {
      // Send email using template
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.promptreviews.app';
      const templateName = config.emailTemplate || type;
      const emailVariables = config.getEmailVariables
        ? config.getEmailVariables(data, baseUrl)
        : { ...data, baseUrl };

      const emailResult = await sendTemplatedEmail(templateName, data.email, emailVariables);

      if (emailResult.success && notificationId) {
        emailSent = true;
        await markNotificationEmailSent(notificationId);
      }
    }

    return {
      success: true,
      notificationId,
      emailSent,
    };
  } catch (error) {
    console.error('Error in sendNotification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send notification to account owner only
 *
 * Useful for notifications that should only go to the account owner,
 * not all team members.
 */
export async function sendNotificationToAccountOwner(
  accountId: string,
  type: NotificationType,
  data: NotificationData
): Promise<SendNotificationResult> {
  try {
    const supabase = createServiceRoleClient();

    // Get account owner
    const { data: ownerData, error: ownerError } = await supabase
      .from('account_users')
      .select('user_id')
      .eq('account_id', accountId)
      .eq('role', 'owner')
      .single();

    if (ownerError || !ownerData) {
      console.error('Could not find account owner:', ownerError);
      return { success: false, error: 'Account owner not found' };
    }

    // Get owner's email and name
    const { data: userData } = await supabase.auth.admin.getUserById(ownerData.user_id);

    // Get account first name
    const { data: account } = await supabase
      .from('accounts')
      .select('first_name')
      .eq('id', accountId)
      .single();

    // Add user info to data for email
    const enrichedData = {
      ...data,
      email: userData?.user?.email,
      firstName: account?.first_name || 'there',
    };

    return sendNotification({
      accountId,
      userId: ownerData.user_id,
      type,
      data: enrichedData,
    });
  } catch (error) {
    console.error('Error in sendNotificationToAccountOwner:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Mark notification as email sent
 */
export async function markNotificationEmailSent(notificationId: string): Promise<void> {
  try {
    const supabase = createServiceRoleClient();

    await supabase
      .from('notifications')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString()
      })
      .eq('id', notificationId);
  } catch (error) {
    console.error('Error marking notification email sent:', error);
  }
}

/**
 * Check if email notifications should be sent for a type
 * @deprecated Use sendNotification() which handles this automatically
 */
export async function shouldSendEmail(
  accountId: string,
  type: NotificationType
): Promise<boolean> {
  try {
    const config = NOTIFICATION_REGISTRY[type];
    if (!config) return true;

    const supabase = createServiceRoleClient();

    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('account_id', accountId)
      .single();

    if (!preferences) {
      return true; // Default to sending if no preferences exist
    }

    return preferences[config.emailPrefField] !== false;
  } catch (error) {
    console.error('Error checking email preferences:', error);
    return true; // Default to sending on error
  }
}

// =============================================================================
// LEGACY COMPATIBILITY - Keep existing functions working
// =============================================================================

export interface CreateNotificationParams {
  accountId: string;
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

/**
 * Create a notification in the database
 * @deprecated Use sendNotification() for new code
 */
export async function createNotification(params: CreateNotificationParams): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  try {
    const supabase = createServiceRoleClient();

    const config = NOTIFICATION_REGISTRY[params.type];
    const inAppPrefField = config?.inAppPrefField;

    // Check notification preferences before creating
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('account_id', params.accountId)
      .single();

    // If preferences exist and this notification type is disabled, skip
    if (preferences && inAppPrefField && preferences[inAppPrefField] === false) {
      return { success: true }; // Silently skip - user has disabled this type
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        account_id: params.accountId,
        user_id: params.userId || null,
        type: params.type,
        title: params.title,
        message: params.message,
        action_url: params.actionUrl || null,
        action_label: params.actionLabel || null,
        metadata: params.metadata || {}
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true, notificationId: data.id };
  } catch (error) {
    console.error('Error in createNotification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Create a GBP change detected notification
 * @deprecated Use sendNotification() with type 'gbp_change_detected'
 */
export async function createGbpChangeNotification(
  accountId: string,
  locationName: string,
  fieldChanged: string,
  changeSource: 'google' | 'owner',
  alertId?: string
): Promise<{ success: boolean; error?: string }> {
  return sendNotification({
    accountId,
    type: 'gbp_change_detected',
    data: {
      locationName,
      fieldChanged,
      changeSource,
      alertId,
    },
  });
}
