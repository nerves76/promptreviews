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
 * GET /api/admin/help-content/[...slug]/contexts
 * Get all featured routes (contexts) for an article
 * Supports multi-segment slugs like 'google-business/scheduling'
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string | string[] } }
) {
  try {
    const supabase = getSupabaseAdmin();
    // Handle both single and multi-segment slugs
    const slug = Array.isArray(params.slug) ? params.slug.join('/') : params.slug;

    // Get article ID from slug
    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("id")
      .eq("slug", slug)
      .single();

    if (articleError || !article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    // Get all contexts for this article
    const { data: contexts, error: contextsError } = await supabase
      .from("article_contexts")
      .select("*")
      .eq("article_id", article.id)
      .order("priority", { ascending: false });

    if (contextsError) {
      console.error("Error fetching contexts:", contextsError);
      return NextResponse.json(
        { error: "Failed to fetch article contexts" },
        { status: 500 }
      );
    }

    return NextResponse.json({ contexts: contexts || [] });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/help-content/[slug]/contexts
 * Add a new featured route for an article
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string | string[] } }
) {
  try {
    const supabase = getSupabaseAdmin();
    // Handle both single and multi-segment slugs
    const slug = Array.isArray(params.slug) ? params.slug.join('/') : params.slug;
    const body = await request.json();
    const { route_pattern, priority, keywords } = body;

    if (!route_pattern) {
      return NextResponse.json(
        { error: "route_pattern is required" },
        { status: 400 }
      );
    }

    // Get article ID from slug
    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("id")
      .eq("slug", slug)
      .single();

    if (articleError || !article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    // Check if this route already exists for this article
    const { data: existing } = await supabase
      .from("article_contexts")
      .select("id")
      .eq("article_id", article.id)
      .eq("route_pattern", route_pattern)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "This article is already featured on this route" },
        { status: 409 }
      );
    }

    // Insert new context
    const { data: context, error: insertError } = await supabase
      .from("article_contexts")
      .insert({
        article_id: article.id,
        route_pattern: route_pattern.trim(),
        priority: priority || 50,
        keywords: keywords || [],
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating context:", insertError);
      return NextResponse.json(
        { error: "Failed to create article context" },
        { status: 500 }
      );
    }

    return NextResponse.json({ context }, { status: 201 });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
