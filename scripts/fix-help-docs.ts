/**
 * Help Documentation Audit - Database Fix Script
 *
 * Fixes all issues identified in the comprehensive help docs audit.
 * Run with: npx tsx scripts/fix-help-docs.ts
 *
 * Uses Supabase service role client to operate on production database.
 *
 * Categories:
 * 1. FAQ fixes (re-create deduplicated+fixed FAQs)
 * 2. Article content fixes (spelling, product name)
 * 3. Article metadata fixes (titles, plans, icons, credits, etc.)
 * 4. Navigation fixes (dead links, missing hrefs)
 * 5. FAQ contexts population
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment - use .env.production for production DB, .env.local for local
// Pass ENV_FILE=.env.production to target production
const envFile = process.env.ENV_FILE || '.env.local';
config({ path: resolve(__dirname, '..', envFile) });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

let totalChanges = 0;

function log(category: string, action: string, detail: string) {
  console.log(`[${category}] ${action}: ${detail}`);
  totalChanges++;
}

// ============================================================
// 1. FAQ FIXES - Recreate correct, deduplicated FAQs
// ============================================================
async function fixFaqs() {
  console.log('\n=== 1. FAQ FIXES ===\n');

  // Check current state
  const { data: existing } = await supabase.from('faqs').select('id');
  console.log(`Current FAQ count: ${existing?.length || 0}`);

  if (existing && existing.length > 0) {
    // Delete all existing FAQs (they were all duplicated/broken)
    // First delete faq_contexts
    await supabase.from('faq_contexts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    // Then delete FAQs
    await supabase.from('faqs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    log('FAQ', 'DELETE ALL', `Removed ${existing.length} existing FAQs (all were duplicated/broken)`);
  }

  // Get article IDs for the article_id references
  const { data: aiArticle } = await supabase.from('articles').select('id').eq('slug', 'ai-reviews').single();
  const { data: analyticsArticle } = await supabase.from('articles').select('id').eq('slug', 'analytics').single();

  const aiArticleId = aiArticle?.id || null;
  const analyticsArticleId = analyticsArticle?.id || null;

  // Recreate the 12 correct, unique FAQs (no duplicates, no API FAQ, fixed answers)
  const correctFaqs = [
    // AI-Assisted Review Collection category (linked to ai-reviews article)
    {
      question: 'How does AI help with review collection?',
      answer: 'Our AI analyzes your business context to create personalized review requests, suggests optimal timing, helps customers write better reviews, and identifies patterns in feedback to improve your strategy.',
      category: 'AI-Assisted Review Collection',
      plans: ['grower', 'builder', 'maven'],
      order_index: 1,
      article_id: aiArticleId,
    },
    {
      question: 'Will AI-generated content sound robotic?',
      answer: "No! Our AI is trained to create natural, conversational content that matches your brand voice. You can always edit AI suggestions to add your personal touch. The goal is to help you be more personal, not less.",
      category: 'AI-Assisted Review Collection',
      plans: ['grower', 'builder', 'maven'],
      order_index: 2,
      article_id: aiArticleId,
    },
    {
      question: 'Can AI write reviews for my customers?',
      answer: "No, we never write fake reviews. Our AI helps customers express their genuine experiences better by suggesting structure and helping them articulate their thoughts, but customers always write their own authentic reviews.",
      category: 'AI-Assisted Review Collection',
      plans: ['grower', 'builder', 'maven'],
      order_index: 3,
      article_id: aiArticleId,
    },
    {
      question: 'How does AI personalization work?',
      answer: 'AI uses information about your business, the specific service or product, and customer context to create personalized messages. For example, it might reference the specific service date or employee who helped them.',
      category: 'AI-Assisted Review Collection',
      plans: ['grower', 'builder', 'maven'],
      order_index: 4,
      article_id: aiArticleId,
    },
    {
      question: 'Can I turn off AI features?',
      answer: 'Yes, AI features are optional. You can use Prompt Reviews with fully manual content creation if you prefer. However, most users find AI saves significant time while improving results.',
      category: 'AI-Assisted Review Collection',
      plans: ['grower', 'builder', 'maven'],
      order_index: 5,
      article_id: aiArticleId,
    },
    {
      question: 'Does AI analyze my review trends?',
      answer: 'Yes, AI analyzes your reviews to identify trends, common praise, and areas for improvement. This helps you understand what customers love and what might need attention.',
      category: 'AI-Assisted Review Collection',
      plans: ['grower', 'builder', 'maven'],
      order_index: 6,
      article_id: aiArticleId,
    },
    // Analytics & Insights Guide category (linked to analytics article)
    {
      question: 'What metrics can I track in Prompt Reviews?',
      answer: 'Track review volume, average ratings, response rates, prompt page conversion rates, platform distribution, sentiment trends, and more. Analytics help you understand what is working and where to focus your review collection efforts.',
      category: 'Analytics & Insights Guide',
      plans: ['grower', 'builder', 'maven'],
      order_index: 1,
      article_id: analyticsArticleId,
    },
    {
      question: 'Can I see which prompt pages perform best?',
      answer: 'Yes! Each prompt page has detailed analytics showing views, clicks, conversion rates, and reviews generated. This helps you identify your most effective pages and replicate their success.',
      category: 'Analytics & Insights Guide',
      plans: ['grower', 'builder', 'maven'],
      order_index: 2,
      article_id: analyticsArticleId,
    },
    {
      question: 'How do I track ROI from review collection?',
      answer: "Track metrics like review volume growth, rating improvements, and conversion rates. Many businesses see increased customer inquiries and sales after improving their review profiles, which you can correlate with your efforts.",
      category: 'Analytics & Insights Guide',
      plans: ['grower', 'builder', 'maven'],
      order_index: 3,
      article_id: analyticsArticleId,
    },
    {
      // FIXED: Was wrong - claimed CSV export exists, it doesn't
      question: 'Can I export analytics reports?',
      answer: 'Analytics export is not currently available. You can view all your analytics data directly in the dashboard. If you need data exported, reach out to support@promptreviews.app.',
      category: 'Analytics & Insights Guide',
      plans: ['grower', 'builder', 'maven'],
      order_index: 4,
      article_id: analyticsArticleId,
    },
    {
      // FIXED: Was truncated
      question: 'Do you provide competitor analysis?',
      answer: "While we don't offer direct competitor review monitoring, you can use our analytics to benchmark your own performance over time. Track your review volume, ratings, and sentiment trends to see how you're improving.",
      category: 'Analytics & Insights Guide',
      plans: ['grower', 'builder', 'maven'],
      order_index: 5,
      article_id: analyticsArticleId,
    },
    {
      question: 'How often are analytics updated?',
      answer: 'Analytics update in real-time for most metrics. Review data from external platforms syncs every few hours to ensure you always have current information.',
      category: 'Analytics & Insights Guide',
      plans: ['grower', 'builder', 'maven'],
      order_index: 6,
      article_id: analyticsArticleId,
    },
    // NOTE: Fabricated API FAQ intentionally excluded
  ];

  const { data: inserted, error } = await supabase.from('faqs').insert(correctFaqs).select('id, question');
  if (error) {
    console.error('Error inserting FAQs:', error);
  } else {
    log('FAQ', 'CREATE', `Inserted ${inserted?.length || 0} corrected, deduplicated FAQs`);
    // Store IDs for faq_contexts later
    if (inserted) {
      for (const faq of inserted) {
        console.log(`  -> ${faq.id}: ${faq.question.substring(0, 50)}...`);
      }
    }
  }

  return inserted || [];
}

// ============================================================
// 2. ARTICLE CONTENT FIXES (Spelling + Product Name)
// ============================================================
async function fixArticleContent() {
  console.log('\n=== 2. ARTICLE CONTENT FIXES ===\n');

  // Helper: fetch article, apply replacements, update
  async function fixContent(slug: string, replacements: [string, string][], description: string) {
    const { data: article } = await supabase
      .from('articles')
      .select('id, content')
      .eq('slug', slug)
      .single();

    if (!article) {
      console.log(`  [SKIP] Article "${slug}" not found`);
      return;
    }
    let content = article.content;
    let changed = false;
    for (const [from, to] of replacements) {
      if (content.includes(from)) {
        content = content.split(from).join(to);
        changed = true;
      }
    }
    if (changed) {
      const { error } = await supabase
        .from('articles')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('slug', slug);
      if (error) console.error(`  [ERROR] ${slug}:`, error.message);
      else log('CONTENT', 'FIX', `${slug}: ${description}`);
    } else {
      console.log(`  [SKIP] ${slug}: text not found for "${description}"`);
    }
  }

  // --- Spelling fixes ---

  await fixContent('business-profile', [
    ['consistant', 'consistent'],
    ['consistancy', 'consistency'],
    ['varios', 'various'],
  ], 'spelling: consistant, consistancy, varios');

  await fixContent('google-biz-optimizer/metrics/monthly-patterns', [
    ['consistant', 'consistent'],
    ['recieve', 'receive'],
    ['seqrch', 'search'],
    ['consistancy', 'consistency'],
  ], 'spelling: consistant, recieve, seqrch, consistancy');

  await fixContent('google-biz-optimizer/metrics/review-trends', [
    ['consistantly', 'consistently'],
    ['consitant', 'consistent'],
  ], 'spelling: consistantly, consitant');

  await fixContent('google-biz-optimizer/metrics/total-reviews', [
    ['recieved', 'received'],
  ], 'spelling: recieved');

  await fixContent('google-biz-optimizer/optimization/categories', [
    ['poweful', 'powerful'],
  ], 'spelling: poweful');

  await fixContent('google-biz-optimizer/optimization/services', [
    ['Sservices', 'Services'],
  ], 'spelling: Sservices');

  await fixContent('google-business/review-import', [
    ['mileadge', 'mileage'],
    ['cuwstomer', 'customer'],
    ['double  dip', 'double dip'],
  ], 'spelling: mileadge, cuwstomer, double  dip');

  await fixContent('google-business/scheduling', [
    ['endevor', 'endeavor'],
  ], 'spelling: endevor');

  await fixContent('keywords/keyword-rotation', [
    ['unatural', 'unnatural'],
  ], 'spelling: unatural');

  await fixContent('keywords/library-overview', [
    ['Somoene', 'Someone'],
    ['inflenced', 'influenced'],
    ['conttractors', 'contractors'],
    ['asphault', 'asphalt'],
  ], 'spelling: Somoene, inflenced, conttractors, asphault');

  await fixContent('widgets', [
    ['incogniteo', 'incognito'],
    ['stobborn', 'stubborn'],
  ], 'spelling: incogniteo, stobborn');

  await fixContent('prompt-pages/features/emoji-sentiment', [
    ['experinece', 'experience'],
    ['nuetral-to-frustrated', 'neutral-to-frustrated'],
    ['opportuinty', 'opportunity'],
  ], 'spelling: experinece, nuetral-to-frustrated, opportuinty');

  await fixContent('getting-started/review-widget', [
    ['ebed code', 'embed code'],
  ], 'spelling: ebed code');

  await fixContent('sharing-reviews', [
    ['4rth', '4th'],
    ['routime', 'routine'],
  ], 'spelling: 4rth, routime');

  await fixContent('getting-started', [
    ['verbatum', 'verbatim'],
  ], 'spelling: verbatum');

  await fixContent('getting-started/account-setup', [
    ['under under', 'under'],
  ], 'spelling: double word "under under"');

  // --- Product name fixes: "PromptReviews" -> "Prompt Reviews" ---
  const productNameSlugs = [
    'ai-reviews',
    'community-tutorial',
    'google-biz-optimizer/metrics/total-reviews',
    'keywords/monitoring-overview',
    'local-ranking-grids/improving-rankings',
    'sentiment-analyzer',
  ];

  for (const slug of productNameSlugs) {
    await fixContent(slug, [
      ['PromptReviews', 'Prompt Reviews'],
    ], 'product name: PromptReviews -> Prompt Reviews');
  }
}

// ============================================================
// 3. ARTICLE METADATA FIXES
// ============================================================
async function fixArticleMetadata() {
  console.log('\n=== 3. ARTICLE METADATA FIXES ===\n');

  // Helper: update metadata JSON
  async function updateMetadata(slug: string, transform: (meta: any) => any | false, description: string) {
    const { data: article } = await supabase
      .from('articles')
      .select('id, metadata')
      .eq('slug', slug)
      .single();

    if (!article) {
      console.log(`  [SKIP] Article "${slug}" not found`);
      return;
    }
    const meta = (article.metadata as any) || {};
    const updated = transform(meta);
    if (updated !== false) {
      const { error } = await supabase
        .from('articles')
        .update({ metadata: updated, updated_at: new Date().toISOString() })
        .eq('slug', slug);
      if (error) console.error(`  [ERROR] ${slug}:`, error.message);
      else log('METADATA', 'FIX', `${slug}: ${description}`);
    } else {
      console.log(`  [NO-OP] ${slug}: ${description}`);
    }
  }

  // 3a. Fix SEO title typo "Prompt Reviws" -> "Prompt Reviews"
  await updateMetadata('google-biz-optimizer/metrics/review-trends', (meta) => {
    if (meta.seo_title && meta.seo_title.includes('Prompt Reviws')) {
      meta.seo_title = meta.seo_title.replace('Prompt Reviws', 'Prompt Reviews');
      return meta;
    }
    return false;
  }, 'SEO title typo: Prompt Reviws -> Prompt Reviews');

  // 3b. Fix ai-reviews: PromptReviews in seo_description + FaMagic icon
  await updateMetadata('ai-reviews', (meta) => {
    let changed = false;
    if (meta.seo_description && meta.seo_description.includes('PromptReviews')) {
      meta.seo_description = meta.seo_description.replace(/PromptReviews/g, 'Prompt Reviews');
      changed = true;
    }
    if (meta.category_icon === 'FaMagic') {
      meta.category_icon = 'FaLightbulb';
      changed = true;
    }
    return changed ? meta : false;
  }, 'seo_description PromptReviews + category_icon FaMagic -> FaLightbulb');

  // 3c. Remove empty FAQ entry from analytics article metadata
  await updateMetadata('analytics', (meta) => {
    if (meta.faqs && Array.isArray(meta.faqs)) {
      const before = meta.faqs.length;
      meta.faqs = meta.faqs.filter((f: any) => f.question && f.question.trim() !== '');
      if (meta.faqs.length < before) return meta;
    }
    return false;
  }, 'remove empty FAQ entry');

  // 3d. Fix analytics key_features to include AI Enhance
  await updateMetadata('analytics', (meta) => {
    if (meta.key_features && Array.isArray(meta.key_features)) {
      const aiFeature = meta.key_features.find((f: any) =>
        f.title && f.title.includes('AI features')
      );
      if (aiFeature && !aiFeature.description.includes('AI Enhance')) {
        aiFeature.description = 'Track how many customers used AI Generate, AI Enhance, and Grammar fix';
        return meta;
      }
    }
    return false;
  }, 'key_features: add AI Enhance to AI features usage');

  // 3e. Remove "enterprise" from keywords/import-concepts available_plans
  await updateMetadata('keywords/import-concepts', (meta) => {
    if (meta.available_plans && Array.isArray(meta.available_plans) && meta.available_plans.includes('enterprise')) {
      meta.available_plans = meta.available_plans.filter((p: string) => p !== 'enterprise');
      return meta;
    }
    return false;
  }, 'remove non-existent "enterprise" plan');

  // 3f. Fix community-tutorial: editing FAQ + PromptReviews in inline FAQs
  await updateMetadata('community-tutorial', (meta) => {
    let changed = false;
    if (meta.faqs && Array.isArray(meta.faqs)) {
      for (const faq of meta.faqs) {
        // Fix editing FAQ
        if (faq.question && faq.question.includes('edit or delete') && faq.answer.includes('editing is not yet available')) {
          faq.answer = 'Yes, you can edit and delete your own posts and comments. Look for the edit (pencil) icon and delete (trash) icon on your posts and comments.';
          changed = true;
        }
        // Fix PromptReviews
        if (faq.answer && faq.answer.includes('PromptReviews')) {
          faq.answer = faq.answer.replace(/PromptReviews/g, 'Prompt Reviews');
          changed = true;
        }
        if (faq.question && faq.question.includes('PromptReviews')) {
          faq.question = faq.question.replace(/PromptReviews/g, 'Prompt Reviews');
          changed = true;
        }
      }
    }
    return changed ? meta : false;
  }, 'fix editing FAQ + PromptReviews in inline FAQs');

  // 3g. Fix widgets: remove empty best_practice entry
  await updateMetadata('widgets', (meta) => {
    if (meta.best_practices && Array.isArray(meta.best_practices)) {
      const before = meta.best_practices.length;
      meta.best_practices = meta.best_practices.filter((bp: any) =>
        bp.title && bp.title.trim() !== ''
      );
      if (meta.best_practices.length < before) return meta;
    }
    return false;
  }, 'remove empty best_practice entry');

  // 3h. Fix strategies/reciprocity: trailing backslash in title
  const { data: reciprocity } = await supabase
    .from('articles')
    .select('id, title, metadata')
    .eq('slug', 'strategies/reciprocity')
    .single();

  if (reciprocity) {
    const updates: any = {};
    if (reciprocity.title.includes('\\')) {
      updates.title = reciprocity.title.replace(/\\+$/, '');
    }
    const meta = (reciprocity.metadata as any) || {};
    if (meta.title && meta.title.includes('\\')) {
      meta.title = meta.title.replace(/\\+$/, '');
      updates.metadata = meta;
    }
    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      await supabase.from('articles').update(updates).eq('slug', 'strategies/reciprocity');
      log('METADATA', 'FIX', 'strategies/reciprocity: trailing backslash in title');
    }
  }

  // 3i. Add missing available_plans to articles
  const planFixSlugs = [
    'google-business',
    'google-biz-optimizer',
    'rss-feeds/finding-feed-urls',
    'style-settings',
    'ai-reviews',
    'faq',
    'help',
    'features',
  ];

  for (const slug of planFixSlugs) {
    await updateMetadata(slug, (meta) => {
      if (!meta.available_plans) {
        meta.available_plans = ['grower', 'builder', 'maven'];
        return meta;
      }
      return false;
    }, 'add missing available_plans');
  }

  // Add plans to all google-biz-optimizer children
  const { data: gboChildren } = await supabase
    .from('articles')
    .select('slug, metadata')
    .like('slug', 'google-biz-optimizer/%')
    .eq('status', 'published');

  if (gboChildren) {
    for (const article of gboChildren) {
      const meta = (article.metadata as any) || {};
      if (!meta.available_plans) {
        meta.available_plans = ['grower', 'builder', 'maven'];
        await supabase.from('articles')
          .update({ metadata: meta, updated_at: new Date().toISOString() })
          .eq('slug', article.slug);
        log('METADATA', 'FIX', `${article.slug}: add missing available_plans`);
      }
    }
  }

  // 3j. Fix credits article content: wrong amounts, geo grid, rank tracking
  const { data: creditsArticle } = await supabase
    .from('articles')
    .select('id, content')
    .eq('slug', 'keywords/credits-explained')
    .single();

  if (creditsArticle) {
    let content = creditsArticle.content;
    let changed = false;

    // Fix credit amounts per plan
    if (content.includes('100 credits')) {
      content = content.replace(/100 credits\/month/g, '500 credits/month');
      content = content.replace(/100 credits per month/g, '500 credits per month');
      changed = true;
    }
    // Fix Builder if still showing 500 (need to handle carefully since Grower is now 500)
    // Look for Builder-specific context
    const builderPattern = /Builder[^.]*?500 credits/g;
    if (builderPattern.test(content)) {
      content = content.replace(/Builder([^.]*?)500 credits/g, 'Builder$11,000 credits');
      changed = true;
    }

    // Fix rank tracking cost
    if (content.includes('1 credit per keyword')) {
      content = content.replace(/1 credit per keyword/g, '2 credits per keyword (desktop + mobile)');
      changed = true;
    }

    // Fix geo grid formula
    if (content.toLowerCase().includes('keywords x grid points') || content.toLowerCase().includes('keywords x')) {
      content = content.replace(/[Kk]eywords?\s*x\s*[Gg]rid\s*[Pp]oints?/g, '1 credit per grid point regardless of keyword count');
      changed = true;
    }
    if (content.includes('5 keywords x 5 points = 25 credits')) {
      content = content.replace('5 keywords x 5 points = 25 credits', '5-point grid = 5 credits (regardless of keyword count)');
      changed = true;
    }

    if (changed) {
      await supabase.from('articles')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('slug', 'keywords/credits-explained');
      log('CONTENT', 'FIX', 'keywords/credits-explained: credit amounts, rank tracking cost, geo grid formula');
    }
  }

  // 3k. Fix rank tracking results article: wrong color coding
  const { data: rankArticle } = await supabase
    .from('articles')
    .select('id, content')
    .eq('slug', 'keywords/reading-rank-results')
    .single();

  if (rankArticle) {
    let content = rankArticle.content;
    let changed = false;

    if (content.includes('light green') || (content.includes('yellow') && content.includes('orange'))) {
      content = content.replace(/\blight green\b/gi, 'blue');
      content = content.replace(/\byellow\b/gi, 'amber');
      content = content.replace(/\borange\b/gi, 'gray');
      // Remove red as 5th ranking color
      content = content.replace(/[,\s]*(?:and\s+)?(?:\bred\b)/gi, '');
      changed = true;
    }

    if (changed) {
      await supabase.from('articles')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('slug', 'keywords/reading-rank-results');
      log('CONTENT', 'FIX', 'keywords/reading-rank-results: color coding green/blue/amber/gray');
    }
  }

  // 3l. Fix research tool daily limits
  const { data: researchArticle } = await supabase
    .from('articles')
    .select('id, content')
    .eq('slug', 'keywords/using-research-tool')
    .single();

  if (researchArticle) {
    let content = researchArticle.content;
    let changed = false;

    // Replace plan-specific limits with flat 50/day
    if (content.includes('25') && content.toLowerCase().includes('grower')) {
      content = content.replace(/Grower[^.\n]*?25[^.\n]*?(per day|\/day)/gi, 'All plans: 50 searches per day');
      changed = true;
    }
    if (content.toLowerCase().includes('unlimited') && content.toLowerCase().includes('maven')) {
      content = content.replace(/Maven[^.\n]*?unlimited[^.\n]*(per day|\/day|searches)?/gi, 'Maven: 50 searches per day');
      changed = true;
    }

    if (changed) {
      await supabase.from('articles')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('slug', 'keywords/using-research-tool');
      log('CONTENT', 'FIX', 'keywords/using-research-tool: flat 50/day for all plans');
    }
  }

  // 3m. Fix grid setup: remove wrong plan restrictions
  const { data: gridArticle } = await supabase
    .from('articles')
    .select('id, content')
    .eq('slug', 'local-ranking-grids/setup')
    .single();

  if (gridArticle) {
    let content = gridArticle.content;
    let changed = false;

    if ((content.includes('Builder') || content.includes('Maven')) && content.includes('9')) {
      content = content.replace(/requires?\s*(the\s+)?(Builder|Maven)\s*(or\s*(the\s+)?(Maven|Builder))?\s*plan/gi, 'available on all plans');
      content = content.replace(/(Builder|Maven)\s*(or\s*(Maven|Builder))?\s*(?:plan\s*)?required/gi, 'available on all plans');
      changed = true;
    }

    if (changed) {
      await supabase.from('articles')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('slug', 'local-ranking-grids/setup');
      log('CONTENT', 'FIX', 'local-ranking-grids/setup: grid sizes available on all plans');
    }
  }

  // 3n. Fix bulk-updates: remove non-existent features
  const { data: bulkArticle } = await supabase
    .from('articles')
    .select('id, content')
    .eq('slug', 'google-business/bulk-updates')
    .single();

  if (bulkArticle) {
    let content = bulkArticle.content;
    let changed = false;

    if (content.includes('save location groups')) {
      content = content.replace(/[^.]*save location groups[^.]*\./gi, '');
      changed = true;
    }
    if (content.includes('filter by region')) {
      content = content.replace(/[^.]*filter by region[^.]*\./gi, '');
      changed = true;
    }
    if (content.includes('filter by brand')) {
      content = content.replace(/[^.]*filter by brand[^.]*\./gi, '');
      changed = true;
    }

    if (changed) {
      await supabase.from('articles')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('slug', 'google-business/bulk-updates');
      log('CONTENT', 'FIX', 'google-business/bulk-updates: remove non-existent features');
    }
  }

  // 3o. Systemic: Convert article titles to sentence case
  console.log('\n--- Sentence case conversion ---\n');
  const { data: allArticles } = await supabase
    .from('articles')
    .select('slug, title, metadata')
    .eq('status', 'published');

  if (!allArticles) return;

  // Words to keep capitalized
  const keepCapitalized = new Set([
    'AI', 'SEO', 'QR', 'RSS', 'CSV', 'Google', 'Yelp', 'Facebook', 'LinkedIn',
    'TripAdvisor', 'Prompt', 'Reviews', 'Prompty', 'GBP',
    'ChatGPT', 'FAQ', 'FAQs', 'URL', 'URLs', 'API', 'LLM', 'PAA', 'SERP',
    'UI', 'ROI', 'NAP',
  ]);

  function toSentenceCase(title: string): string {
    if (!title) return title;

    const parts = title.split(/(\s[-\u2013\u2014]\s|:\s|\s&\s)/);

    return parts.map((part, i) => {
      if (i % 2 === 1) return part;

      const words = part.split(/\s+/);
      return words.map((word, j) => {
        if (j === 0) {
          if (keepCapitalized.has(word)) return word;
          if (word === word.toUpperCase() && word.length <= 4 && word.length > 1) return word;
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        if (keepCapitalized.has(word)) return word;
        if (word === word.toUpperCase() && word.length <= 4 && word.length > 1) return word;
        return word.toLowerCase();
      }).join(' ');
    }).join('');
  }

  let sentenceCaseCount = 0;
  for (const article of allArticles) {
    const newTitle = toSentenceCase(article.title);
    const meta = (article.metadata as any) || {};
    let metaChanged = false;

    if (meta.title) {
      const newMetaTitle = toSentenceCase(meta.title);
      if (newMetaTitle !== meta.title) {
        meta.title = newMetaTitle;
        metaChanged = true;
      }
    }

    if (newTitle !== article.title || metaChanged) {
      const updateData: any = { updated_at: new Date().toISOString() };
      if (newTitle !== article.title) updateData.title = newTitle;
      if (metaChanged) updateData.metadata = meta;

      await supabase.from('articles').update(updateData).eq('slug', article.slug);
      sentenceCaseCount++;
    }
  }
  if (sentenceCaseCount > 0) {
    log('METADATA', 'SENTENCE CASE', `Converted ${sentenceCaseCount} article titles`);
  }
}

// ============================================================
// 4. NAVIGATION FIXES
// ============================================================
async function fixNavigation() {
  console.log('\n=== 4. NAVIGATION FIXES ===\n');

  // 4a. Deactivate dead nav links
  const deadNavIds = [
    '5913a6b4-57ed-4d29-aa3e-43b7e4b94e46', // SEO Score Factors
    'b6dd105d-08fb-4c8d-8df9-145daae9e507', // Quick Wins
    'd79ccc6f-5d49-407d-9f33-26f52fe8fc7c', // Review Response Templates
    '0b5145b5-d7c3-4b37-8eea-5b03b0bc9be3', // Q&A Management
    'a653a589-ab6c-4888-a1f2-3bcec93fdf8a', // Google Posts Strategy
    'd936d622-b3cd-4131-858d-3c1a3589f142', // Customer Actions Analysis
    '6aa02df9-b4f1-442c-9d96-b8d6c12eedaa', // Metrics (prompt-pages/features/analytics)
  ];

  for (const id of deadNavIds) {
    const { error } = await supabase
      .from('navigation')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) console.log(`  [SKIP] Nav ${id}: ${error.message}`);
    else log('NAV', 'DEACTIVATE', `dead link ${id}`);
  }

  // 4b. Fix "Tracking & visibility" null href
  {
    const { error } = await supabase
      .from('navigation')
      .update({ href: '/keywords/rank-tracking-overview', updated_at: new Date().toISOString() })
      .eq('id', '649fa9c8-5214-4ab1-9e7d-9652f6810127');
    if (error) console.log(`  [SKIP] Tracking & visibility: ${error.message}`);
    else log('NAV', 'FIX href', 'Tracking & visibility: null -> /keywords/rank-tracking-overview');
  }

  // 4c. Fix Keywords href: /keywords -> /keywords/library-overview
  {
    const { error } = await supabase
      .from('navigation')
      .update({ href: '/keywords/library-overview', updated_at: new Date().toISOString() })
      .eq('id', '521ed0aa-91fc-42a3-a4dc-8ec0a6352f96');
    if (error) console.log(`  [SKIP] Keywords: ${error.message}`);
    else log('NAV', 'FIX href', 'Keywords: /keywords -> /keywords/library-overview');
  }

  // 4d. Deactivate duplicate Widgets child
  {
    const { error } = await supabase
      .from('navigation')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', 'ffcbf6f0-ed05-4c46-be2f-e106e05f8dc8');
    if (error) console.log(`  [SKIP] Widgets duplicate: ${error.message}`);
    else log('NAV', 'DEACTIVATE', 'duplicate Widgets child (ffcbf6f0)');
  }
}

// ============================================================
// 5. FAQ CONTEXTS POPULATION
// ============================================================
async function populateFaqContexts(createdFaqs: { id: string; question: string }[]) {
  console.log('\n=== 5. FAQ CONTEXTS POPULATION ===\n');

  if (!createdFaqs || createdFaqs.length === 0) {
    // Fetch from DB
    const { data } = await supabase.from('faqs').select('id, question');
    if (!data || data.length === 0) {
      console.log('  [SKIP] No FAQs found to create contexts for');
      return;
    }
    createdFaqs = data;
  }

  // Build a question->id map
  const faqMap = new Map<string, string>();
  for (const faq of createdFaqs) {
    faqMap.set(faq.question, faq.id);
  }

  // Define route mappings
  const contextEntries: { faq_question: string; route_pattern: string; keywords: string[]; priority: number }[] = [
    // "How does AI help with review collection?"
    { faq_question: 'How does AI help with review collection?', route_pattern: '/dashboard/create-prompt-page', keywords: ['ai', 'reviews', 'collection'], priority: 80 },
    { faq_question: 'How does AI help with review collection?', route_pattern: '/dashboard/edit-prompt-page', keywords: ['ai', 'reviews', 'collection'], priority: 70 },
    { faq_question: 'How does AI help with review collection?', route_pattern: '/dashboard/reviews', keywords: ['ai', 'reviews'], priority: 60 },

    // "Will AI-generated content sound robotic?"
    { faq_question: 'Will AI-generated content sound robotic?', route_pattern: '/dashboard/create-prompt-page', keywords: ['ai', 'content', 'tone'], priority: 70 },
    { faq_question: 'Will AI-generated content sound robotic?', route_pattern: '/dashboard/edit-prompt-page', keywords: ['ai', 'content', 'tone'], priority: 70 },

    // "Can AI write reviews for my customers?"
    { faq_question: 'Can AI write reviews for my customers?', route_pattern: '/dashboard/create-prompt-page', keywords: ['ai', 'reviews', 'authentic'], priority: 80 },
    { faq_question: 'Can AI write reviews for my customers?', route_pattern: '/dashboard/reviews', keywords: ['ai', 'fake', 'authentic'], priority: 60 },

    // "How does AI personalization work?"
    { faq_question: 'How does AI personalization work?', route_pattern: '/dashboard/business-profile', keywords: ['ai', 'personalization', 'business'], priority: 80 },
    { faq_question: 'How does AI personalization work?', route_pattern: '/dashboard/edit-prompt-page', keywords: ['ai', 'personalization'], priority: 70 },

    // "Can I turn off AI features?"
    { faq_question: 'Can I turn off AI features?', route_pattern: '/dashboard/create-prompt-page', keywords: ['ai', 'disable', 'manual'], priority: 50 },
    { faq_question: 'Can I turn off AI features?', route_pattern: '/dashboard/edit-prompt-page', keywords: ['ai', 'disable', 'manual'], priority: 50 },

    // "Does AI analyze my review trends?"
    { faq_question: 'Does AI analyze my review trends?', route_pattern: '/dashboard/analytics', keywords: ['ai', 'trends', 'analysis'], priority: 80 },
    { faq_question: 'Does AI analyze my review trends?', route_pattern: '/dashboard/reviews', keywords: ['ai', 'trends'], priority: 60 },

    // "What metrics can I track in Prompt Reviews?"
    { faq_question: 'What metrics can I track in Prompt Reviews?', route_pattern: '/dashboard/analytics', keywords: ['metrics', 'analytics', 'tracking'], priority: 90 },
    { faq_question: 'What metrics can I track in Prompt Reviews?', route_pattern: '/dashboard', keywords: ['metrics', 'overview'], priority: 50 },

    // "Can I see which prompt pages perform best?"
    { faq_question: 'Can I see which prompt pages perform best?', route_pattern: '/dashboard/analytics', keywords: ['prompt-pages', 'performance', 'conversion'], priority: 80 },
    { faq_question: 'Can I see which prompt pages perform best?', route_pattern: '/prompt-pages', keywords: ['performance', 'analytics'], priority: 60 },

    // "How do I track ROI from review collection?"
    { faq_question: 'How do I track ROI from review collection?', route_pattern: '/dashboard/analytics', keywords: ['roi', 'tracking', 'results'], priority: 70 },
    { faq_question: 'How do I track ROI from review collection?', route_pattern: '/dashboard', keywords: ['roi', 'growth'], priority: 40 },

    // "Can I export analytics reports?"
    { faq_question: 'Can I export analytics reports?', route_pattern: '/dashboard/analytics', keywords: ['export', 'reports', 'csv'], priority: 70 },

    // "Do you provide competitor analysis?"
    { faq_question: 'Do you provide competitor analysis?', route_pattern: '/dashboard/analytics', keywords: ['competitor', 'analysis', 'benchmark'], priority: 60 },
    { faq_question: 'Do you provide competitor analysis?', route_pattern: '/dashboard/comparisons', keywords: ['competitor', 'analysis'], priority: 80 },

    // "How often are analytics updated?"
    { faq_question: 'How often are analytics updated?', route_pattern: '/dashboard/analytics', keywords: ['updates', 'real-time', 'sync'], priority: 60 },
    { faq_question: 'How often are analytics updated?', route_pattern: '/dashboard/reviews', keywords: ['sync', 'updates'], priority: 40 },
  ];

  let contextCount = 0;
  for (const entry of contextEntries) {
    const faqId = faqMap.get(entry.faq_question);
    if (!faqId) {
      console.log(`  [SKIP] FAQ not found for question: ${entry.faq_question.substring(0, 40)}...`);
      continue;
    }

    const { error } = await supabase.from('faq_contexts').upsert(
      {
        faq_id: faqId,
        route_pattern: entry.route_pattern,
        keywords: entry.keywords,
        priority: entry.priority,
      },
      { onConflict: 'faq_id,route_pattern' }
    );

    if (error) {
      console.log(`  [ERROR] faq_context ${faqId} -> ${entry.route_pattern}: ${error.message}`);
    } else {
      contextCount++;
    }
  }
  log('FAQ_CONTEXTS', 'POPULATE', `Created ${contextCount} faq_context entries for 12 FAQs`);
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('=== Help Documentation Fix Script ===');
  console.log(`Started at ${new Date().toISOString()}`);
  console.log(`Target: ${supabaseUrl}\n`);

  try {
    const createdFaqs = await fixFaqs();
    await fixArticleContent();
    await fixArticleMetadata();
    await fixNavigation();
    await populateFaqContexts(createdFaqs);

    console.log(`\n=== COMPLETE ===`);
    console.log(`Total changes applied: ${totalChanges}`);
    console.log(`Finished at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('\n=== ERROR ===');
    console.error(error);
    process.exit(1);
  }
}

main();
