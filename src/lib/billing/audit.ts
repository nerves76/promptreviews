/**
 * Billing Audit Logger
 * 
 * Tracks all billing-related actions for compliance and debugging
 * Stores events in a dedicated billing_audit_log table
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from './config';

export type BillingEventType = 
  | 'subscription_created'
  | 'subscription_updated' 
  | 'subscription_cancelled'
  | 'subscription_reactivated'
  | 'plan_upgraded'
  | 'plan_downgraded'
  | 'billing_period_changed'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'credit_applied'
  | 'refund_processed'
  | 'free_trial_started'
  | 'free_trial_ended'
  | 'checkout_started'
  | 'checkout_completed'
  | 'checkout_cancelled'
  | 'portal_accessed'
  | 'webhook_received'
  | 'sync_performed'
  | 'error';

export interface BillingAuditLog {
  id?: string;
  created_at?: string;
  account_id: string;
  user_id?: string;
  event_type: BillingEventType;
  event_source: 'api' | 'webhook' | 'manual' | 'system';
  description: string;
  metadata?: Record<string, any>;
  stripe_event_id?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  old_plan?: string;
  new_plan?: string;
  old_billing_period?: string;
  new_billing_period?: string;
  amount?: number;
  currency?: string;
  error_message?: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Log a billing event to the audit table
 */
export async function logBillingEvent(event: Omit<BillingAuditLog, 'id' | 'created_at'>): Promise<void> {
  try {
    const supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.SERVICE_ROLE_KEY);
    
    const { error } = await supabase
      .from('billing_audit_log')
      .insert({
        ...event,
        created_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('Failed to log billing event:', error);
      // Don't throw - we don't want logging failures to break the main flow
    } else {
      console.log(`📝 Billing event logged: ${event.event_type} for account ${event.account_id}`);
    }
  } catch (error) {
    console.error('Error in billing audit logger:', error);
  }
}

/**
 * Log a plan change event
 */
export async function logPlanChange({
  accountId,
  userId,
  oldPlan,
  newPlan,
  oldBilling,
  newBilling,
  source = 'api',
  metadata = {},
  stripeSubscriptionId,
}: {
  accountId: string;
  userId?: string;
  oldPlan: string;
  newPlan: string;
  oldBilling?: string;
  newBilling?: string;
  source?: 'api' | 'webhook' | 'manual' | 'system';
  metadata?: Record<string, any>;
  stripeSubscriptionId?: string;
}): Promise<void> {
  const isSamePlan = oldPlan === newPlan;
  const isBillingChange = oldBilling !== newBilling && oldBilling && newBilling;
  
  let eventType: BillingEventType;
  let description: string;
  
  if (isSamePlan && isBillingChange) {
    eventType = 'billing_period_changed';
    description = `Changed billing from ${oldBilling} to ${newBilling} for ${newPlan} plan`;
  } else if (getPlanValue(newPlan) > getPlanValue(oldPlan)) {
    eventType = 'plan_upgraded';
    description = `Upgraded from ${oldPlan} to ${newPlan}`;
  } else if (getPlanValue(newPlan) < getPlanValue(oldPlan)) {
    eventType = 'plan_downgraded';
    description = `Downgraded from ${oldPlan} to ${newPlan}`;
  } else {
    eventType = 'subscription_updated';
    description = `Plan updated: ${oldPlan} → ${newPlan}`;
  }
  
  await logBillingEvent({
    account_id: accountId,
    user_id: userId,
    event_type: eventType,
    event_source: source,
    description,
    old_plan: oldPlan,
    new_plan: newPlan,
    old_billing_period: oldBilling,
    new_billing_period: newBilling,
    stripe_subscription_id: stripeSubscriptionId,
    metadata,
  });
}

/**
 * Log a payment event
 */
export async function logPaymentEvent({
  accountId,
  userId,
  success,
  amount,
  currency = 'usd',
  stripeEventId,
  stripeCustomerId,
  errorMessage,
  metadata = {},
}: {
  accountId: string;
  userId?: string;
  success: boolean;
  amount?: number;
  currency?: string;
  stripeEventId?: string;
  stripeCustomerId?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  await logBillingEvent({
    account_id: accountId,
    user_id: userId,
    event_type: success ? 'payment_succeeded' : 'payment_failed',
    event_source: 'webhook',
    description: success 
      ? `Payment of ${formatCurrency(amount, currency)} succeeded`
      : `Payment failed: ${errorMessage || 'Unknown error'}`,
    amount,
    currency,
    stripe_event_id: stripeEventId,
    stripe_customer_id: stripeCustomerId,
    error_message: errorMessage,
    metadata,
  });
}

/**
 * Log checkout session events
 */
export async function logCheckoutEvent({
  accountId,
  userId,
  event,
  plan,
  billingPeriod,
  metadata = {},
}: {
  accountId: string;
  userId?: string;
  event: 'started' | 'completed' | 'cancelled';
  plan?: string;
  billingPeriod?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  const eventMap = {
    started: 'checkout_started',
    completed: 'checkout_completed',
    cancelled: 'checkout_cancelled',
  };
  
  await logBillingEvent({
    account_id: accountId,
    user_id: userId,
    event_type: eventMap[event] as BillingEventType,
    event_source: 'api',
    description: `Checkout ${event} for ${plan || 'unknown'} plan (${billingPeriod || 'unknown'} billing)`,
    new_plan: plan,
    new_billing_period: billingPeriod,
    metadata,
  });
}

/**
 * Helper to get plan value for comparison
 */
function getPlanValue(plan: string): number {
  const values: Record<string, number> = {
    grower: 1,
    builder: 2,
    maven: 3,
  };
  return values[plan.toLowerCase()] || 0;
}

/**
 * Helper to format currency
 */
function formatCurrency(amount?: number, currency = 'usd'): string {
  if (!amount) return '$0.00';
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  });
  return formatter.format(amount / 100); // Stripe amounts are in cents
}

/**
 * Create the billing_audit_log table migration
 * Run this SQL in your Supabase dashboard or as a migration
 */
export const BILLING_AUDIT_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS billing_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  event_source VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  stripe_event_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  old_plan VARCHAR(50),
  new_plan VARCHAR(50),
  old_billing_period VARCHAR(20),
  new_billing_period VARCHAR(20),
  amount INTEGER,
  currency VARCHAR(3),
  error_message TEXT,
  ip_address INET,
  user_agent TEXT
);

-- Create indexes for common queries
CREATE INDEX idx_billing_audit_account_id ON billing_audit_log(account_id);
CREATE INDEX idx_billing_audit_created_at ON billing_audit_log(created_at);
CREATE INDEX idx_billing_audit_event_type ON billing_audit_log(event_type);
CREATE INDEX idx_billing_audit_stripe_customer ON billing_audit_log(stripe_customer_id);
CREATE INDEX idx_billing_audit_stripe_subscription ON billing_audit_log(stripe_subscription_id);

-- Enable RLS
ALTER TABLE billing_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policy for service role only (audit logs should not be directly accessible)
CREATE POLICY "Service role can manage billing audit logs" ON billing_audit_log
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');
`;