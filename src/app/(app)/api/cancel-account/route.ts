/**
 * Account Cancellation API
 * 
 * Implements soft-deletion for 90-day retention policy.
 * Sets deleted_at timestamp instead of permanently deleting the account.
 * 
 * Security:
 * - Only account owners can delete their accounts
 * - Automatically cancels Stripe subscriptions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { createStripeClientWithRetry, STRIPE_CONFIG } from '@/lib/billing/config';
import { sendCancellationEmail } from '@/lib/onboarding-emails';

export async function POST(request: NextRequest) {
  // Create Stripe client inside request handler to avoid build-time env var access
  const stripeWithRetry = createStripeClientWithRetry();
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication (getUser() validates JWT server-side, unlike getSession())
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = user.id;

    // Parse request body
    const { confirm } = await request.json();

    if (!confirm) {
      return NextResponse.json({ error: 'Confirmation required' }, { status: 400 });
    }


    // Get the user's account ID using the utility function
    const accountId = await getRequestAccountId(request, userId, supabase);
    
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Check if user is the owner of the account
    const { data: accountUser, error: accountUserError } = await supabase
      .from('account_users')
      .select('role')
      .eq('account_id', accountId)
      .eq('user_id', userId)
      .single();

    if (accountUserError || !accountUser) {
      console.error('Error checking account ownership:', accountUserError);
      return NextResponse.json({ error: 'Not authorized to delete this account' }, { status: 403 });
    }

    // Only owners can delete accounts
    if (accountUser.role !== 'owner') {
      return NextResponse.json({ 
        error: 'Only account owners can delete accounts',
        userRole: accountUser.role 
      }, { status: 403 });
    }

    // Get the account details including Stripe info
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, email, first_name, deleted_at, stripe_subscription_id, stripe_customer_id, plan')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      console.error('Error fetching account:', accountError);
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Check if account is already cancelled
    if (account.deleted_at) {
      return NextResponse.json({ 
        error: 'Account is already cancelled',
        deletedAt: account.deleted_at
      }, { status: 400 });
    }

    // ============================================
    // CRITICAL: Cancel Stripe subscription FIRST
    // We MUST prevent continued billing
    // ============================================
    let stripeSubscriptionCancelled = false;
    let stripeError = null;
    
    if (account.stripe_subscription_id) {
      
      try {
        // First, try to retrieve the subscription to check if it exists and is active
        let subscription;
        try {
          subscription = await stripeWithRetry.retrieveSubscription(account.stripe_subscription_id);
        } catch (retrieveError: unknown) {
          const msg = retrieveError instanceof Error ? retrieveError.message : 'Unknown error';
          console.warn(`⚠️ Could not retrieve subscription: ${msg}`);
          subscription = null;
        }
        
        // Check subscription status
        if (!subscription) {
          // Subscription doesn't exist in Stripe - safe to delete account
          stripeSubscriptionCancelled = true;
        } else if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
          // Already cancelled - safe to delete account
          stripeSubscriptionCancelled = true;
        } else {
          // Active subscription - MUST cancel it
          
          try {
            const updatedSubscription = await stripeWithRetry.updateSubscription(
              account.stripe_subscription_id,
              {
                cancel_at_period_end: true,
                metadata: {
                  cancelled_by: userId,
                  cancelled_at: new Date().toISOString(),
                  reason: 'account_deletion'
                }
              }
            );
            
            stripeSubscriptionCancelled = true;
            
            // Note: We successfully cancelled the subscription in Stripe
            // The account will be soft-deleted below
              
          } catch (cancelError: unknown) {
            // CRITICAL: Could not cancel active subscription
            const msg = cancelError instanceof Error ? cancelError.message : 'Unknown error';
            console.error(`❌ CRITICAL: Could not cancel active subscription: ${msg}`);
            stripeError = msg;
            stripeSubscriptionCancelled = false;
          }
        }
      } catch (error: unknown) {
        // Unexpected error - treat as failure to be safe
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Unexpected error handling Stripe subscription: ${msg}`);
        stripeError = msg;
        stripeSubscriptionCancelled = false;
      }
      
      // If we couldn't cancel an active subscription, we MUST NOT delete the account
      if (!stripeSubscriptionCancelled) {
        return NextResponse.json({ 
          error: 'Cannot delete account while subscription is active. Please cancel your subscription first or contact support.',
          details: stripeError,
          action_required: 'cancel_subscription_first'
        }, { status: 400 });
      }
    } else {
    }

    // Soft delete the account - set deleted_at and reset plan
    const { error: updateError } = await supabase
      .from('accounts')
      .update({ 
        deleted_at: new Date().toISOString(),
        plan: 'no_plan'  // Reset plan so they see plan selection if they return
        // Note: Stripe IDs are kept for reference and potential restoration
      })
      .eq('id', accountId);

    if (updateError) {
      console.error('Error soft-deleting account:', updateError);
      return NextResponse.json({ error: 'Failed to cancel account' }, { status: 500 });
    }


    // Send cancellation feedback email (non-blocking)
    if (account.email) {
      sendCancellationEmail(accountId, account.email, account.first_name || 'there')
        .catch(err => console.error('[cancel-account] Failed to send cancellation email:', err));
    }

    // Optional: Sign out the user
    await supabase.auth.signOut();

    return NextResponse.json({ 
      success: true, 
      message: 'Account cancelled successfully. Your data will be retained for 90 days.',
      details: {
        accountId: accountId,
        deletedAt: new Date().toISOString(),
        permanentDeletionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        planReset: true,
        billingCancelled: !!account.stripe_subscription_id,
        note: 'If you return during the 90-day period, you\'ll need to select a plan to access your data.'
      }
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Account cancellation error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}