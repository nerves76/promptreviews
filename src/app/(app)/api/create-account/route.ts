/**
 * Create Account API Route
 * 
 * This endpoint creates accounts and account_users records for new users
 * using the service key to avoid JWT signature issues with local Supabase
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId, email, first_name, last_name } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Missing Supabase configuration" },
        { status: 500 }
      );
    }

    // Use the service key to bypass RLS and avoid JWT signature issues
    const headers = {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    };


    // Create new account with only the fields that exist in the accounts table
    const accountData = {
      id: userId,
              plan: 'no_plan', // Use 'no_plan' as the default for new users (matches DB default)
      trial_start: new Date().toISOString(),
      trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
      is_free_account: false,
      custom_prompt_page_count: 0,
      contact_count: 0,
      created_at: new Date().toISOString(),
      // Include user information fields that exist in the table
      first_name: first_name || email.split('@')[0], // Use provided first_name or email prefix as fallback
      last_name: last_name || '', // Use provided last_name or empty string as fallback
      email: email,
      review_notifications_enabled: true
    };

    const createAccountResponse = await fetch(`${supabaseUrl}/rest/v1/accounts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(accountData)
    });

    if (!createAccountResponse.ok) {
      const errorText = await createAccountResponse.text();
      console.error('CREATE-ACCOUNT: Error creating account:', {
        status: createAccountResponse.status,
        statusText: createAccountResponse.statusText,
        error: errorText
      });
      
      // If it's a duplicate key error, that's okay - account already exists
      if (createAccountResponse.status === 409) {
        return NextResponse.json({ 
          success: true, 
          message: "Account already exists",
          accountId: userId,
          userId
        });
      }
      
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    // Create account_users record
    const accountUserData = {
      account_id: userId,
      user_id: userId,
      role: 'owner',
      created_at: new Date().toISOString()
    };

    const createAccountUserResponse = await fetch(`${supabaseUrl}/rest/v1/account_users`, {
      method: 'POST',
      headers,
      body: JSON.stringify(accountUserData)
    });

    if (!createAccountUserResponse.ok) {
      const errorText = await createAccountUserResponse.text();
      console.error('CREATE-ACCOUNT: Error creating account_users record:', {
        status: createAccountUserResponse.status,
        statusText: createAccountUserResponse.statusText,
        error: errorText
      });
      
      // If it's a duplicate key error, that's okay - record already exists
      if (createAccountUserResponse.status === 409) {
        return NextResponse.json({ 
          success: true, 
          message: "Account and user record already exist",
          accountId: userId,
          userId
        });
      }
      
      return NextResponse.json(
        { error: "Failed to create account_users record" },
        { status: 500 }
      );
    }
    return NextResponse.json({ 
      success: true, 
      message: "Account created successfully",
      accountId: userId,
      userId
    });

  } catch (error) {
    console.error('CREATE-ACCOUNT: Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 