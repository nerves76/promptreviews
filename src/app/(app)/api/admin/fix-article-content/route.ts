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
 * Extract markdown content by fetching from the live docs site
 */
async function extractPageMarkdown(pagePath: string) {
  try {
    // Fetch the raw page.tsx from GitHub
    const githubUrl = `https://raw.githubusercontent.com/nerves76/promptreviews/main/docs-promptreviews/docs-site/src/app/${pagePath}/page.tsx`;

    const response = await fetch(githubUrl);
    if (!response.ok) {
      return null;
    }

    const content = await response.text();

    // Try to find MarkdownRenderer content prop
    const markdownMatch = content.match(/content=\{`([\s\S]*?)`\}/);
    if (markdownMatch) {
      return markdownMatch[1].trim();
    }

    return null;
  } catch (error) {
    console.error(`Error fetching page for ${pagePath}:`, error);
    return null;
  }
}

/**
 * GET /api/admin/fix-article-content
 * Fixes all articles with placeholder content by extracting real markdown
 */
export async function GET() {
  try {
    await requireAdminAccess();
    const supabase = getSupabaseAdmin();

    const results = {
      updated: 0,
      skipped: 0,
      failed: 0,
      details: [] as any[],
    };

    // Fetch all articles
    const { data: articles, error: fetchError } = await supabase
      .from("articles")
      .select("slug, title, content")
      .order("slug", { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch articles: ${fetchError.message}`);
    }

    for (const article of articles) {
      const detail: any = { slug: article.slug };

      // Extract content from page.tsx
      const markdown = await extractPageMarkdown(article.slug);

      if (!markdown) {
        detail.status = "skipped";
        detail.reason = "No content found in page.tsx";
        results.skipped++;
      } else {
        // Update the article
        const { error: updateError } = await supabase
          .from("articles")
          .update({ content: markdown })
          .eq("slug", article.slug);

        if (updateError) {
          detail.status = "failed";
          detail.error = updateError.message;
          results.failed++;
        } else {
          detail.status = "updated";
          detail.contentLength = markdown.length;
          results.updated++;
        }
      }

      results.details.push(detail);
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: articles.length,
        updated: results.updated,
        skipped: results.skipped,
        failed: results.failed,
      },
      details: results.details,
    });
  } catch (error: any) {
    console.error("Error fixing article content:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
