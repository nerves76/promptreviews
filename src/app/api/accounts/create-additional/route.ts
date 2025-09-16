import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Helper: JSON error response
function errorJson(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorJson("Unauthorized", 401);
    }

    const token = authHeader.substring(7);

    // Verify user from token using anon client
    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: authData, error: authError } = await anon.auth.getUser(token);
    if (authError || !authData?.user) {
      return errorJson("Invalid or expired session", 401);
    }
    const user = authData.user;

    // Read payload
    const { firstName, lastName, email, businessName } = await req.json();

    // Basic validation (email can default to user's email)
    const safeEmail = (email || user.email || "").toString();
    if (!safeEmail) {
      return errorJson("Missing email");
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return errorJson("Missing Supabase configuration", 500);
    }

    // Use service role for PostgREST writes
    const headers: HeadersInit = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation", // return inserted row so we can read id
    };

    // Generate a new account ID (assumes accounts.id is a UUID independent of auth.users)
    const newAccountId = crypto.randomUUID();

    // Insert into accounts
    const accountPayload: Record<string, any> = {
      id: newAccountId,
      plan: "no_plan",
      trial_start: new Date().toISOString(),
      trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      is_free_account: false,
      custom_prompt_page_count: 0,
      contact_count: 0,
      created_at: new Date().toISOString(),
      first_name: (firstName || "").toString(),
      last_name: (lastName || "").toString(),
      email: safeEmail,
      review_notifications_enabled: true,
    };

    // Optional field: business_name (if the column exists in DB it will be stored)
    if (businessName) {
      accountPayload["business_name"] = businessName.toString();
    }

    const createAccountRes = await fetch(`${supabaseUrl}/rest/v1/accounts`, {
      method: "POST",
      headers,
      body: JSON.stringify(accountPayload),
    });

    if (!createAccountRes.ok) {
      const errText = await createAccountRes.text();
      // 409 indicates conflict; surface a clearer message
      if (createAccountRes.status === 409) {
        return errorJson("Account already exists with this ID", 409);
      }
      console.error("[create-additional] Account insert failed:", createAccountRes.status, errText);
      return errorJson("Failed to create account", 500);
    }

    // Link user to the new account as owner
    const accountUserPayload = {
      account_id: newAccountId,
      user_id: user.id,
      role: "owner",
      created_at: new Date().toISOString(),
    };

    const createAccountUserRes = await fetch(`${supabaseUrl}/rest/v1/account_users`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify(accountUserPayload),
    });

    if (!createAccountUserRes.ok) {
      const errText = await createAccountUserRes.text();
      if (createAccountUserRes.status !== 409) {
        console.error("[create-additional] account_users insert failed:", createAccountUserRes.status, errText);
        return errorJson("Failed to link user to account", 500);
      }
    }

    return NextResponse.json({ success: true, accountId: newAccountId });
  } catch (err: any) {
    console.error("[POST /api/accounts/create-additional] Unexpected error:", err);
    return errorJson(err?.message || "Internal server error", 500);
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

