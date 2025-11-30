import { NextResponse, NextRequest } from "next/server";
import { createServiceRoleClient } from "@/auth/providers/supabase";

// Use service role client to bypass RLS for anonymous review confirmations
const supabase = createServiceRoleClient();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isValidUuid = (value?: string | null): value is string => !!value && UUID_REGEX.test(value);

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { submissionId, customer_confirmed } = body;

    // Validate submissionId
    if (!submissionId || !isValidUuid(submissionId)) {
      return NextResponse.json(
        { error: "Invalid or missing submissionId" },
        { status: 400 }
      );
    }

    // Validate customer_confirmed value
    if (!customer_confirmed || !['confirmed', 'needs_help'].includes(customer_confirmed)) {
      return NextResponse.json(
        { error: "customer_confirmed must be 'confirmed' or 'needs_help'" },
        { status: 400 }
      );
    }

    // Update the review_submissions record
    const { data, error } = await supabase
      .from("review_submissions")
      .update({
        customer_confirmed,
        customer_confirmed_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .select()
      .single();

    if (error) {
      console.error("[track-review/confirm] ERROR: Failed to update review submission:", error);
      return NextResponse.json(
        {
          error: "Failed to update review submission",
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Review submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[track-review/confirm] ERROR:", error);
    return NextResponse.json(
      { error: "Failed to confirm review submission" },
      { status: 500 }
    );
  }
}
