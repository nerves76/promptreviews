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
 * GET /api/admin/check-article-metadata
 * Check which articles have empty metadata sections
 */
export async function GET() {
  try {
    await requireAdminAccess();
    const supabase = getSupabaseAdmin();

    const { data: articles, error } = await supabase
      .from('articles')
      .select('slug, title, status, metadata')
      .eq('status', 'published')
      .order('slug');

    if (error) {
      throw error;
    }

    const analysis = articles?.map(article => {
      const metadata = article.metadata || {};

      const hasKeyFeatures = Array.isArray(metadata.key_features) &&
        metadata.key_features.length > 0 &&
        metadata.key_features.some((f: any) => f.title && f.description);

      const hasHowItWorks = Array.isArray(metadata.how_it_works) &&
        metadata.how_it_works.length > 0 &&
        metadata.how_it_works.some((s: any) => s.title && s.description);

      const hasBestPractices = Array.isArray(metadata.best_practices) &&
        metadata.best_practices.length > 0 &&
        metadata.best_practices.some((p: any) => p.title && p.description);

      return {
        slug: article.slug,
        title: article.title,
        hasKeyFeatures,
        hasHowItWorks,
        hasBestPractices,
        isEmpty: !hasKeyFeatures && !hasHowItWorks && !hasBestPractices
      };
    }) || [];

    const summary = {
      total: analysis.length,
      withKeyFeatures: analysis.filter(a => a.hasKeyFeatures).length,
      withHowItWorks: analysis.filter(a => a.hasHowItWorks).length,
      withBestPractices: analysis.filter(a => a.hasBestPractices).length,
      completelyEmpty: analysis.filter(a => a.isEmpty).length,
    };

    const emptyArticles = analysis.filter(a => a.isEmpty);

    return NextResponse.json({
      summary,
      emptyArticles,
      allArticles: analysis,
    });
  } catch (error: any) {
    console.error('Error checking article metadata:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
