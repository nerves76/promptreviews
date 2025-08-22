import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { 
  createStripeClient,
  PRICE_IDS,
  SUPABASE_CONFIG,
  isValidPlan,
  getPriceId,
  getPlanOrder
} from "@/lib/billing/config";

const stripe = createStripeClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('📊 Preview billing change request:', body);
    
    const { plan, userId, billingPeriod = 'monthly' }: { 
      plan: string; 
      userId: string; 
      billingPeriod?: 'monthly' | 'annual' 
    } = body;
    
    if (!plan || !isValidPlan(plan)) {
      console.error('Invalid plan:', plan, 'Available plans:', Object.keys(PRICE_IDS));
      return NextResponse.json({ error: "Invalid plan", message: `Plan "${plan}" is not valid` }, { status: 400 });
    }

    if (!userId) {
      console.error('No user ID provided');
      return NextResponse.json({ error: "User ID is required", message: "User ID is required" }, { status: 400 });
    }

    // Fetch current account info including Stripe customer ID
    const supabase = createClient(
      SUPABASE_CONFIG.URL,
      SUPABASE_CONFIG.SERVICE_ROLE_KEY,
    );
    
    const { data: account, error } = await supabase
      .from("accounts")
      .select("stripe_customer_id, stripe_subscription_id, plan, billing_period")
      .eq("id", userId)
      .single();
      
    if (error || !account) {
      console.error("Error fetching account:", error);
      return NextResponse.json({ 
        error: "Account not found", 
        message: "Unable to find your account information" 
      }, { status: 404 });
    }

    console.log('📊 Account found:', {
      hasStripeCustomer: !!account.stripe_customer_id,
      hasSubscription: !!account.stripe_subscription_id,
      currentPlan: account.plan,
      currentBilling: account.billing_period
    });

    if (!account.stripe_customer_id || !account.stripe_subscription_id) {
      console.error('No active subscription:', {
        stripe_customer_id: account.stripe_customer_id,
        stripe_subscription_id: account.stripe_subscription_id
      });
      return NextResponse.json({ 
        error: "No active subscription",
        message: "No subscription found to modify. Please contact support if you believe this is an error." 
      }, { status: 400 });
    }

    // Fetch the current subscription
    let subscription;
    try {
      subscription = await stripe.subscriptions.retrieve(account.stripe_subscription_id);
      console.log('📊 Subscription retrieved:', {
        id: subscription.id,
        status: subscription.status,
        itemCount: subscription.items?.data?.length || 0
      });
    } catch (stripeError: any) {
      console.error("Failed to retrieve subscription from Stripe:", stripeError);
      return NextResponse.json({ 
        error: "Subscription not found",
        message: "Unable to retrieve your subscription. It may have been canceled or is invalid." 
      }, { status: 400 });
    }
    
    // Check if subscription has items
    if (!subscription.items || !subscription.items.data || subscription.items.data.length === 0) {
      console.error("Subscription has no items:", subscription.id);
      return NextResponse.json({ 
        error: "Invalid subscription state",
        message: "Your subscription appears to be in an invalid state. Please contact support." 
      }, { status: 400 });
    }
    
    // Get the new price ID
    const newPriceId = getPriceId(plan, billingPeriod);
    
    if (!newPriceId) {
      console.error("Invalid price ID for plan:", plan, billingPeriod);
      return NextResponse.json({ 
        error: "Invalid plan configuration",
        message: "The selected plan is not properly configured. Please try again or contact support." 
      }, { status: 400 });
    }
    
    // Create a preview of the proration
    const proration_date = Math.floor(Date.now() / 1000);
    
    // Check for data inconsistency between database and Stripe
    const currentStripePrice = subscription.items.data[0].price.id;
    const expectedPrices = PRICE_IDS[account.plan];
    const isStripePriceConsistent = expectedPrices && (
      currentStripePrice === expectedPrices.monthly || 
      currentStripePrice === expectedPrices.annual
    );
    
    if (!isStripePriceConsistent) {
      console.warn('⚠️ Data inconsistency detected:', {
        databasePlan: account.plan,
        databaseBilling: account.billing_period,
        stripePriceId: currentStripePrice,
        expectedPrices
      });
    }
    
    // Determine actual billing period from Stripe price ID
    // This is the source of truth, not the database
    let actualBillingPeriod = account.billing_period;
    let actualPlan = account.plan;
    
    // Check all plans to find which one matches the Stripe price
    for (const [planKey, prices] of Object.entries(PRICE_IDS)) {
      if (currentStripePrice === prices.annual) {
        actualBillingPeriod = 'annual';
        actualPlan = planKey;
        break;
      } else if (currentStripePrice === prices.monthly) {
        actualBillingPeriod = 'monthly';
        actualPlan = planKey;
        break;
      }
    }
    
    console.log('📊 Attempting to preview invoice with:', {
      customer: account.stripe_customer_id,
      subscription: subscription.id,
      currentItemId: subscription.items.data[0].id,
      currentPrice: currentStripePrice,
      newPrice: newPriceId,
      proration_date,
      detectedBilling: actualBillingPeriod,
      databaseBilling: account.billing_period
    });
    
    // Preview the upcoming invoice with the changes
    let upcomingInvoice;
    try {
      // Use createPreview for Stripe SDK v18+
      upcomingInvoice = await stripe.invoices.createPreview({
        customer: account.stripe_customer_id,
        subscription: subscription.id,
        subscription_details: {
          items: [
            {
              id: subscription.items.data[0].id,
              price: newPriceId,
            },
          ],
          proration_date: proration_date,
          proration_behavior: 'create_prorations',
        },
      });
    } catch (stripeError: any) {
      console.error("Failed to retrieve upcoming invoice from Stripe:", stripeError);
      
      // Check if it's because the prices are the same
      if (stripeError.message?.includes('no change') || stripeError.message?.includes('same price')) {
        return NextResponse.json({
          preview: {
            currentPlan: `${account.plan} (${account.billing_period})`,
            newPlan: `${plan} (${billingPeriod})`,
            creditAmount: "0.00",
            chargeAmount: "0.00",
            netAmount: "0.00",
            isCredit: false,
            message: "No price change. You're already on this plan.",
            timeline: "No changes will be made.",
            stripeEmail: null,
            processingFeeNote: null
          }
        });
      }
      
      return NextResponse.json({ 
        error: "Unable to calculate billing",
        message: `Unable to preview billing changes: ${stripeError.message || 'Unknown error'}` 
      }, { status: 400 });
    }

    // Debug: Log what we're getting from Stripe
    console.log('📊 Invoice lines from Stripe:', upcomingInvoice.lines.data.map(line => ({
      description: line.description,
      amount: line.amount / 100,
      proration: line.proration,
      type: line.type,
      period: line.period ? {
        start: new Date(line.period.start * 1000).toISOString(),
        end: new Date(line.period.end * 1000).toISOString()
      } : null
    })));
    
    // Identify if this is an upgrade or downgrade based on plan comparison
    // Use the ACTUAL plan from Stripe, not what the database says
    const isDowngrade = getPlanOrder(plan) < getPlanOrder(actualPlan);
    const isUpgrade = getPlanOrder(plan) > getPlanOrder(actualPlan);
    
    // Calculate credits and charges
    let creditAmount = 0;
    let chargeAmount = 0;
    
    // Process invoice lines
    for (const line of upcomingInvoice.lines.data) {
      // Skip future renewal charges (next year's subscription)
      if (line.period && new Date(line.period.start * 1000) > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
        continue; // Skip lines that start more than 30 days in the future
      }
      
      if (line.amount < 0) {
        // Negative amounts are credits
        creditAmount += Math.abs(line.amount) / 100;
      } else if (line.amount > 0) {
        // Positive amounts are charges (for prorated new plan or remaining time)
        // This includes "Remaining time on X" and "1 × Plan (at $X / period)" lines
        chargeAmount += line.amount / 100;
      }
    }
    
    // For downgrades, the net should be negative (credit)
    // For upgrades, the net should be positive (charge)
    const netAmount = chargeAmount - creditAmount;
    
    console.log('📊 Calculated amounts:', { 
      creditAmount, 
      chargeAmount, 
      netAmount,
      isDowngrade,
      isUpgrade,
      lineCount: upcomingInvoice.lines.data.length 
    });

    return NextResponse.json({
      preview: {
        currentPlan: `${actualPlan} (${actualBillingPeriod})`,
        newPlan: `${plan} (${billingPeriod})`,
        creditAmount: creditAmount.toFixed(2),
        chargeAmount: chargeAmount.toFixed(2),
        netAmount: netAmount.toFixed(2),
        isCredit: netAmount < 0,
        message: (() => {
          // Use the actual billing period detected from Stripe, not the database
          const isFromAnnual = actualBillingPeriod === 'annual';
          const isToMonthly = billingPeriod === 'monthly';
          const isBillingSwitch = isFromAnnual !== (billingPeriod === 'annual');
          
          if (isDowngrade) {
            // Downgrade - user should receive credit
            if (netAmount < 0) {
              if (isFromAnnual && isToMonthly) {
                return `You'll receive a credit of $${Math.abs(netAmount).toFixed(2)} from your unused annual ${actualPlan} subscription. This credit will cover multiple months of your new ${plan} plan.`;
              }
              return `You'll receive a credit of $${Math.abs(netAmount).toFixed(2)} for the unused time on your ${actualPlan} plan. This credit will be applied to future invoices.`;
            } else {
              // Downgrade but still costs money (can happen when switching billing periods)
              return `You'll be charged $${netAmount.toFixed(2)} for the plan change.`;
            }
          } else if (isUpgrade) {
            // Upgrade - user should be charged (usually)
            if (netAmount > 0) {
              return `You'll be charged $${netAmount.toFixed(2)} for the prorated difference.`;
            } else if (netAmount < 0) {
              // Upgrade but getting credit (e.g., annual to monthly upgrade)
              if (isFromAnnual && isToMonthly) {
                return `You'll receive a credit of $${Math.abs(netAmount).toFixed(2)} from your unused annual ${actualPlan} subscription. This credit will cover your ${plan} monthly fees for several months.`;
              }
              return `You'll receive a credit of $${Math.abs(netAmount).toFixed(2)}. Your existing credit covers the upgrade and will be applied to future invoices.`;
            } else {
              return `No additional charge. Your existing credit covers the upgrade.`;
            }
          } else {
            // Same plan, different billing period
            if (netAmount > 0) {
              return `You'll be charged $${netAmount.toFixed(2)} for the billing period change.`;
            } else if (netAmount < 0) {
              return `You'll receive a credit of $${Math.abs(netAmount).toFixed(2)} for the billing period change.`;
            } else {
              return `No additional charge for the billing period change.`;
            }
          }
        })(),
        timeline: netAmount < 0
          ? "The credit will appear on your account immediately and will be automatically applied to your next invoice."
          : netAmount > 0
          ? "The charge will be processed immediately."
          : "The change will take effect immediately.",
        stripeEmail: netAmount < 0
          ? "You'll receive an email receipt from Stripe confirming the credit."
          : netAmount > 0
          ? "You'll receive an email receipt from Stripe confirming the charge."
          : "You'll receive an email confirmation from Stripe.",
        // Note about processing fees - important for transparency
        processingFeeNote: netAmount < 0 && isDowngrade
          ? "Note: This is the full credit amount you'll receive. Stripe's original processing fees are non-refundable per their policy."
          : null
      }
    });

  } catch (error: any) {
    console.error("Error previewing billing change:", error);
    console.error("Error stack:", error.stack);
    
    // Check for specific error types
    if (error.message?.includes('STRIPE_SECRET_KEY')) {
      return NextResponse.json(
        { error: "Configuration error", message: "Stripe is not properly configured. Please contact support." },
        { status: 500 }
      );
    }
    
    if (error.message?.includes('SUPABASE')) {
      return NextResponse.json(
        { error: "Database error", message: "Unable to access account information. Please try again." },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Server error", 
        message: error.message || "An unexpected error occurred while previewing billing changes. Please try again." 
      },
      { status: 500 }
    );
  }
}