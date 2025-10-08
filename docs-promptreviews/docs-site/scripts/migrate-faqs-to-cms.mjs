#!/usr/bin/env node

/**
 * Script to migrate hardcoded FAQs from faqData.ts to the CMS database
 *
 * This extracts FAQs from the hardcoded pageFAQs object and inserts them
 * into the faqs table with proper article associations.
 *
 * Usage: SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/migrate-faqs-to-cms.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { pageFAQs } from '../src/app/utils/faqData.js';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ltneloufqjktdplodvao.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('Usage: SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/migrate-faqs-to-cms.mjs');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting FAQ migration to CMS...\n');

  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (const [slug, faqs] of Object.entries(pageFAQs)) {
    console.log(`\nProcessing FAQs for: ${slug}`);

    // Get article ID from slug
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id, title')
      .eq('slug', slug)
      .single();

    if (articleError || !article) {
      console.log(`  ⚠️  Article not found for slug '${slug}', skipping ${faqs.length} FAQs`);
      skipped += faqs.length;
      continue;
    }

    console.log(`  ✓ Found article: ${article.title}`);

    // Insert each FAQ
    for (let i = 0; i < faqs.length; i++) {
      const faq = faqs[i];

      try {
        const { error: insertError } = await supabase
          .from('faqs')
          .insert({
            article_id: article.id,
            question: faq.question,
            answer: faq.answer,
            category: article.title || slug,
            order_index: i + 1,
            plans: faq.plans || ['grower', 'builder', 'maven']
          });

        if (insertError) {
          throw insertError;
        }

        inserted++;
        console.log(`    ✅ Inserted: "${faq.question.substring(0, 60)}..."`);
      } catch (error) {
        failed++;
        console.error(`    ❌ Failed: "${faq.question.substring(0, 60)}..." - ${error.message}`);
      }

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log(`  ✅ Inserted: ${inserted} FAQs`);
  console.log(`  ⚠️  Skipped: ${skipped} FAQs (no matching article)`);
  console.log(`  ❌ Failed: ${failed} FAQs`);
  console.log('='.repeat(50));
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
