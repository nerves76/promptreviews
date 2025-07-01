/**
 * Review Submissions API Route
 * 
 * This endpoint handles review submissions using the service key to bypass RLS policies
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log(`[REVIEW-SUBMISSIONS] Creating review submission for prompt page: ${body.prompt_page_id}`);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[REVIEW-SUBMISSIONS] Missing Supabase configuration');
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: submission, error } = await supabase
      .from('review_submissions')
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error('[REVIEW-SUBMISSIONS] Error creating review submission:', error);
      return NextResponse.json(
        { error: "Failed to create review submission" },
        { status: 500 }
      );
    }

    console.log(`[REVIEW-SUBMISSIONS] Successfully created review submission: ${submission.id}`);
    return NextResponse.json(submission);
  } catch (error) {
    console.error('[REVIEW-SUBMISSIONS] Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 