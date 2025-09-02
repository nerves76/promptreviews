/**
 * Stripe Subscription Cancellation API
 * 
 * CRITICAL: This properly cancels Stripe subscriptions to prevent continued billing
 * Called by cancel-account API after soft-deleting the account
 * 
 * @security Requires authentication
 * @sideEffects Cancels Stripe subscription immediately
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/auth/providers/supabase';

// Initialize Stripe with proper error handling
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('❌ CRITICAL: STRIPE_SECRET_KEY is not configured');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { 
  apiVersion: "2025-07-30.basil" 
}) : null;

export async function POST(request: NextRequest) {
  // CSRF Protection - Check origin for this critical action
  const { requireValidOrigin } = await import('@/lib/csrf-protection');
  const csrfError = requireValidOrigin(request);
  if (csrfError) return csrfError;
  
  try {
    // ============================================
    // STEP 1: Verify Stripe is configured
    // ============================================
    if (!stripe) {
      console.error('❌ Stripe not configured - cannot cancel subscriptions');
      return NextResponse.json({ 
        error: 'Payment system not configured',
        code: 'STRIPE_NOT_CONFIGURED' 
      }, { status: 503 });
    }

    const supabase = createClient();

    // ============================================
    // STEP 2: Authenticate user
    // ============================================
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED' 
      }, { status: 401 });
    }

    const userId = session.user.id;
    console.log(`🔄 Processing subscription cancellation for user: ${userId}`);

    // ============================================
    // STEP 3: Get subscription details from database
    // ============================================
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('stripe_subscription_id, stripe_customer_id, email, plan')
      .eq('id', userId)
      .single();

    if (accountError || !account) {
      console.error('❌ Account not found:', accountError);
      return NextResponse.json({ 
        error: 'Account not found',
        code: 'ACCOUNT_NOT_FOUND' 
      }, { status: 404 });
    }

    // ============================================
    // STEP 4: Check if there's a subscription to cancel
    // ============================================
    if (!account.stripe_subscription_id) {
      console.log('ℹ️ No Stripe subscription to cancel for user:', userId);
      return NextResponse.json({ 
        success: true, 
        message: 'No active subscription to cancel',
        code: 'NO_SUBSCRIPTION' 
      });
    }

    console.log(`🎯 Cancelling Stripe subscription: ${account.stripe_subscription_id}`);

    // ============================================
    // STEP 5: Cancel the Stripe subscription
    // ============================================
    try {
      // Cancel at period end to give user access until billing period ends
      const canceledSubscription = await stripe.subscriptions.update(
        account.stripe_subscription_id,
        {
          cancel_at_period_end: true,
          metadata: {
            canceled_by: userId,
            canceled_at: new Date().toISOString(),
            reason: 'user_requested'
          }
        }
      ) as Stripe.Subscription;

      console.log('✅ Stripe subscription marked for cancellation:', {
        id: canceledSubscription.id,
        status: canceledSubscription.status,
        cancel_at_period_end: canceledSubscription.cancel_at_period_end,
        current_period_end: (canceledSubscription as any).current_period_end ? new Date((canceledSubscription as any).current_period_end * 1000).toISOString() : 'N/A'
      });

      // ============================================
      // STEP 6: Update database with cancellation info
      // ============================================
      const { error: updateError } = await supabase
        .from('accounts')
        .update({
          subscription_status: 'canceling',
          subscription_cancel_at: (canceledSubscription as any).current_period_end ? new Date((canceledSubscription as any).current_period_end * 1000).toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('⚠️ Failed to update database after cancellation:', updateError);
        // Don't fail the whole operation - Stripe cancellation succeeded
      }

      // ============================================
      // STEP 7: Return success with details
      // ============================================
      return NextResponse.json({
        success: true,
        message: 'Subscription cancelled successfully',
        details: {
          subscription_id: canceledSubscription.id,
          status: canceledSubscription.status,
          access_until: (canceledSubscription as any).current_period_end ? new Date((canceledSubscription as any).current_period_end * 1000).toISOString() : 'N/A',
          immediate: false,
          note: 'You will retain access until the end of your current billing period'
        }
      });

    } catch (stripeError: any) {
      console.error('❌ Stripe cancellation failed:', stripeError);
      
      // ============================================
      // STEP 8: Handle specific Stripe errors
      // ============================================
      let errorMessage = 'Failed to cancel subscription';
      let errorCode = 'STRIPE_ERROR';
      
      if (stripeError.code === 'resource_missing') {
        errorMessage = 'Subscription not found or already cancelled';
        errorCode = 'SUBSCRIPTION_NOT_FOUND';
      } else if (stripeError.code === 'api_key_expired') {
        errorMessage = 'Payment system configuration error';
        errorCode = 'STRIPE_CONFIG_ERROR';
      }

      return NextResponse.json({
        error: errorMessage,
        code: errorCode,
        details: stripeError.message
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('💥 Unexpected error in subscription cancellation:', error);
    return NextResponse.json({
      error: 'Internal server error during cancellation',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

/**
 * Cancel subscription immediately (for urgent cases)
 * This endpoint forces immediate cancellation instead of waiting for period end
 */
export async function DELETE(request: NextRequest) {
  // CSRF Protection - Check origin for this critical action
  const { requireValidOrigin } = await import('@/lib/csrf-protection');
  const csrfError = requireValidOrigin(request);
  if (csrfError) return csrfError;
  
  try {
    if (!stripe) {
      return NextResponse.json({ 
        error: 'Payment system not configured',
        code: 'STRIPE_NOT_CONFIGURED' 
      }, { status: 503 });
    }

    const supabase = createClient();
    
    // Authenticate
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Get subscription
    const { data: account } = await supabase
      .from('accounts')
      .select('stripe_subscription_id')
      .eq('id', userId)
      .single();

    if (!account?.stripe_subscription_id) {
      return NextResponse.json({ 
        success: true, 
        message: 'No subscription to cancel' 
      });
    }

    // ============================================
    // IMMEDIATE CANCELLATION (no grace period)
    // ============================================
    const canceledSubscription = await stripe.subscriptions.cancel(
      account.stripe_subscription_id,
      {
        prorate: true, // Prorate the refund
        invoice_now: false // Don't generate a final invoice
      }
    );

    console.log('🔥 Subscription cancelled immediately:', canceledSubscription.id);

    // Update database
    await supabase
      .from('accounts')
      .update({
        subscription_status: 'canceled',
        plan: 'no_plan',
        stripe_subscription_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled immediately',
      details: {
        subscription_id: canceledSubscription.id,
        immediate: true,
        note: 'Access has been revoked immediately'
      }
    });

  } catch (error: any) {
    console.error('💥 Immediate cancellation error:', error);
    return NextResponse.json({
      error: 'Failed to cancel subscription immediately',
      code: 'IMMEDIATE_CANCEL_ERROR'
    }, { status: 500 });
  }
}