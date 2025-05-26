import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-08-16' });

// Map your plan keys to Stripe price IDs (only paid plans)
const PRICE_IDS: Record<string, string> = {
  builder: process.env.STRIPE_PRICE_ID_BUILDER!,
  maven: process.env.STRIPE_PRICE_ID_MAVEN!,
};

export async function POST(req: NextRequest) {
  const { plan, userId, email } = await req.json();

  if (!plan || !PRICE_IDS[plan]) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    customer_email: email,
    line_items: [
      { price: PRICE_IDS[plan], quantity: 1 }
    ],
    metadata: { userId, plan },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=1`,
  });

  return NextResponse.json({ url: session.url });
} 