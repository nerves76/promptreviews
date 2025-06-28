/**
 * Create Account API Route
 * 
 * This endpoint creates accounts and account_users records for new users
 * using the service role key to bypass RLS restrictions.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if account already exists
    const { data: existingAccount, error: checkError } = await supabase
      .from("accounts")
      .select("id")
      .eq("id", userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Error checking existing account:", checkError);
      return NextResponse.json(
        { error: "Failed to check existing account" },
        { status: 500 }
      );
    }

    if (existingAccount) {
      console.log("Account already exists for user:", userId);
      return NextResponse.json(
        { message: "Account already exists" },
        { status: 200 }
      );
    }

    // Create new account with only the fields that exist in the schema
    const { data: newAccount, error: createError } = await supabase
      .from("accounts")
      .insert({
        id: userId,
        trial_start: new Date().toISOString(),
        trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        is_free_account: false,
        custom_prompt_page_count: 0,
        contact_count: 0,
        plan: 'grower'
      })
      .select()
      .single();

    if (createError) {
      console.error("Account creation error:", createError);
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    // Create account_users relationship
    const { error: accountUserError } = await supabase
      .from("account_users")
      .insert({
        account_id: userId,
        user_id: userId,
        role: "owner",
      });

    if (accountUserError) {
      console.error("Error creating account_user relationship:", accountUserError);
      // Don't fail the request if this fails, as the account was created successfully
    }

    console.log("✅ Account created successfully for user:", userId);
    return NextResponse.json(
      { message: "Account created successfully", account: newAccount },
      { status: 201 }
    );

  } catch (error) {
    console.error("Unexpected error in create-account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 