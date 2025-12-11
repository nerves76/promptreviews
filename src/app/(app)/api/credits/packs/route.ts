/**
 * GET /api/credits/packs
 *
 * Get available credit packs for purchase.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getCreditPacks } from '@/lib/credits';
import { createClient } from '@supabase/supabase-js';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get available packs
    const packs = await getCreditPacks(serviceSupabase);

    return NextResponse.json({
      packs: packs.map((pack) => ({
        id: pack.id,
        name: pack.name,
        credits: pack.credits,
        priceCents: pack.priceCents,
        priceFormatted: `$${(pack.priceCents / 100).toFixed(0)}`,
        hasOneTime: !!pack.stripePriceId,
        hasRecurring: !!pack.stripePriceIdRecurring,
      })),
    });
  } catch (error) {
    console.error('❌ [Credits] Packs GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
