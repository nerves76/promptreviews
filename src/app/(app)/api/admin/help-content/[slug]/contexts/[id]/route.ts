import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * PUT /api/admin/help-content/[slug]/contexts/[id]
 * Update a featured route's priority or keywords
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const { priority, keywords, route_pattern } = body;

    // Get article ID from slug to verify ownership
    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("id")
      .eq("slug", params.slug)
      .single();

    if (articleError || !article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    // Verify context belongs to this article
    const { data: existingContext } = await supabase
      .from("article_contexts")
      .select("article_id")
      .eq("id", params.id)
      .single();

    if (!existingContext || existingContext.article_id !== article.id) {
      return NextResponse.json(
        { error: "Context not found or does not belong to this article" },
        { status: 404 }
      );
    }

    // Build update object
    const updates: any = {};
    if (priority !== undefined) updates.priority = priority;
    if (keywords !== undefined) updates.keywords = keywords;
    if (route_pattern !== undefined) updates.route_pattern = route_pattern;

    // Update context
    const { data: context, error: updateError } = await supabase
      .from("article_contexts")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating context:", updateError);
      return NextResponse.json(
        { error: "Failed to update article context" },
        { status: 500 }
      );
    }

    return NextResponse.json({ context });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/help-content/[slug]/contexts/[id]
 * Remove a featured route from an article
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const supabase = getSupabaseAdmin();

    // Get article ID from slug to verify ownership
    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("id")
      .eq("slug", params.slug)
      .single();

    if (articleError || !article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    // Verify context belongs to this article
    const { data: existingContext } = await supabase
      .from("article_contexts")
      .select("article_id")
      .eq("id", params.id)
      .single();

    if (!existingContext || existingContext.article_id !== article.id) {
      return NextResponse.json(
        { error: "Context not found or does not belong to this article" },
        { status: 404 }
      );
    }

    // Delete context
    const { error: deleteError } = await supabase
      .from("article_contexts")
      .delete()
      .eq("id", params.id);

    if (deleteError) {
      console.error("Error deleting context:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete article context" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
