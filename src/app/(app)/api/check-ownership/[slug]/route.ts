import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getRequestAccountId } from "@/app/(app)/api/utils/getRequestAccountId";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

    // Create Supabase client (same pattern as check-admin)
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get the current user (same pattern as check-admin)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('No authenticated user found in ownership check');
      return NextResponse.json({ isOwner: false });
    }

    console.log('Auth user found for ownership check:', user.email);

    // Get the prompt page to check ownership
    const { data: promptPage, error: promptError } = await supabase
      .from('prompt_pages')
      .select('account_id')
      .eq('slug', slug)
      .single();

    if (promptError || !promptPage) {
      console.log('Prompt page not found or error:', promptError);
      return NextResponse.json({ isOwner: false });
    }

    console.log('Prompt page account_id:', promptPage.account_id);

    // Check if user owns this prompt page by comparing account_ids
    // Use proper utility function that handles multiple account_user records
    const accountId = await getRequestAccountId(request, user.id, supabase);

    if (!accountId) {
      console.log('No account found for user');
      return NextResponse.json({ isOwner: false });
    }

    console.log('User account_id:', accountId);

    const isOwner = accountId === promptPage.account_id;
    
    console.log('Ownership check result:', isOwner ? 'User is owner' : 'User is not owner');

    return NextResponse.json({
      isOwner,
      userEmail: user.email
    });

  } catch (error) {
    console.error('Error in ownership check:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 