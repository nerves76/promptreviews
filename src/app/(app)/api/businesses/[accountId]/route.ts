/**
 * Business by Account ID API Route
 * 
 * This endpoint fetches business data for a specific account_id
 * using the service key to bypass RLS policies for public access
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    console.log(`[BUSINESS-BY-ACCOUNT] Fetching business for account: ${accountId}`);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[BUSINESS-BY-ACCOUNT] Missing Supabase configuration');
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: business, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('account_id', accountId)
      .maybeSingle();

    if (error) {
      console.error('[BUSINESS-BY-ACCOUNT] Error fetching business:', error);
      return NextResponse.json(
        { error: "Failed to fetch business" },
        { status: 500 }
      );
    }

    if (!business) {
      console.log(`[BUSINESS-BY-ACCOUNT] No business found for account: ${accountId}`);
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    console.log(`[BUSINESS-BY-ACCOUNT] Successfully fetched business: ${business.id}`);
    return NextResponse.json(business);
  } catch (error) {
    console.error('[BUSINESS-BY-ACCOUNT] Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 