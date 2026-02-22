import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/auth/providers/supabase";
import { isAdmin } from "@/utils/admin";

export const dynamic = "force-dynamic";

// GET - Fetch recent user logins (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const adminCheck = await isAdmin(user.id, supabase);
    if (!adminCheck) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Use service role to bypass RLS
    const supabaseAdmin = createServiceRoleClient();

    const { data: logins, error, count } = await supabaseAdmin
      .from("user_logins")
      .select("*", { count: "exact" })
      .order("login_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching user logins:", error);
      return NextResponse.json({ error: "Failed to fetch logins" }, { status: 500 });
    }

    return NextResponse.json({
      logins: logins || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error in user-logins GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Log a user login (internal use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, email, first_name, last_name, is_new_user, login_type } = body;

    if (!user_id || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get IP and user agent from request
    const ip_address = request.headers.get("x-forwarded-for")?.split(",")[0] ||
                       request.headers.get("x-real-ip") ||
                       "unknown";
    const user_agent = request.headers.get("user-agent") || "unknown";

    // Use service role to bypass RLS
    const supabaseAdmin = createServiceRoleClient();

    const { error } = await supabaseAdmin
      .from("user_logins")
      .insert({
        user_id,
        email,
        first_name: first_name || null,
        last_name: last_name || null,
        is_new_user: is_new_user || false,
        login_type: login_type || "email",
        ip_address,
        user_agent,
      });

    if (error) {
      console.error("Error logging user login:", error);
      return NextResponse.json({ error: "Failed to log login" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in user-logins POST:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
