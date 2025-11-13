import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/auth/providers/supabase";
import { getRequestAccountId } from "@/app/(app)/api/utils/getRequestAccountId";

const DEFAULT_LABELS = {
  draft: "Draft",
  in_queue: "In Queue",
  sent: "Sent",
  follow_up: "Follow Up",
  complete: "Complete",
};

const MAX_LABEL_LENGTH = 20;

/**
 * GET /api/account/status-labels
 * Fetch custom status labels for the current account
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get account ID respecting account switcher
    const accountId = await getRequestAccountId(request, user.id, supabase);

    if (!accountId) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Fetch account with status labels
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .select("prompt_page_status_labels")
      .eq("id", accountId)
      .single();

    if (accountError) {
      return NextResponse.json(
        { error: "Failed to fetch status labels" },
        { status: 500 }
      );
    }

    // Return labels or defaults
    const labels = account?.prompt_page_status_labels || DEFAULT_LABELS;

    return NextResponse.json({ labels });
  } catch (error) {
    console.error("Error fetching status labels:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/account/status-labels
 * Update custom status labels for the current account
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get account ID respecting account switcher
    const accountId = await getRequestAccountId(request, user.id, supabase);

    if (!accountId) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { labels } = body;

    // Validate labels
    if (!labels || typeof labels !== "object") {
      return NextResponse.json(
        { error: "Invalid labels format" },
        { status: 400 }
      );
    }

    // Validate required keys
    const requiredKeys = ["draft", "in_queue", "sent", "follow_up", "complete"];
    for (const key of requiredKeys) {
      if (!labels[key]) {
        return NextResponse.json(
          { error: `Missing label for status: ${key}` },
          { status: 400 }
        );
      }

      // Validate label length
      if (typeof labels[key] !== "string" || labels[key].trim().length === 0) {
        return NextResponse.json(
          { error: `Label for ${key} must be a non-empty string` },
          { status: 400 }
        );
      }

      if (labels[key].length > MAX_LABEL_LENGTH) {
        return NextResponse.json(
          { error: `Label for ${key} exceeds maximum length of ${MAX_LABEL_LENGTH} characters` },
          { status: 400 }
        );
      }
    }

    // Update account with new labels
    const { error: updateError } = await supabase
      .from("accounts")
      .update({ prompt_page_status_labels: labels })
      .eq("id", accountId);

    if (updateError) {
      console.error("Error updating status labels:", updateError);
      return NextResponse.json(
        { error: "Failed to update status labels" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, labels });
  } catch (error) {
    console.error("Error updating status labels:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
