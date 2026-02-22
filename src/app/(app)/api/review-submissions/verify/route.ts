import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/auth/providers/supabase";
import { getRequestAccountId } from "@/app/(app)/api/utils/getRequestAccountId";
import { errorResponse } from "@/app/(app)/api/utils/errorResponse";

export async function POST(request: NextRequest) {
  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing review id" }, { status: 400 });
  }

  // Authenticate user
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get account ID with proper isolation
  const accountId = await getRequestAccountId(request, user.id, supabase);
  if (!accountId) {
    return NextResponse.json(
      { error: "No valid account found" },
      { status: 403 },
    );
  }

  // Verify the review submission belongs to this account before updating
  const { data: submission, error: fetchError } = await supabase
    .from("review_submissions")
    .select("id")
    .eq("id", id)
    .eq("account_id", accountId)
    .single();

  if (fetchError || !submission) {
    return NextResponse.json(
      { error: "Review submission not found" },
      { status: 404 },
    );
  }

  const { error } = await supabase
    .from("review_submissions")
    .update({ verified: true, verified_at: new Date().toISOString() })
    .eq("id", id)
    .eq("account_id", accountId);

  if (error) {
    console.error("Error verifying review submission:", error.message);
    return errorResponse("Failed to verify review submission", 500, error.message);
  }

  return NextResponse.json({ success: true });
}
