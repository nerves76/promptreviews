import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/auth/providers/supabase";
import { getRequestAccountId } from "@/app/(app)/api/utils/getRequestAccountId";

export const dynamic = "force-dynamic";

/**
 * GET /api/campaign-actions
 * Fetch actions for a prompt page campaign
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get account ID respecting account switcher
    const accountId = await getRequestAccountId(request, user.id, supabase);

    if (!accountId) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const promptPageId = searchParams.get("prompt_page_id");

    if (!promptPageId) {
      return NextResponse.json(
        { error: "prompt_page_id is required" },
        { status: 400 }
      );
    }

    // Fetch actions filtered by account
    const { data: activities, error } = await supabase
      .from("campaign_actions")
      .select("*")
      .eq("prompt_page_id", promptPageId)
      .eq("account_id", accountId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching campaign actions:", error);
      return NextResponse.json(
        { error: "Failed to fetch campaign actions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ activities });
  } catch (error: any) {
    console.error("Error in GET /api/campaign-actions:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/campaign-actions
 * Create a new campaign action
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { promptPageId, contactId, accountId, activityType, content, metadata } = body;

    // Validate required fields
    if (!promptPageId || !accountId || !content) {
      return NextResponse.json(
        { error: "promptPageId, accountId, and content are required" },
        { status: 400 }
      );
    }

    // Verify user has access to this account
    const { data: accountUser, error: accessError } = await supabase
      .from("account_users")
      .select("id")
      .eq("account_id", accountId)
      .eq("user_id", user.id)
      .single();

    if (accessError || !accountUser) {
      return NextResponse.json(
        { error: "Unauthorized - You don't have access to this account" },
        { status: 403 }
      );
    }

    // Parse @mentions from content
    const mentions = content.match(/@(\w+)/g) || [];
    const parsedMetadata = {
      ...metadata,
      mentions: mentions.map((m: string) => m.substring(1)), // Remove @ symbol
    };

    // Create campaign action
    const { data: activity, error } = await supabase
      .from("campaign_actions")
      .insert({
        prompt_page_id: promptPageId,
        contact_id: contactId,
        account_id: accountId,
        activity_type: activityType || "note",
        content,
        metadata: parsedMetadata,
        created_by: user.id,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error creating campaign action:", error);
      return NextResponse.json(
        { error: "Failed to create campaign action" },
        { status: 500 }
      );
    }

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/campaign-actions:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/campaign-actions
 * Update an existing campaign action
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, content, metadata } = body;

    if (!id || !content) {
      return NextResponse.json(
        { error: "id and content are required" },
        { status: 400 }
      );
    }

    // Parse @mentions from content
    const mentions = content.match(/@(\w+)/g) || [];
    const parsedMetadata = {
      ...metadata,
      mentions: mentions.map((m: string) => m.substring(1)),
    };

    // Update campaign action (RLS ensures user can only update their own)
    const { data: activity, error } = await supabase
      .from("campaign_actions")
      .update({
        content,
        metadata: parsedMetadata,
      })
      .eq("id", id)
      .eq("created_by", user.id) // Extra safety check
      .select("*")
      .single();

    if (error) {
      console.error("Error updating campaign action:", error);
      return NextResponse.json(
        { error: "Failed to update campaign action" },
        { status: 500 }
      );
    }

    return NextResponse.json({ activity });
  } catch (error: any) {
    console.error("Error in PATCH /api/campaign-actions:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/campaign-actions
 * Delete a campaign action
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    // Delete campaign action (RLS ensures user can only delete their own)
    const { error } = await supabase
      .from("campaign_actions")
      .delete()
      .eq("id", id)
      .eq("created_by", user.id); // Extra safety check

    if (error) {
      console.error("Error deleting campaign action:", error);
      return NextResponse.json(
        { error: "Failed to delete campaign action" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in DELETE /api/campaign-actions:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
