import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Map your plan keys to Stripe price IDs
const PRICE_IDS: Record<string, string> = {
  grower: process.env.STRIPE_PRICE_ID_GROWER!,
  builder: process.env.STRIPE_PRICE_ID_BUILDER!,
  maven: process.env.STRIPE_PRICE_ID_MAVEN!,
};

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json();
    if (!plan || !PRICE_IDS[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Optionally, get user info from session/cookies here

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: PRICE_IDS[plan],
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/plan?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/plan?canceled=1`,
      // Optionally, pass customer/user info here
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 