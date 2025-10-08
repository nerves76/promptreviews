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

// Hardcoded FAQ data from docs-site/src/app/utils/faqData.ts
// This will be migrated to the database
const FAQ_DATA_URL = 'https://raw.githubusercontent.com/nerves76/promptreviews/main/docs-promptreviews/docs-site/src/app/utils/faqData.ts';

/**
 * GET /api/admin/migrate-faqs
 * Migrates hardcoded FAQs from faqData.ts to the CMS database
 */
export async function GET() {
  try {
    await requireAdminAccess();
    const supabase = getSupabaseAdmin();

    const results = {
      inserted: 0,
      skipped: 0,
      failed: 0,
      details: [] as any[],
    };

    // Fetch the faqData.ts file from GitHub
    const response = await fetch(FAQ_DATA_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch faqData.ts from GitHub');
    }

    const fileContent = await response.text();

    // Extract pageFAQs object using regex
    const pageFAQsMatch = fileContent.match(/export const pageFAQs = \{([\s\S]*?)\n\};/);
    if (!pageFAQsMatch) {
      throw new Error('Could not find pageFAQs export in faqData.ts');
    }

    // Parse the FAQ data manually (since it's TypeScript, we can't just eval it)
    // Extract each page's FAQs
    const pageMatches = fileContent.matchAll(/'([^']+)':\s*\[([\s\S]*?)\],?\n\n/g);

    for (const match of pageMatches) {
      const slug = match[1];
      const faqsBlock = match[2];

      const detail: any = { slug, faqs: [] };

      // Get article from database
      const { data: article, error: articleError } = await supabase
        .from('articles')
        .select('id, title')
        .eq('slug', slug)
        .single();

      if (articleError || !article) {
        detail.status = 'skipped';
        detail.reason = `Article not found for slug '${slug}'`;
        results.skipped++;
        results.details.push(detail);
        continue;
      }

      detail.article_title = article.title;

      // Extract individual FAQs from the block
      const faqMatches = faqsBlock.matchAll(/\{\s*question:\s*'([^']+)',\s*answer:\s*'([^']+)',?[\s\S]*?\}/g);

      let order = 1;
      for (const faqMatch of faqMatches) {
        const question = faqMatch[1].replace(/\\'/g, "'");
        const answer = faqMatch[2].replace(/\\'/g, "'");

        try {
          const { error: insertError } = await supabase
            .from('faqs')
            .insert({
              article_id: article.id,
              question,
              answer,
              display_order: order++,
              status: 'published'
            });

          if (insertError) {
            throw insertError;
          }

          results.inserted++;
          detail.faqs.push({ question: question.substring(0, 60) + '...', status: 'inserted' });
        } catch (error: any) {
          results.failed++;
          detail.faqs.push({ question: question.substring(0, 60) + '...', status: 'failed', error: error.message });
        }
      }

      detail.status = 'processed';
      detail.count = detail.faqs.length;
      results.details.push(detail);

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return NextResponse.json({
      success: true,
      summary: {
        inserted: results.inserted,
        skipped: results.skipped,
        failed: results.failed,
      },
      details: results.details,
    });
  } catch (error: any) {
    console.error('Error migrating FAQs:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
