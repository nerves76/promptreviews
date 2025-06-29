/**
 * Businesses API Route
 * 
 * This endpoint handles business creation and retrieval
 * using the service key to bypass RLS policies for API operations
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[BUSINESSES] Missing Supabase configuration');
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('*');

    if (error) {
      console.error('[BUSINESSES] Error fetching businesses:', error);
      return NextResponse.json(
        { error: "Failed to fetch businesses" },
        { status: 500 }
      );
    }

    return NextResponse.json(businesses || []);
  } catch (error) {
    console.error('[BUSINESSES] Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, account_id } = await request.json();

    if (!name || !account_id) {
      return NextResponse.json(
        { error: "Missing required fields: name and account_id" },
        { status: 400 }
      );
    }

    console.log(`[BUSINESSES] Creating business: ${name} for account: ${account_id}`);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[BUSINESSES] Missing Supabase configuration');
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: business, error } = await supabase
      .from('businesses')
      .insert([
        {
          name,
          account_id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[BUSINESSES] Error creating business:', error);
      return NextResponse.json(
        { 
          error: "Failed to create business",
          details: error.message 
        },
        { status: 500 }
      );
    }

    console.log('[BUSINESSES] Business created successfully:', business.id);
    return NextResponse.json(business);
  } catch (error) {
    console.error('[BUSINESSES] Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 