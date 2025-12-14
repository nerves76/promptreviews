/**
 * POST /api/credits/finalize
 *
 * Finalize a credit purchase by session ID.
 * This is a backup mechanism in case the Stripe webhook didn't process.
 * It checks the Stripe session and grants credits if payment is complete.
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { createClient } from '@supabase/supabase-js';
import { credit, ensureBalanceExists } from '@/lib/credits';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getStripeClient() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(stripeSecretKey);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Parse body
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const stripe = getStripeClient();

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    // Verify payment is complete
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed', paymentStatus: session.payment_status },
        { status: 400 }
      );
    }

    // Verify this session belongs to this account
    const sessionAccountId = session.metadata?.accountId;
    if (sessionAccountId !== accountId) {
      console.error(`❌ [Credits Finalize] Account mismatch: session=${sessionAccountId}, request=${accountId}`);
      return NextResponse.json(
        { error: 'Session does not belong to this account' },
        { status: 403 }
      );
    }

    // Get credit info from metadata
    const creditsStr = session.metadata?.credits;
    const packType = session.metadata?.pack_type;

    if (!creditsStr || !packType) {
      return NextResponse.json(
        { error: 'Session is not a credit purchase' },
        { status: 400 }
      );
    }

    const creditsToGrant = parseInt(creditsStr, 10);

    console.log(`💳 [Credits Finalize] Processing session ${sessionId}`);
    console.log(`   Account: ${accountId}`);
    console.log(`   Credits: ${creditsToGrant}`);
    console.log(`   Pack Type: ${packType}`);

    try {
      // Ensure balance record exists
      await ensureBalanceExists(serviceSupabase, accountId);

      // Grant purchased credits (idempotency key prevents double-granting)
      await credit(serviceSupabase, accountId, creditsToGrant, {
        creditType: 'purchased',
        transactionType: 'purchase',
        stripeSessionId: session.id,
        idempotencyKey: `checkout:${session.id}`,
        description: `Credit pack purchase: ${creditsToGrant} credits`,
      });

      console.log(`✅ [Credits Finalize] Granted ${creditsToGrant} credits to account ${accountId}`);

      return NextResponse.json({
        success: true,
        credits: creditsToGrant,
        message: `${creditsToGrant} credits have been added to your account`,
      });
    } catch (creditError: any) {
      // IdempotencyError means we already processed this - that's OK
      if (creditError.name === 'IdempotencyError') {
        console.log(`⚠️ [Credits Finalize] Already processed (idempotency): ${session.id}`);
        return NextResponse.json({
          success: true,
          credits: creditsToGrant,
          alreadyProcessed: true,
          message: `Credits were already added to your account`,
        });
      }

      console.error('❌ [Credits Finalize] Failed to grant credits:', creditError);
      return NextResponse.json(
        { error: 'Failed to grant credits', details: creditError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ [Credits Finalize] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
