import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAccess } from "@/lib/admin/permissions";

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
 * GET /api/admin/test-article-content?slug=article-slug
 * Test endpoint to see what's actually in the database
 */
export async function GET(request: Request) {
  try {
    await requireAdminAccess();
    const supabase = getSupabaseAdmin();

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug") || "prompt-pages/features/emoji-sentiment";

    const { data: article, error } = await supabase
      .from("articles")
      .select("slug, title, content, status")
      .eq("slug", slug)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      slug: article.slug,
      title: article.title,
      status: article.status,
      contentLength: article.content?.length || 0,
      contentPreview: article.content?.substring(0, 500) || null,
      hasPlaceholder: article.content?.includes("Content migrated from static page") || false,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
