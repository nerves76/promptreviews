/**
 * Notifications Utility
 *
 * Helper functions for creating and managing notifications
 */

import { createServiceRoleClient } from '@/auth/providers/supabase';

export type NotificationType =
  | 'gbp_change_detected'
  | 'new_review_received'
  | 'team_invitation'
  | 'subscription_update'
  | 'system_announcement';

export interface CreateNotificationParams {
  accountId: string;
  userId?: string; // If null, notification is for all users on the account
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

/**
 * Create a notification in the database
 */
export async function createNotification(params: CreateNotificationParams): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  try {
    const supabase = createServiceRoleClient();

    // Check notification preferences before creating
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('account_id', params.accountId)
      .single();

    // Map notification type to preference field
    const prefFieldMap: Record<NotificationType, string> = {
      'gbp_change_detected': 'in_app_gbp_changes',
      'new_review_received': 'in_app_new_reviews',
      'team_invitation': 'in_app_team_updates',
      'subscription_update': 'in_app_subscription_updates',
      'system_announcement': 'in_app_announcements'
    };

    const prefField = prefFieldMap[params.type];

    // If preferences exist and this notification type is disabled, skip
    if (preferences && prefField && preferences[prefField] === false) {
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
 */
export async function createGbpChangeNotification(
  accountId: string,
  locationName: string,
  fieldChanged: string,
  changeSource: 'google' | 'owner',
  alertId?: string
): Promise<{ success: boolean; error?: string }> {
  const isGoogleChange = changeSource === 'google';

  const title = isGoogleChange
    ? 'Google Suggested a Change'
    : 'Profile Change Detected';

  const message = isGoogleChange
    ? `Google suggested a change to ${fieldChanged} for ${locationName}`
    : `${fieldChanged} was changed for ${locationName}`;

  return createNotification({
    accountId,
    type: 'gbp_change_detected',
    title,
    message,
    actionUrl: '/dashboard/google-business?tab=protection',
    actionLabel: 'Review Change',
    metadata: {
      locationName,
      fieldChanged,
      changeSource,
      alertId
    }
  });
}

/**
 * Check if email notifications should be sent for a type
 */
export async function shouldSendEmail(
  accountId: string,
  type: NotificationType
): Promise<boolean> {
  try {
    const supabase = createServiceRoleClient();

    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('account_id', accountId)
      .single();

    if (!preferences) {
      return true; // Default to sending if no preferences exist
    }

    const emailPrefMap: Record<NotificationType, string> = {
      'gbp_change_detected': 'email_gbp_changes',
      'new_review_received': 'email_new_reviews',
      'team_invitation': 'email_team_updates',
      'subscription_update': 'email_subscription_updates',
      'system_announcement': 'email_announcements'
    };

    const prefField = emailPrefMap[type];
    return preferences[prefField] !== false;
  } catch (error) {
    console.error('Error checking email preferences:', error);
    return true; // Default to sending on error
  }
}

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
