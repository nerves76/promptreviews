import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonError("Unauthorized", 401);
    }

    const token = authHeader.substring(7);

    // Verify user from token
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: auth, error: authError } = await supabaseAnon.auth.getUser(token);
    if (authError || !auth?.user) {
      return jsonError("Invalid or expired session", 401);
    }
    const user = auth.user;

    const { firstName, lastName, email, businessName } = await req.json();
    const safeEmail = (email || user.email || "").toString();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return jsonError("Missing Supabase configuration", 500);
    }

    const headers: HeadersInit = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };

    const newAccountId = crypto.randomUUID();

    const accountBody: Record<string, any> = {
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
    if (businessName) accountBody["business_name"] = businessName.toString();

    const createAccountRes = await fetch(`${supabaseUrl}/rest/v1/accounts`, {
      method: "POST",
      headers,
      body: JSON.stringify(accountBody),
    });
    if (!createAccountRes.ok) {
      const text = await createAccountRes.text();
      console.error("[create-additional] account insert failed:", createAccountRes.status, text);
      return jsonError(createAccountRes.status === 409 ? "Account already exists" : "Failed to create account", createAccountRes.status === 409 ? 409 : 500);
    }

    const accountUserBody = {
      account_id: newAccountId,
      user_id: user.id,
      role: "owner",
      created_at: new Date().toISOString(),
    };
    const createAccountUserRes = await fetch(`${supabaseUrl}/rest/v1/account_users`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify(accountUserBody),
    });
    if (!createAccountUserRes.ok && createAccountUserRes.status !== 409) {
      const text = await createAccountUserRes.text();
      console.error("[create-additional] account_users insert failed:", createAccountUserRes.status, text);
      return jsonError("Failed to link user to account", 500);
    }

    return NextResponse.json({ success: true, accountId: newAccountId });
  } catch (err: any) {
    console.error("[POST /api/accounts/create-additional] error:", err);
    return jsonError(err?.message || "Internal server error", 500);
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

