import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/auth/providers/supabase";
import { getRequestAccountId } from "@/app/(app)/api/utils/getRequestAccountId";

/**
 * GET /api/sidebar/favorites
 * Fetch all pinned favorites for the current account
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { error: "No valid account found" },
        { status: 403 }
      );
    }

    const { data: favorites, error } = await supabase
      .from("sidebar_favorites")
      .select("*")
      .eq("account_id", accountId)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("[sidebar/favorites] Error fetching favorites:", error);
      return NextResponse.json(
        { error: "Failed to fetch favorites" },
        { status: 500 }
      );
    }

    return NextResponse.json({ favorites: favorites || [] });
  } catch (error) {
    console.error("[sidebar/favorites] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sidebar/favorites
 * Add a new pinned favorite
 * Body: { nav_item_path: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { error: "No valid account found" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { nav_item_path } = body;

    if (!nav_item_path || typeof nav_item_path !== "string") {
      return NextResponse.json(
        { error: "nav_item_path is required" },
        { status: 400 }
      );
    }

    // Get the current max display_order for this account
    const { data: existingFavorites } = await supabase
      .from("sidebar_favorites")
      .select("display_order")
      .eq("account_id", accountId)
      .order("display_order", { ascending: false })
      .limit(1);

    const nextOrder =
      existingFavorites && existingFavorites.length > 0
        ? existingFavorites[0].display_order + 1
        : 0;

    // Insert the new favorite
    const { data: favorite, error } = await supabase
      .from("sidebar_favorites")
      .insert({
        account_id: accountId,
        nav_item_path,
        display_order: nextOrder,
      })
      .select()
      .single();

    if (error) {
      // Handle duplicate constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "This item is already in favorites" },
          { status: 409 }
        );
      }
      console.error("[sidebar/favorites] Error adding favorite:", error);
      return NextResponse.json(
        { error: "Failed to add favorite" },
        { status: 500 }
      );
    }

    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error) {
    console.error("[sidebar/favorites] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sidebar/favorites
 * Remove a pinned favorite
 * Body: { nav_item_path: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { error: "No valid account found" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { nav_item_path } = body;

    if (!nav_item_path || typeof nav_item_path !== "string") {
      return NextResponse.json(
        { error: "nav_item_path is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("sidebar_favorites")
      .delete()
      .eq("account_id", accountId)
      .eq("nav_item_path", nav_item_path);

    if (error) {
      console.error("[sidebar/favorites] Error removing favorite:", error);
      return NextResponse.json(
        { error: "Failed to remove favorite" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[sidebar/favorites] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/sidebar/favorites
 * Reorder favorites
 * Body: { favorites: Array<{ nav_item_path: string, display_order: number }> }
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { error: "No valid account found" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { favorites } = body;

    if (!Array.isArray(favorites)) {
      return NextResponse.json(
        { error: "favorites array is required" },
        { status: 400 }
      );
    }

    // Update each favorite's display_order
    const updates = favorites.map(
      (fav: { nav_item_path: string; display_order: number }) =>
        supabase
          .from("sidebar_favorites")
          .update({ display_order: fav.display_order, updated_at: new Date().toISOString() })
          .eq("account_id", accountId)
          .eq("nav_item_path", fav.nav_item_path)
    );

    const results = await Promise.all(updates);
    const hasError = results.some((r) => r.error);

    if (hasError) {
      console.error("[sidebar/favorites] Error reordering favorites");
      return NextResponse.json(
        { error: "Failed to reorder favorites" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[sidebar/favorites] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
