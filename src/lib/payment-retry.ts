/**
 * Payment Retry and Grace Period System
 * 
 * CRITICAL: Prevents immediate access loss on payment failure
 * Implements smart retry logic and grace periods for failed payments
 * 
 * @description Improves customer retention during payment issues
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// CONFIGURATION
// ============================================

export const PAYMENT_RETRY_CONFIG = {
  // Grace period before restricting access
  GRACE_PERIOD_DAYS: 7,
  
  // Retry schedule (days after failure)
  RETRY_SCHEDULE: [1, 3, 5, 7],
  
  // Maximum retry attempts
  MAX_RETRIES: 4,
  
  // Email reminder schedule (days before restriction)
  REMINDER_SCHEDULE: [7, 3, 1],
  
  // Dunning email templates
  EMAIL_TEMPLATES: {
    FIRST_FAILURE: 'payment_failed_first',
    REMINDER: 'payment_failed_reminder',
    FINAL_WARNING: 'payment_failed_final',
    ACCESS_RESTRICTED: 'payment_access_restricted',
    PAYMENT_RECOVERED: 'payment_recovered'
  }
};

// ============================================
// TYPES
// ============================================

interface PaymentRetryRecord {
  id?: string;
  account_id: string;
  subscription_id: string;
  invoice_id: string;
  amount: number;
  currency: string;
  
  // Retry tracking
  retry_count: number;
  next_retry_at: Date;
  last_retry_at?: Date;
  
  // Grace period
  grace_period_ends: Date;
  access_restricted: boolean;
  
  // Status
  status: 'pending' | 'retrying' | 'recovered' | 'failed' | 'canceled';
  
  // Timestamps
  created_at: Date;
  resolved_at?: Date;
}

interface RetryResult {
  success: boolean;
  message: string;
  nextRetryAt?: Date;
  accessRestricted?: boolean;
}

// ============================================
// PAYMENT RETRY CLASS
// ============================================

export class PaymentRetrySystem {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Handle a failed payment with grace period
   * CRITICAL: Gives users time to fix payment issues
   */
  async handleFailedPayment(params: {
    accountId: string;
    subscriptionId: string;
    invoiceId: string;
    amount: number;
    currency?: string;
    stripeCustomerId: string;
  }): Promise<RetryResult> {
    try {
      console.log('💳 Handling failed payment with grace period:', params.accountId);

      // ============================================
      // Check if retry already exists
      // ============================================
      const { data: existingRetry } = await this.supabase
        .from('payment_retries')
        .select('*')
        .eq('invoice_id', params.invoiceId)
        .single();

      if (existingRetry) {
        return this.updateRetryRecord(existingRetry);
      }

      // ============================================
      // Create new retry record with grace period
      // ============================================
      const gracePeriodEnds = new Date();
      gracePeriodEnds.setDate(gracePeriodEnds.getDate() + PAYMENT_RETRY_CONFIG.GRACE_PERIOD_DAYS);

      const nextRetryDate = new Date();
      nextRetryDate.setDate(nextRetryDate.getDate() + PAYMENT_RETRY_CONFIG.RETRY_SCHEDULE[0]);

      const retryRecord: PaymentRetryRecord = {
        account_id: params.accountId,
        subscription_id: params.subscriptionId,
        invoice_id: params.invoiceId,
        amount: params.amount,
        currency: params.currency || 'usd',
        retry_count: 0,
        next_retry_at: nextRetryDate,
        grace_period_ends: gracePeriodEnds,
        access_restricted: false,
        status: 'pending',
        created_at: new Date()
      };

      const { error: insertError } = await this.supabase
        .from('payment_retries')
        .insert(retryRecord);

      if (insertError) {
        console.error('❌ Failed to create retry record:', insertError);
        throw insertError;
      }

      // ============================================
      // Update account with grace period info
      // ============================================
      await this.supabase
        .from('accounts')
        .update({
          subscription_status: 'past_due',
          payment_grace_period_ends: gracePeriodEnds.toISOString(),
          payment_retry_count: 1
        })
        .eq('id', params.accountId);

      // ============================================
      // Send first failure notification
      // ============================================
      await this.sendPaymentFailureEmail(params.accountId, 'FIRST_FAILURE', {
        amount: params.amount / 100,
        gracePeriodDays: PAYMENT_RETRY_CONFIG.GRACE_PERIOD_DAYS,
        nextRetryDate: nextRetryDate.toLocaleDateString()
      });

      console.log('✅ Payment retry scheduled with grace period:', {
        accountId: params.accountId,
        gracePeriodEnds: gracePeriodEnds.toISOString(),
        nextRetryAt: nextRetryDate.toISOString()
      });

      return {
        success: true,
        message: `Payment failed. Grace period active until ${gracePeriodEnds.toLocaleDateString()}`,
        nextRetryAt: nextRetryDate,
        accessRestricted: false
      };

    } catch (error: any) {
      console.error('💥 Error handling failed payment:', error);
      return {
        success: false,
        message: 'Failed to process payment retry',
        accessRestricted: false
      };
    }
  }

  /**
   * Update existing retry record
   */
  private async updateRetryRecord(retry: PaymentRetryRecord): Promise<RetryResult> {
    const newRetryCount = retry.retry_count + 1;
    
    // ============================================
    // Check if max retries exceeded
    // ============================================
    if (newRetryCount >= PAYMENT_RETRY_CONFIG.MAX_RETRIES) {
      await this.restrictAccess(retry.account_id, retry.id!);
      return {
        success: false,
        message: 'Maximum retry attempts exceeded. Access restricted.',
        accessRestricted: true
      };
    }

    // ============================================
    // Schedule next retry
    // ============================================
    const nextRetryDate = new Date();
    const daysToAdd = PAYMENT_RETRY_CONFIG.RETRY_SCHEDULE[newRetryCount] || 7;
    nextRetryDate.setDate(nextRetryDate.getDate() + daysToAdd);

    await this.supabase
      .from('payment_retries')
      .update({
        retry_count: newRetryCount,
        next_retry_at: nextRetryDate.toISOString(),
        last_retry_at: new Date().toISOString(),
        status: 'retrying'
      })
      .eq('id', retry.id);

    // ============================================
    // Check if approaching grace period end
    // ============================================
    const daysUntilRestriction = Math.ceil(
      (retry.grace_period_ends.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilRestriction <= 3) {
      await this.sendPaymentFailureEmail(retry.account_id, 'FINAL_WARNING', {
        daysRemaining: daysUntilRestriction
      });
    }

    return {
      success: true,
      message: `Retry ${newRetryCount} scheduled`,
      nextRetryAt: nextRetryDate,
      accessRestricted: false
    };
  }

  /**
   * Restrict access after grace period expires
   */
  private async restrictAccess(accountId: string, retryId: string): Promise<void> {
    console.log('🔒 Restricting access for account:', accountId);

    // Update retry record
    await this.supabase
      .from('payment_retries')
      .update({
        access_restricted: true,
        status: 'failed'
      })
      .eq('id', retryId);

    // Update account
    await this.supabase
      .from('accounts')
      .update({
        subscription_status: 'suspended',
        access_restricted_at: new Date().toISOString()
      })
      .eq('id', accountId);

    // Send restriction notification
    await this.sendPaymentFailureEmail(accountId, 'ACCESS_RESTRICTED', {});
  }

  /**
   * Process scheduled payment retries
   * Should be called by a cron job
   */
  async processScheduledRetries(): Promise<void> {
    console.log('⏰ Processing scheduled payment retries');

    // Get retries due for processing
    const { data: dueRetries, error } = await this.supabase
      .from('payment_retries')
      .select('*')
      .eq('status', 'pending')
      .lte('next_retry_at', new Date().toISOString())
      .eq('access_restricted', false);

    if (error || !dueRetries) {
      console.error('Error fetching due retries:', error);
      return;
    }

    console.log(`Found ${dueRetries.length} payments to retry`);

    for (const retry of dueRetries) {
      await this.attemptPaymentRetry(retry);
    }
  }

  /**
   * Attempt to retry a payment
   */
  private async attemptPaymentRetry(retry: PaymentRetryRecord): Promise<void> {
    console.log(`💳 Attempting payment retry for account: ${retry.account_id}`);

    try {
      // Get Stripe customer ID
      const { data: account } = await this.supabase
        .from('accounts')
        .select('stripe_customer_id')
        .eq('id', retry.account_id)
        .single();

      if (!account?.stripe_customer_id) {
        console.error('No Stripe customer ID found');
        return;
      }

      // ============================================
      // Call Stripe to retry payment
      // In production, this would use Stripe SDK
      // ============================================
      const paymentSuccessful = await this.retryStripePayment(
        account.stripe_customer_id,
        retry.invoice_id
      );

      if (paymentSuccessful) {
        await this.handlePaymentRecovery(retry);
      } else {
        await this.updateRetryRecord(retry);
      }

    } catch (error) {
      console.error('Error in payment retry:', error);
      await this.updateRetryRecord(retry);
    }
  }

  /**
   * Mock Stripe payment retry
   * In production, use actual Stripe SDK
   */
  private async retryStripePayment(customerId: string, invoiceId: string): Promise<boolean> {
    // This would be actual Stripe API call
    console.log(`🔄 Retrying Stripe payment for customer: ${customerId}`);
    
    // Simulate 30% success rate for demo
    return Math.random() < 0.3;
  }

  /**
   * Handle successful payment recovery
   */
  private async handlePaymentRecovery(retry: PaymentRetryRecord): Promise<void> {
    console.log('✅ Payment recovered successfully!');

    // Update retry record
    await this.supabase
      .from('payment_retries')
      .update({
        status: 'recovered',
        resolved_at: new Date().toISOString()
      })
      .eq('id', retry.id);

    // Update account
    await this.supabase
      .from('accounts')
      .update({
        subscription_status: 'active',
        payment_grace_period_ends: null,
        payment_retry_count: 0,
        access_restricted_at: null
      })
      .eq('id', retry.account_id);

    // Send success notification
    await this.sendPaymentFailureEmail(retry.account_id, 'PAYMENT_RECOVERED', {
      amount: retry.amount / 100
    });
  }

  /**
   * Send payment failure emails
   */
  private async sendPaymentFailureEmail(
    accountId: string,
    template: string,
    data: any
  ): Promise<void> {
    console.log(`📧 Sending ${template} email to account: ${accountId}`);
    
    // In production, integrate with email service
    // Example: SendGrid, Postmark, AWS SES
    
    // Log email for now
    console.log('Email data:', data);
  }

  /**
   * Check if account is in grace period
   */
  async isInGracePeriod(accountId: string): Promise<{
    inGracePeriod: boolean;
    daysRemaining?: number;
    endsAt?: Date;
  }> {
    const { data: account } = await this.supabase
      .from('accounts')
      .select('payment_grace_period_ends')
      .eq('id', accountId)
      .single();

    if (!account?.payment_grace_period_ends) {
      return { inGracePeriod: false };
    }

    const endsAt = new Date(account.payment_grace_period_ends);
    const now = new Date();
    
    if (endsAt > now) {
      const daysRemaining = Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        inGracePeriod: true,
        daysRemaining,
        endsAt
      };
    }

    return { inGracePeriod: false };
  }

  /**
   * Manually trigger payment retry (for admin/support)
   */
  async manualRetry(accountId: string): Promise<RetryResult> {
    console.log('👤 Manual payment retry requested for:', accountId);
    
    const { data: retry } = await this.supabase
      .from('payment_retries')
      .select('*')
      .eq('account_id', accountId)
      .eq('status', 'pending')
      .single();

    if (!retry) {
      return {
        success: false,
        message: 'No pending retry found for this account'
      };
    }

    await this.attemptPaymentRetry(retry);
    
    return {
      success: true,
      message: 'Payment retry attempted'
    };
  }
}