/**
 * Prompt Page by Slug API Route
 * 
 * This endpoint fetches and updates prompt page data for a specific slug
 * using the service key to bypass RLS policies for public access
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug is required" },
        { status: 400 }
      );
    }

    console.log(`[PROMPT-PAGE-BY-SLUG] Fetching prompt page for slug: ${slug}`);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[PROMPT-PAGE-BY-SLUG] Missing Supabase configuration');
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: promptPage, error } = await supabase
      .from('prompt_pages')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('[PROMPT-PAGE-BY-SLUG] Error fetching prompt page:', error);
      return NextResponse.json(
        { error: "Failed to fetch prompt page" },
        { status: 500 }
      );
    }

    if (!promptPage) {
      console.log(`[PROMPT-PAGE-BY-SLUG] No prompt page found for slug: ${slug}`);
      return NextResponse.json(
        { error: "Prompt page not found" },
        { status: 404 }
      );
    }

    console.log(`[PROMPT-PAGE-BY-SLUG] Successfully fetched prompt page: ${promptPage.id}`);
    return NextResponse.json(promptPage);
  } catch (error) {
    console.error('[PROMPT-PAGE-BY-SLUG] Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    if (!slug) {
      return NextResponse.json(
        { error: "Slug is required" },
        { status: 400 }
      );
    }

    console.log(`[PROMPT-PAGE-BY-SLUG] Updating prompt page for slug: ${slug}`);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[PROMPT-PAGE-BY-SLUG] Missing Supabase configuration');
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: promptPage, error } = await supabase
      .from('prompt_pages')
      .update(body)
      .eq('slug', slug)
      .select()
      .single();

    if (error) {
      console.error('[PROMPT-PAGE-BY-SLUG] Error updating prompt page:', error);
      return NextResponse.json(
        { error: "Failed to update prompt page" },
        { status: 500 }
      );
    }

    console.log(`[PROMPT-PAGE-BY-SLUG] Successfully updated prompt page: ${promptPage.id}`);
    return NextResponse.json(promptPage);
  } catch (error) {
    console.error('[PROMPT-PAGE-BY-SLUG] Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 