/**
 * Webhook Failure Recovery System
 * 
 * CRITICAL: This system ensures no payment updates are lost
 * Stores failed webhooks for manual recovery and sends alerts
 * 
 * @description Handles webhook failures gracefully with retry logic
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================
interface FailedWebhook {
  id?: string;
  event_id: string;
  event_type: string;
  customer_id: string;
  subscription_id?: string;
  payload: any;
  error_message: string;
  retry_count: number;
  max_retries: number;
  status: 'pending' | 'retrying' | 'failed' | 'recovered';
  created_at?: string;
  last_retry_at?: string;
  recovered_at?: string;
}

interface RecoveryResult {
  success: boolean;
  message: string;
  accountId?: string;
  error?: string;
}

// ============================================
// WEBHOOK RECOVERY CLASS
// ============================================
export class WebhookRecoverySystem {
  private supabase: SupabaseClient;
  private maxRetries: number = 5;
  private retryDelayMs: number = 5000; // 5 seconds

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Store a failed webhook for recovery
   * CRITICAL: This prevents loss of payment data
   */
  async storeFailedWebhook(params: {
    eventId: string;
    eventType: string;
    customerId: string;
    subscriptionId?: string;
    payload: any;
    error: string;
  }): Promise<void> {
    try {
      console.log('🔴 Storing failed webhook for recovery:', params.eventId);

      const failedWebhook: FailedWebhook = {
        event_id: params.eventId,
        event_type: params.eventType,
        customer_id: params.customerId,
        subscription_id: params.subscriptionId,
        payload: params.payload,
        error_message: params.error,
        retry_count: 0,
        max_retries: this.maxRetries,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      // ============================================
      // Store in database for manual recovery
      // ============================================
      const { error: insertError } = await this.supabase
        .from('failed_webhooks')
        .insert(failedWebhook);

      if (insertError) {
        console.error('❌ CRITICAL: Failed to store webhook for recovery:', insertError);
        // Log to external service as last resort
        this.logToExternalService(failedWebhook);
      } else {
        console.log('✅ Failed webhook stored successfully');
        
        // Send alert to admin
        await this.sendAdminAlert(failedWebhook);
        
        // Schedule retry
        this.scheduleRetry(params.eventId);
      }
    } catch (error) {
      console.error('💥 CRITICAL ERROR in webhook recovery storage:', error);
      // Last resort: log everything we can
      console.error('Failed webhook data:', JSON.stringify(params, null, 2));
    }
  }

  /**
   * Attempt to recover a failed webhook
   * Tries multiple methods to match customer to account
   */
  async attemptRecovery(webhookId: string): Promise<RecoveryResult> {
    try {
      console.log('🔄 Attempting webhook recovery:', webhookId);

      // ============================================
      // Get the failed webhook
      // ============================================
      const { data: webhook, error } = await this.supabase
        .from('failed_webhooks')
        .select('*')
        .eq('id', webhookId)
        .single();

      if (error || !webhook) {
        return {
          success: false,
          message: 'Failed webhook not found',
          error: error?.message
        };
      }

      // ============================================
      // Update retry count
      // ============================================
      await this.supabase
        .from('failed_webhooks')
        .update({
          retry_count: webhook.retry_count + 1,
          last_retry_at: new Date().toISOString(),
          status: 'retrying'
        })
        .eq('id', webhookId);

      // ============================================
      // Try recovery methods in order
      // ============================================
      
      // Method 1: Try by customer ID
      let account = await this.findAccountByCustomerId(webhook.customer_id);
      
      // Method 2: Try by email from payload
      if (!account && webhook.payload?.email) {
        account = await this.findAccountByEmail(webhook.payload.email);
      }
      
      // Method 3: Try by subscription ID
      if (!account && webhook.subscription_id) {
        account = await this.findAccountBySubscriptionId(webhook.subscription_id);
      }
      
      // Method 4: Try fuzzy matching
      if (!account) {
        account = await this.attemptFuzzyMatch(webhook);
      }

      // ============================================
      // Apply the update if account found
      // ============================================
      if (account) {
        const updateSuccess = await this.applyWebhookUpdate(account.id, webhook);
        
        if (updateSuccess) {
          // Mark as recovered
          await this.supabase
            .from('failed_webhooks')
            .update({
              status: 'recovered',
              recovered_at: new Date().toISOString()
            })
            .eq('id', webhookId);

          console.log('✅ Webhook successfully recovered!');
          return {
            success: true,
            message: 'Webhook recovered successfully',
            accountId: account.id
          };
        }
      }

      // ============================================
      // Check if we should keep retrying
      // ============================================
      if (webhook.retry_count >= this.maxRetries) {
        await this.supabase
          .from('failed_webhooks')
          .update({ status: 'failed' })
          .eq('id', webhookId);

        // Send critical alert - manual intervention needed
        await this.sendCriticalAlert(webhook);

        return {
          success: false,
          message: 'Max retries exceeded - manual intervention required',
          error: 'MAX_RETRIES_EXCEEDED'
        };
      }

      // Schedule another retry
      this.scheduleRetry(webhook.event_id);

      return {
        success: false,
        message: `Recovery attempt ${webhook.retry_count} failed - will retry`,
        error: 'RECOVERY_PENDING'
      };

    } catch (error: any) {
      console.error('💥 Error in webhook recovery:', error);
      return {
        success: false,
        message: 'Recovery attempt failed',
        error: error.message
      };
    }
  }

  /**
   * Find account by Stripe customer ID
   */
  private async findAccountByCustomerId(customerId: string): Promise<any> {
    const { data } = await this.supabase
      .from('accounts')
      .select('*')
      .eq('stripe_customer_id', customerId)
      .single();
    return data;
  }

  /**
   * Find account by email
   */
  private async findAccountByEmail(email: string): Promise<any> {
    const { data } = await this.supabase
      .from('accounts')
      .select('*')
      .eq('email', email)
      .single();
    return data;
  }

  /**
   * Find account by subscription ID
   */
  private async findAccountBySubscriptionId(subscriptionId: string): Promise<any> {
    const { data } = await this.supabase
      .from('accounts')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId)
      .single();
    return data;
  }

  /**
   * Attempt fuzzy matching as last resort
   */
  private async attemptFuzzyMatch(webhook: FailedWebhook): Promise<any> {
    // Try to extract any identifying info from payload
    const payload = webhook.payload;
    
    if (payload?.metadata?.userId) {
      const { data } = await this.supabase
        .from('accounts')
        .select('*')
        .eq('id', payload.metadata.userId)
        .single();
      return data;
    }

    // Could add more fuzzy matching logic here
    return null;
  }

  /**
   * Apply the webhook update to the account
   */
  private async applyWebhookUpdate(accountId: string, webhook: FailedWebhook): Promise<boolean> {
    try {
      const payload = webhook.payload;
      
      // Build update based on event type
      let updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (webhook.event_type.includes('subscription')) {
        updateData.plan = payload.plan || 'builder';
        updateData.subscription_status = payload.status;
        updateData.stripe_subscription_id = payload.id;
        updateData.stripe_customer_id = webhook.customer_id;
      }

      if (webhook.event_type.includes('payment')) {
        updateData.last_payment_status = payload.status;
        updateData.last_payment_at = new Date().toISOString();
      }

      const { error } = await this.supabase
        .from('accounts')
        .update(updateData)
        .eq('id', accountId);

      return !error;
    } catch (error) {
      console.error('Error applying webhook update:', error);
      return false;
    }
  }

  /**
   * Schedule a retry for a failed webhook
   */
  private scheduleRetry(eventId: string): void {
    setTimeout(async () => {
      console.log('⏰ Retrying webhook:', eventId);
      const { data } = await this.supabase
        .from('failed_webhooks')
        .select('id')
        .eq('event_id', eventId)
        .eq('status', 'pending')
        .single();
      
      if (data) {
        await this.attemptRecovery(data.id);
      }
    }, this.retryDelayMs);
  }

  /**
   * Send alert to admin about failed webhook
   */
  private async sendAdminAlert(webhook: FailedWebhook): Promise<void> {
    console.log('📧 Sending admin alert for failed webhook:', webhook.event_id);
    
    // In production, integrate with your alerting service
    // For now, just log it prominently
    console.error('🚨 ADMIN ALERT: Webhook failure needs attention', {
      eventId: webhook.event_id,
      customerId: webhook.customer_id,
      eventType: webhook.event_type,
      error: webhook.error_message
    });

    // Could integrate with:
    // - Slack webhook
    // - Email service
    // - PagerDuty
    // - Sentry
  }

  /**
   * Send critical alert when max retries exceeded
   */
  private async sendCriticalAlert(webhook: FailedWebhook): Promise<void> {
    console.error('🚨🚨🚨 CRITICAL: Webhook recovery failed after max retries!', {
      eventId: webhook.event_id,
      customerId: webhook.customer_id,
      subscriptionId: webhook.subscription_id,
      eventType: webhook.event_type,
      retryCount: webhook.retry_count
    });

    // This needs immediate manual intervention
    // In production, page someone!
  }

  /**
   * Log to external service as last resort
   */
  private logToExternalService(webhook: FailedWebhook): void {
    // Last resort logging when database fails
    console.error('🆘 EMERGENCY LOG - Failed webhook could not be stored:', JSON.stringify(webhook, null, 2));
    
    // In production, send to:
    // - External logging service
    // - S3 bucket
    // - Error tracking service
  }

  /**
   * Get all failed webhooks for admin dashboard
   */
  async getFailedWebhooks(status?: string): Promise<FailedWebhook[]> {
    let query = this.supabase
      .from('failed_webhooks')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching failed webhooks:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Manually retry a specific webhook
   */
  async manualRetry(webhookId: string): Promise<RecoveryResult> {
    console.log('👤 Manual retry requested for webhook:', webhookId);
    return this.attemptRecovery(webhookId);
  }
}