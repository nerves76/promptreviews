import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { credit, ensureBalanceExists } from "@/lib/credits";

// Lazy initialization to avoid build-time env var access
function getStripeClient() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(stripeSecretKey);
}

export async function POST(req: NextRequest) {
  const stripe = getStripeClient();
  console.log("🔔 Webhook endpoint called"); // Debug: confirm webhook is being called
  
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  if (!webhookSecret) {
    console.error("❌ STRIPE_WEBHOOK_SECRET is not set");
    throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  }

  // Stripe requires the raw body for signature verification
  const rawBody = await req.text();
  console.log("📋 Webhook body length:", rawBody.length); // Debug: confirm body received

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, webhookSecret!);
    console.log("🔔 Received Stripe event:", event.type);
    console.log("📋 Event ID:", event.id);
  } catch (err: any) {
    console.error("❌ Stripe webhook signature verification failed:", err);
    console.error("❌ Received signature:", sig?.substring(0, 50) + "...");
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }

  // Connect to Supabase (no cookies needed for webhooks)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Handle checkout session completed (for new subscriptions from checkout)
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log("✅ Checkout session completed:", session.id);
    console.log("  Customer ID:", session.customer);
    console.log("  Customer Email:", session.customer_email);
    console.log("  Subscription ID:", session.subscription);
    console.log("  Metadata:", session.metadata);
    
    // Extract metadata
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan;
    const billingPeriod = session.metadata?.billingPeriod || 'monthly';
    
    // Check if this is a credit pack purchase
    const creditPackCredits = session.metadata?.credits;
    const creditPackType = session.metadata?.pack_type;
    const accountId = session.metadata?.accountId || userId;

    if (creditPackCredits && creditPackType) {
      // This is a credit pack purchase
      console.log("💳 Processing credit pack purchase");
      console.log("  Account ID:", accountId);
      console.log("  Credits:", creditPackCredits);
      console.log("  Pack Type:", creditPackType);

      if (accountId) {
        try {
          // Ensure balance record exists
          await ensureBalanceExists(supabase, accountId);

          // Grant purchased credits
          const creditsToGrant = parseInt(creditPackCredits, 10);
          await credit(supabase, accountId, creditsToGrant, {
            creditType: 'purchased',
            transactionType: 'purchase',
            stripeSessionId: session.id,
            idempotencyKey: `checkout:${session.id}`,
            description: `Credit pack purchase: ${creditsToGrant} credits`,
          });

          console.log(`✅ Granted ${creditsToGrant} credits to account ${accountId}`);
        } catch (creditError: any) {
          // IdempotencyError means we already processed this - that's OK
          if (creditError.name === 'IdempotencyError') {
            console.log("⚠️ Credit pack already processed (idempotency check):", session.id);
          } else {
            console.error("❌ Failed to grant credits:", creditError);
            // Don't fail the webhook - credits can be manually reconciled
          }
        }
      } else {
        console.error("❌ No accountId in credit pack checkout session metadata");
      }
    } else if (userId && plan) {
      // This is a subscription checkout
      console.log("📝 Updating account from checkout session");
      console.log("  User ID:", userId);
      console.log("  Plan:", plan);
      console.log("  Billing Period:", billingPeriod);

      // Update the account with the new subscription info
      const { data, error } = await supabase
        .from("accounts")
        .update({
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          plan: plan,
          billing_period: billingPeriod,
          subscription_status: 'active',
          has_had_paid_plan: true,
        })
        .eq("id", userId)
        .select();

      if (error) {
        console.error("❌ Failed to update account from checkout:", error);
      } else {
        console.log("✅ Account updated successfully from checkout:", data);
      }
    } else {
      console.warn("⚠️ Missing metadata in checkout session:", { userId, plan, creditPackCredits });
    }
  }

  // Handle subscription events
  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted" ||
    event.type === "customer.subscription.trial_will_end" ||
    event.type === "customer.subscription.paused" ||
    event.type === "customer.subscription.resumed"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;
    // Use the Stripe price lookup_key for plan logic (e.g., 'maven_100' -> 'maven')
    const lookupKey =
      subscription.items.data[0]?.price.lookup_key?.toLowerCase() ||
      "builder_35";
    const plan = lookupKey.split("_")[0]; // e.g., 'maven_100' -> 'maven'
    const status = subscription.status;

    // Enhanced debug logging
    console.log("📋 Webhook processing details:");
    console.log("  Customer ID:", customerId);
    console.log("  Subscription ID:", subscription.id);
    console.log("  Price ID:", subscription.items.data[0]?.price.id);
    console.log("  Lookup Key:", lookupKey);
    console.log("  Extracted Plan:", plan);
    console.log("  Status:", status);

    // Determine if this is a paid plan
    const isPaidPlan = plan === "builder" || plan === "maven";
    
    // Determine max users based on plan
    let maxUsers = 1; // Default for grower/free
    if (plan === "builder") {
      maxUsers = 3;
    } else if (plan === "maven") {
      maxUsers = 5;
    }

    // Determine max locations based on plan
    let maxLocations = 0; // Default for grower/builder/free
    if (plan === "maven") {
      maxLocations = 10;
    }

    // Determine billing period from subscription interval
    const billingPeriod = subscription.items.data[0]?.price.recurring?.interval === 'year' ? 'annual' : 'monthly';
    console.log("  Billing Period:", billingPeriod);

    // Update the user's account in Supabase by customerId
    console.log("🔄 Attempting to update account by customer ID:", customerId);
    console.log("  Setting max_users to:", maxUsers);
    let updateResult = await supabase
      .from("accounts")
      .update({
        plan,
        plan_lookup_key: lookupKey,
        stripe_subscription_id: subscription.id,
        subscription_status: status,
        billing_period: billingPeriod,
        max_users: maxUsers,
        max_locations: maxLocations,
        ...(isPaidPlan ? { has_had_paid_plan: true } : {}),
      })
      .eq("stripe_customer_id", customerId)
      .select();
    console.log("✅ Primary update result:", updateResult.data?.length || 0, "rows updated");

    // Enhanced fallback: try multiple methods to find the account
    if (!updateResult.data || updateResult.data.length === 0) {
      console.log("⚠️  Primary update failed, trying fallback methods...");
      
      // Method 1: Try to get email from checkout session metadata
      let email = subscription.metadata?.userEmail || subscription.metadata?.email || null;
      
      // Method 2: Fetch customer from Stripe if email is missing
      if (!email) {
        try {
          const customer = await stripe.customers.retrieve(customerId);
          if (
            typeof customer === "object" &&
            "email" in customer &&
            customer.email
          ) {
            email = customer.email;
            console.log("📧 Fetched email from Stripe customer:", email);
          } else {
            console.log("❌ No email found on Stripe customer object.");
          }
        } catch (fetchErr) {
          console.error("❌ Error fetching customer from Stripe:", fetchErr);
        }
      }
      
      // Method 3: Try to find by userId from metadata
      const userId = subscription.metadata?.userId;
      if (!email && userId) {
        console.log("🔍 Trying to find account by userId from metadata:", userId);
        const { data: accountData, error: accountError } = await supabase
          .from("accounts")
          .select("email")
          .eq("id", userId)
          .single();
        
        if (accountData && !accountError) {
          email = accountData.email;
          console.log("📧 Found email from userId lookup:", email);
        } else {
          console.log("❌ Could not find account by userId:", userId);
        }
      }
      
      // Method 4: Update by email if found
      if (email) {
        console.log("🔄 Fallback: updating account by email:", email);
        updateResult = await supabase
          .from("accounts")
          .update({
            plan,
            plan_lookup_key: lookupKey,
            stripe_subscription_id: subscription.id,
            subscription_status: status,
            stripe_customer_id: customerId, // CRITICAL: always set this for future events
            billing_period: billingPeriod,
            max_users: maxUsers,
            max_locations: maxLocations,
            ...(isPaidPlan ? { has_had_paid_plan: true } : {}),
          })
          .eq("email", email)
          .select();
        console.log("✅ Fallback update result:", updateResult.data?.length || 0, "rows updated");
        
        if (updateResult.data && updateResult.data.length > 0) {
          console.log("🎉 Account successfully updated via email fallback!");
        }
      }
      
      // Method 5: Try by userId if email failed
      if ((!updateResult.data || updateResult.data.length === 0) && userId) {
        console.log("🔄 Last resort: updating account by userId:", userId);
        updateResult = await supabase
          .from("accounts")
          .update({
            plan,
            plan_lookup_key: lookupKey,
            stripe_subscription_id: subscription.id,
            subscription_status: status,
            stripe_customer_id: customerId, // CRITICAL: always set this for future events
            billing_period: billingPeriod,
            max_users: maxUsers,
            max_locations: maxLocations,
            ...(isPaidPlan ? { has_had_paid_plan: true } : {}),
          })
          .eq("id", userId)
          .select();
        console.log("✅ UserId fallback update result:", updateResult.data?.length || 0, "rows updated");
        
        if (updateResult.data && updateResult.data.length > 0) {
          console.log("🎉 Account successfully updated via userId fallback!");
        }
      }
      
      // ============================================
      // CRITICAL FIX: Store failed webhook for recovery
      // This ensures no payment data is ever lost
      // ============================================
      if (!updateResult.data || updateResult.data.length === 0) {
        console.error("🚨 CRITICAL: All update methods failed!");
        console.error("  Customer ID:", customerId);
        console.error("  Email:", email);
        console.error("  User ID:", userId);
        console.error("  Plan:", plan);
        console.error("  Subscription ID:", subscription.id);
        
        // Import the recovery system
        const { WebhookRecoverySystem } = await import('@/lib/webhook-recovery');
        const recovery = new WebhookRecoverySystem(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        // Store for recovery
        await recovery.storeFailedWebhook({
          eventId: event.id,
          eventType: event.type,
          customerId: customerId,
          subscriptionId: subscription.id,
          payload: subscription,
          error: `Could not match customer to account - tried customer_id: ${customerId}, email: ${email}, user_id: ${userId}`
        });
        
        // Don't return error - webhook was received successfully
        // Recovery will happen asynchronously
        console.log("📦 Webhook stored for recovery - will retry automatically");
      }
    }
    
    if (updateResult.error) {
      console.error("Supabase update error:", updateResult.error.message);
      return NextResponse.json(
        { error: updateResult.error.message },
        { status: 500 },
      );
    }
  } else if (
    event.type === "invoice.payment_succeeded" ||
    event.type === "invoice.payment_failed"
  ) {
    // Handle invoice/payment events
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = invoice.customer as string;
    const subscriptionId = typeof (invoice as any).subscription === 'string'
      ? (invoice as any).subscription
      : (invoice as any).subscription?.id || null;

    console.log("💳 Processing payment event:", event.type);
    console.log("  Customer ID:", customerId);
    console.log("  Subscription ID:", subscriptionId);
    console.log("  Invoice ID:", invoice.id);
    console.log("  Amount:", invoice.amount_paid / 100, "USD");
    console.log("  Status:", invoice.status);

    const paymentSucceeded = event.type === "invoice.payment_succeeded";

    // Check if this is a credit subscription renewal
    if (paymentSucceeded && subscriptionId) {
      try {
        // Fetch the subscription to check its metadata
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const creditPackCredits = subscription.metadata?.credits;
        const packType = subscription.metadata?.pack_type;
        const accountId = subscription.metadata?.accountId;

        if (creditPackCredits && packType === 'auto_topup' && accountId) {
          console.log("💳 Processing credit subscription renewal");
          console.log("  Account ID:", accountId);
          console.log("  Credits:", creditPackCredits);

          try {
            // Ensure balance record exists
            await ensureBalanceExists(supabase, accountId);

            // Grant purchased credits
            const creditsToGrant = parseInt(creditPackCredits, 10);
            await credit(supabase, accountId, creditsToGrant, {
              creditType: 'purchased',
              transactionType: 'subscription_renewal',
              stripeInvoiceId: invoice.id,
              idempotencyKey: `invoice:${invoice.id}`,
              description: `Credit subscription renewal: ${creditsToGrant} credits`,
            });

            console.log(`✅ Granted ${creditsToGrant} credits to account ${accountId} (subscription renewal)`);
          } catch (creditError: any) {
            if (creditError.name === 'IdempotencyError') {
              console.log("⚠️ Credit renewal already processed (idempotency check):", invoice.id);
            } else {
              console.error("❌ Failed to grant credits on renewal:", creditError);
              // Don't fail the webhook - credits can be manually reconciled
            }
          }
        }
      } catch (subError) {
        console.error("❌ Failed to fetch subscription for credit check:", subError);
      }
    }

    // Update payment status in our database (for regular plan subscriptions)
    const subscriptionUpdateData = {
      subscription_status: paymentSucceeded ? 'active' : 'past_due',
      updated_at: new Date().toISOString(),
    };

    // Update account by customer ID
    console.log("🔄 Updating payment status for customer:", customerId);
    const updateResult = await supabase
      .from("accounts")
      .update(subscriptionUpdateData)
      .eq("stripe_customer_id", customerId)
      .select();

    console.log("✅ Payment status update result:", updateResult.data?.length || 0, "rows updated");

    if (updateResult.error) {
      console.error("Supabase payment update error:", updateResult.error.message);
      return NextResponse.json(
        { error: updateResult.error.message },
        { status: 500 },
      );
    }

    // If payment succeeded and this was a past_due subscription, mark as reactivated
    if (paymentSucceeded && subscriptionId) {
      console.log("🎉 Payment succeeded - account reactivated!");
    }
  } else if (event.type === "charge.refunded") {
    // Handle refunds - claw back credits if this was a credit pack purchase
    const charge = event.data.object as Stripe.Charge;
    console.log("💸 Processing refund event");
    console.log("  Charge ID:", charge.id);
    console.log("  Amount Refunded:", charge.amount_refunded / 100, "USD");
    console.log("  Metadata:", charge.metadata);

    // Check if this charge has credit pack metadata
    const creditPackCredits = charge.metadata?.credits;
    const accountId = charge.metadata?.accountId;

    if (creditPackCredits && accountId) {
      try {
        const creditsToClawBack = parseInt(creditPackCredits, 10);

        // Create a negative credit entry (claw back)
        // We use the debit function with a refund transaction type
        const { data: balance } = await supabase
          .from('credit_balances')
          .select('purchased_credits')
          .eq('account_id', accountId)
          .single();

        if (balance) {
          // Reduce purchased credits (but don't go below 0)
          const currentPurchased = balance.purchased_credits || 0;
          const newPurchased = Math.max(0, currentPurchased - creditsToClawBack);
          const clawedBack = currentPurchased - newPurchased;

          if (clawedBack > 0) {
            // Update balance
            await supabase
              .from('credit_balances')
              .update({
                purchased_credits: newPurchased,
                updated_at: new Date().toISOString(),
              })
              .eq('account_id', accountId);

            // Create ledger entry
            const { data: currentBalance } = await supabase
              .from('credit_balances')
              .select('included_credits, purchased_credits')
              .eq('account_id', accountId)
              .single();

            const totalAfter = (currentBalance?.included_credits || 0) + newPurchased;

            await supabase
              .from('credit_ledger')
              .insert({
                account_id: accountId,
                amount: -clawedBack,
                balance_after: totalAfter,
                credit_type: 'purchased',
                transaction_type: 'refund',
                stripe_charge_id: charge.id,
                idempotency_key: `refund:${charge.id}`,
                description: `Refund: ${clawedBack} credits clawed back`,
              });

            console.log(`✅ Clawed back ${clawedBack} credits from account ${accountId}`);
          } else {
            console.log("⚠️ No purchased credits to claw back");
          }
        }
      } catch (clawBackError: any) {
        if (clawBackError.code === '23505') {
          console.log("⚠️ Refund already processed (idempotency check):", charge.id);
        } else {
          console.error("❌ Failed to claw back credits:", clawBackError);
          // Don't fail the webhook - can be manually reconciled
        }
      }
    } else {
      console.log("ℹ️ Refund is not for a credit pack purchase - ignoring");
    }
  } else {
    console.log("ℹ️  Received non-handled event:", event.type, "- ignoring");
  }

  // Respond to Stripe
  return NextResponse.json({ received: true });
}
