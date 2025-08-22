/**
 * Billing Data Synchronization
 * 
 * Ensures consistency between Stripe and database
 * Handles automatic detection and correction of mismatches
 */

import { createClient } from '@supabase/supabase-js';
import { createStripeClientWithRetry } from './config';
import { PRICE_IDS, SUPABASE_CONFIG } from './config';
import { logBillingEvent } from './audit';

export interface SyncResult {
  success: boolean;
  accountId: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  error?: string;
}

/**
 * Sync a single account's billing data with Stripe
 */
export async function syncAccountBilling(accountId: string): Promise<SyncResult> {
  const supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.SERVICE_ROLE_KEY);
  const stripe = createStripeClientWithRetry();
  
  try {
    // Get account from database
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single();
    
    if (accountError || !account) {
      return {
        success: false,
        accountId,
        error: 'Account not found',
      };
    }
    
    // Skip if no Stripe subscription
    if (!account.stripe_subscription_id) {
      return {
        success: true,
        accountId,
        changes: [],
      };
    }
    
    // Get subscription from Stripe
    let subscription;
    try {
      subscription = await stripe.retrieveSubscription(account.stripe_subscription_id);
    } catch (stripeError: any) {
      if (stripeError.code === 'resource_missing') {
        // Subscription doesn't exist in Stripe, clear it from database
        await supabase
          .from('accounts')
          .update({
            stripe_subscription_id: null,
            subscription_status: 'canceled',
            plan: 'no_plan',
          })
          .eq('id', accountId);
        
        await logBillingEvent({
          account_id: accountId,
          event_type: 'sync_performed',
          event_source: 'system',
          description: 'Cleared missing Stripe subscription from database',
          metadata: { stripe_subscription_id: account.stripe_subscription_id },
        });
        
        return {
          success: true,
          accountId,
          changes: [
            { field: 'stripe_subscription_id', oldValue: account.stripe_subscription_id, newValue: null },
            { field: 'subscription_status', oldValue: account.subscription_status, newValue: 'canceled' },
            { field: 'plan', oldValue: account.plan, newValue: 'no_plan' },
          ],
        };
      }
      throw stripeError;
    }
    
    // Determine actual plan and billing from Stripe price
    const currentStripePrice = subscription.items.data[0]?.price.id;
    let actualPlan = null;
    let actualBilling = null;
    
    for (const [planKey, prices] of Object.entries(PRICE_IDS)) {
      if (currentStripePrice === prices.annual) {
        actualPlan = planKey;
        actualBilling = 'annual';
        break;
      } else if (currentStripePrice === prices.monthly) {
        actualPlan = planKey;
        actualBilling = 'monthly';
        break;
      }
    }
    
    if (!actualPlan || !actualBilling) {
      return {
        success: false,
        accountId,
        error: `Unknown Stripe price ID: ${currentStripePrice}`,
      };
    }
    
    // Check for differences
    const changes: SyncResult['changes'] = [];
    const updates: Record<string, any> = {};
    
    if (account.plan !== actualPlan) {
      changes.push({ field: 'plan', oldValue: account.plan, newValue: actualPlan });
      updates.plan = actualPlan;
    }
    
    if (account.billing_period !== actualBilling) {
      changes.push({ field: 'billing_period', oldValue: account.billing_period, newValue: actualBilling });
      updates.billing_period = actualBilling;
    }
    
    if (account.subscription_status !== subscription.status) {
      changes.push({ field: 'subscription_status', oldValue: account.subscription_status, newValue: subscription.status });
      updates.subscription_status = subscription.status;
    }
    
    // Update database if there are changes
    if (changes.length > 0) {
      updates.updated_at = new Date().toISOString();
      
      const { error: updateError } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', accountId);
      
      if (updateError) {
        return {
          success: false,
          accountId,
          error: `Failed to update database: ${updateError.message}`,
        };
      }
      
      // Log the sync
      await logBillingEvent({
        account_id: accountId,
        event_type: 'sync_performed',
        event_source: 'system',
        description: `Synced ${changes.length} field(s) with Stripe`,
        metadata: {
          changes,
          stripe_subscription_id: subscription.id,
          stripe_price_id: currentStripePrice,
        },
      });
    }
    
    return {
      success: true,
      accountId,
      changes,
    };
    
  } catch (error: any) {
    console.error('Sync error:', error);
    
    await logBillingEvent({
      account_id: accountId,
      event_type: 'error',
      event_source: 'system',
      description: 'Failed to sync billing data',
      error_message: error.message,
    });
    
    return {
      success: false,
      accountId,
      error: error.message,
    };
  }
}

/**
 * Sync all accounts with active subscriptions
 */
export async function syncAllAccounts(): Promise<{
  total: number;
  synced: number;
  failed: number;
  results: SyncResult[];
}> {
  const supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.SERVICE_ROLE_KEY);
  
  // Get all accounts with Stripe subscriptions
  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('id')
    .not('stripe_subscription_id', 'is', null);
  
  if (error || !accounts) {
    console.error('Failed to fetch accounts:', error);
    return {
      total: 0,
      synced: 0,
      failed: 0,
      results: [],
    };
  }
  
  const results: SyncResult[] = [];
  let synced = 0;
  let failed = 0;
  
  // Process accounts in batches to avoid overwhelming the API
  const batchSize = 10;
  for (let i = 0; i < accounts.length; i += batchSize) {
    const batch = accounts.slice(i, i + batchSize);
    const batchPromises = batch.map(account => syncAccountBilling(account.id));
    const batchResults = await Promise.all(batchPromises);
    
    for (const result of batchResults) {
      results.push(result);
      if (result.success) {
        synced++;
      } else {
        failed++;
      }
    }
    
    // Add delay between batches to avoid rate limiting
    if (i + batchSize < accounts.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`Sync complete: ${synced} synced, ${failed} failed out of ${accounts.length} total`);
  
  return {
    total: accounts.length,
    synced,
    failed,
    results,
  };
}

/**
 * Auto-sync on webhook events
 */
export async function handleWebhookSync(
  stripeSubscriptionId: string,
  stripeCustomerId?: string
): Promise<void> {
  const supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.SERVICE_ROLE_KEY);
  
  // Find account by subscription ID or customer ID
  let account;
  
  if (stripeSubscriptionId) {
    const { data } = await supabase
      .from('accounts')
      .select('id')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .single();
    account = data;
  }
  
  if (!account && stripeCustomerId) {
    const { data } = await supabase
      .from('accounts')
      .select('id')
      .eq('stripe_customer_id', stripeCustomerId)
      .single();
    account = data;
  }
  
  if (account) {
    await syncAccountBilling(account.id);
  }
}