import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient, createServerSupabaseClient } from "@/auth/providers/supabase";

export async function POST(req: NextRequest) {
  try {
    // Get the user from the request
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { firstName, lastName, email, businessName } = await req.json();

    // Validate required fields
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Use service role client to bypass RLS for account creation
    const serviceClient = createServiceRoleClient();

    // Create the new account
    const { data: newAccount, error: accountError } = await serviceClient
      .from('accounts')
      .insert({
        first_name: firstName || '',
        last_name: lastName || '',
        email: email,
        business_name: businessName || null,
        plan: 'no_plan',
        trial_start: null,
        trial_end: null,
        is_free_account: false,
        is_additional_account: true,
        business_creation_complete: false, // New account, business not created yet
        custom_prompt_page_count: 0,
        contact_count: 0,
        review_notifications_enabled: true,
        created_by: user.id,
      })
      .select('id')
      .single();

    if (accountError) {
      console.error('Failed to create account:', accountError);
      return NextResponse.json({
        error: accountError.message || "Failed to create account"
      }, { status: 500 });
    }

    // Link the user to the new account as owner
    const { error: linkError } = await serviceClient
      .from('account_users')
      .insert({
        account_id: newAccount.id,
        user_id: user.id,
        role: 'owner',
      });

    if (linkError && linkError.code !== '23505') {
      console.error('Failed to link account to user:', linkError);
      return NextResponse.json({
        error: "Failed to link account to user"
      }, { status: 500 });
    }

    // Return the new account ID so the client can switch to it
    return NextResponse.json({
      success: true,
      accountId: newAccount.id,
      businessName: businessName || '',
      message: "Account created successfully"
    });

  } catch (err: any) {
    console.error('Unexpected error in create-additional:', err);
    return NextResponse.json({
      error: err?.message || "Internal server error"
    }, { status: 500 });
  }
}
