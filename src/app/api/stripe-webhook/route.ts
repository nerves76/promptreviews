import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-08-16' });

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  // Stripe requires the raw body for signature verification
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, webhookSecret);
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Connect to Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Handle subscription events
  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;
    // Use the Stripe price nickname as the plan name, fallback to null
    const plan = subscription.items.data[0]?.price.nickname?.toLowerCase() || null;
    const status = subscription.status;

    // Update the user's account in Supabase
    const { error } = await supabase
      .from('accounts')
      .update({
        plan,
        stripe_subscription_id: subscription.id,
        subscription_status: status,
      })
      .eq('stripe_customer_id', customerId);
    if (error) {
      console.error('Supabase update error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Respond to Stripe
  return NextResponse.json({ received: true });
} 