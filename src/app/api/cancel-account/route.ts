/**
 * Account Cancellation API
 * 
 * Implements soft-deletion for 90-day retention policy.
 * Sets deleted_at timestamp instead of permanently deleting the account.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;

    // Parse request body
    const { confirm } = await request.json();

    if (!confirm) {
      return NextResponse.json({ error: 'Confirmation required' }, { status: 400 });
    }

    console.log(`🗑️ Account cancellation requested for user: ${userId}`);

    // Get the user's account
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, email, deleted_at')
      .eq('id', userId)
      .single();

    if (accountError) {
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

    // Soft delete the account - set deleted_at and reset plan
    const { data: updateData, error: updateError } = await supabase
      .from('accounts')
      .update({ 
        deleted_at: new Date().toISOString(),
        plan: 'no_plan'  // Reset plan so they see plan selection if they return
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error soft-deleting account:', updateError);
      return NextResponse.json({ error: 'Failed to cancel account' }, { status: 500 });
    }

    console.log(`✅ Account soft-deleted successfully: ${account.email}`);

    // Cancel Stripe subscription if exists
    try {
      const { data: accountData } = await supabase
        .from('accounts')
        .select('stripe_subscription_id, stripe_customer_id')
        .eq('id', userId)
        .single();

      if (accountData?.stripe_subscription_id) {
        // Note: In a real implementation, you'd want to cancel the Stripe subscription here
        // For now, we'll just log it
        console.log(`📋 Note: Stripe subscription ${accountData.stripe_subscription_id} should be cancelled`);
      }
    } catch (stripeError) {
      console.warn('Error handling Stripe cancellation:', stripeError);
      // Don't fail the whole operation if Stripe handling fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Account cancelled successfully. Your data will be retained for 90 days.',
      details: {
        deletedAt: new Date().toISOString(),
        permanentDeletionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        planReset: true,
        note: 'If you return during the 90-day period, you\'ll need to select a plan to access your data.'
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Account cancellation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 