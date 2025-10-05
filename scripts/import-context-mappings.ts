/**
 * Import Context Mappings to Database
 *
 * This script migrates route-to-article context mappings from the hardcoded
 * contextMapper.ts file into the article_contexts database table.
 *
 * Usage:
 *   npx ts-node scripts/import-context-mappings.ts
 *
 * Requirements:
 * - Articles must already exist in the articles table with matching slugs
 * - SUPABASE_SERVICE_ROLE_KEY must be set in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// ============================================================================
// CONTEXT MAPPINGS (from contextMapper.ts)
// ============================================================================

interface RouteContext {
  keywords: string[];
  pageName: string;
  helpTopics?: string[];
  priority?: number;
}

const routeContextMap: Record<string, RouteContext> = {
  '/dashboard': {
    keywords: ['dashboard', 'overview', 'getting-started', 'home'],
    pageName: 'Dashboard',
    helpTopics: ['navigation', 'metrics', 'quick-actions'],
    priority: 80
  },
  '/dashboard/create-prompt-page': {
    keywords: ['prompt-pages', 'create', 'setup', 'new'],
    pageName: 'Create Prompt Page',
    helpTopics: ['prompt-types', 'customization', 'publishing'],
    priority: 90
  },
  '/dashboard/edit-prompt-page': {
    keywords: ['prompt-pages', 'edit', 'customize', 'modify'],
    pageName: 'Edit Prompt Page',
    helpTopics: ['editing', 'preview', 'settings'],
    priority: 90
  },
  '/dashboard/contacts': {
    keywords: ['contacts', 'manage', 'upload', 'import', 'customers'],
    pageName: 'Contacts',
    helpTopics: ['csv-upload', 'contact-management', 'bulk-actions'],
    priority: 85
  },
  '/dashboard/business-profile': {
    keywords: ['business', 'profile', 'setup', 'branding', 'company'],
    pageName: 'Business Profile',
    helpTopics: ['business-info', 'branding', 'social-links'],
    priority: 85
  },
  '/dashboard/style': {
    keywords: ['style', 'branding', 'customize', 'colors', 'fonts', 'design'],
    pageName: 'Style Settings',
    helpTopics: ['colors', 'fonts', 'themes'],
    priority: 80
  },
  '/dashboard/widget': {
    keywords: ['widgets', 'embed', 'website', 'reviews', 'display'],
    pageName: 'Review Widgets',
    helpTopics: ['widget-types', 'embedding', 'customization'],
    priority: 90
  },
  '/dashboard/google-business': {
    keywords: ['google', 'business-profile', 'integration', 'gmb', 'maps', 'bulk', 'update', 'multiple', 'locations', 'business-info'],
    pageName: 'Google Business Profile',
    helpTopics: ['connection', 'sync', 'reviews-import', 'bulk-updates', 'location-management'],
    priority: 90
  },
  '/dashboard/reviews': {
    keywords: ['reviews', 'manage', 'verification', 'feedback', 'ratings'],
    pageName: 'Reviews Management',
    helpTopics: ['moderation', 'verification', 'responses'],
    priority: 85
  },
  '/dashboard/team': {
    keywords: ['team', 'collaboration', 'invite', 'members', 'roles'],
    pageName: 'Team Management',
    helpTopics: ['invites', 'permissions', 'roles'],
    priority: 80
  },
  '/dashboard/plan': {
    keywords: ['billing', 'subscription', 'upgrade', 'payment', 'pricing'],
    pageName: 'Billing & Plans',
    helpTopics: ['plans', 'billing', 'upgrades'],
    priority: 85
  },
  '/dashboard/analytics': {
    keywords: ['analytics', 'metrics', 'reports', 'insights', 'data'],
    pageName: 'Analytics',
    helpTopics: ['metrics', 'reports', 'export'],
    priority: 80
  },
  '/prompt-pages': {
    keywords: ['prompt-pages', 'public', 'sharing', 'list', 'manage'],
    pageName: 'Prompt Pages List',
    helpTopics: ['management', 'sharing', 'status'],
    priority: 75
  },
  '/r/': {
    keywords: ['review-page', 'customer', 'submission', 'public', 'feedback'],
    pageName: 'Review Submission Page',
    helpTopics: ['customer-experience', 'submission-process'],
    priority: 70
  }
};

// ============================================================================
// SLUG MAPPINGS (route keywords -> article slugs)
// ============================================================================

// Map keywords to likely article slugs based on the docs structure
const keywordToSlugMappings: Record<string, string[]> = {
  'dashboard': ['getting-started'],
  'overview': ['getting-started'],
  'getting-started': ['getting-started', 'getting-started/first-prompt-page', 'getting-started/account-setup'],
  'prompt-pages': ['prompt-pages', 'prompt-pages/types/universal', 'prompt-pages/features/ai-powered'],
  'create': ['getting-started/first-prompt-page', 'prompt-pages'],
  'setup': ['getting-started/account-setup', 'business-profile'],
  'new': ['getting-started/first-prompt-page'],
  'edit': ['prompt-pages/settings', 'prompt-pages/features/customization'],
  'customize': ['prompt-pages/features/customization', 'style-settings'],
  'modify': ['prompt-pages/settings'],
  'contacts': ['contacts', 'getting-started/adding-contacts'],
  'upload': ['contacts'],
  'import': ['contacts'],
  'customers': ['contacts'],
  'business-profile': ['business-profile'],
  'business': ['business-profile', 'google-business'],
  'profile': ['business-profile'],
  'company': ['business-profile'],
  'style': ['style-settings', 'prompt-pages/features/customization'],
  'branding': ['style-settings', 'business-profile', 'prompt-pages/features/customization'],
  'colors': ['style-settings'],
  'fonts': ['style-settings'],
  'design': ['style-settings', 'prompt-pages/features/customization'],
  'widgets': ['widgets', 'getting-started/review-widget'],
  'widget': ['widgets', 'getting-started/review-widget'],
  'embed': ['widgets'],
  'website': ['widgets'],
  'display': ['widgets'],
  'google': ['google-business'],
  'integration': ['google-business', 'prompt-pages/features/integration'],
  'gmb': ['google-business'],
  'maps': ['google-business'],
  'reviews': ['reviews'],
  'manage': ['reviews', 'contacts'],
  'verification': ['reviews'],
  'feedback': ['reviews', 'prompt-pages'],
  'ratings': ['reviews'],
  'team': ['team'],
  'collaboration': ['team'],
  'invite': ['team'],
  'members': ['team'],
  'roles': ['team'],
  'billing': ['billing', 'billing/upgrades-downgrades'],
  'subscription': ['billing'],
  'upgrade': ['billing/upgrades-downgrades'],
  'payment': ['billing'],
  'pricing': ['billing', 'getting-started/choosing-plan'],
  'plan': ['billing', 'getting-started/choosing-plan'],
  'analytics': ['analytics', 'prompt-pages/features/analytics'],
  'metrics': ['analytics'],
  'reports': ['analytics'],
  'insights': ['analytics', 'prompt-pages/features/analytics'],
  'data': ['analytics'],
  'ai': ['ai-reviews', 'prompt-pages/features/ai-powered'],
  'qr': ['prompt-pages/features/qr-codes'],
  'mobile': ['prompt-pages/features/mobile'],
  'security': ['prompt-pages/features/security'],
  'privacy': ['prompt-pages/features/security'],
};

// ============================================================================
// MAIN IMPORT FUNCTION
// ============================================================================

async function importContextMappings() {
  console.log('🚀 Starting context mappings import...\n');

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials. Check .env.local file.');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // First, fetch all articles to get their IDs
  console.log('📚 Fetching articles from database...');
  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('id, slug, title, metadata')
    .eq('status', 'published');

  if (articlesError) {
    throw new Error(`Failed to fetch articles: ${articlesError.message}`);
  }

  console.log(`✅ Found ${articles?.length || 0} articles\n`);

  // Create a slug-to-id map
  const slugToId = new Map<string, string>();
  articles?.forEach(article => {
    slugToId.set(article.slug, article.id);
  });

  // Stats
  let insertCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  // Process each route context
  for (const [routePattern, context] of Object.entries(routeContextMap)) {
    console.log(`\n📍 Processing route: ${routePattern}`);
    console.log(`   Keywords: ${context.keywords.join(', ')}`);

    // Find relevant articles based on keywords
    const relevantSlugs = new Set<string>();

    for (const keyword of context.keywords) {
      const mappedSlugs = keywordToSlugMappings[keyword.toLowerCase()];
      if (mappedSlugs) {
        mappedSlugs.forEach(slug => relevantSlugs.add(slug));
      }
    }

    if (relevantSlugs.size === 0) {
      console.log(`   ⚠️  No article mappings found for this route`);
      skipCount++;
      continue;
    }

    console.log(`   📄 Mapped to ${relevantSlugs.size} article(s): ${Array.from(relevantSlugs).join(', ')}`);

    // Insert context mappings for each relevant article
    for (const slug of relevantSlugs) {
      const articleId = slugToId.get(slug);

      if (!articleId) {
        console.log(`   ⚠️  Article not found in database: ${slug}`);
        skipCount++;
        continue;
      }

      // Check if mapping already exists
      const { data: existing } = await supabase
        .from('article_contexts')
        .select('id')
        .eq('article_id', articleId)
        .eq('route_pattern', routePattern)
        .single();

      if (existing) {
        console.log(`   ⏭️  Mapping already exists for ${slug}`);
        skipCount++;
        continue;
      }

      // Insert new mapping
      const { error: insertError } = await supabase
        .from('article_contexts')
        .insert({
          article_id: articleId,
          route_pattern: routePattern,
          keywords: context.keywords,
          priority: context.priority || 50
        });

      if (insertError) {
        console.error(`   ❌ Error inserting mapping for ${slug}: ${insertError.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ Created mapping for ${slug}`);
        insertCount++;
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Mappings created: ${insertCount}`);
  console.log(`⏭️  Mappings skipped: ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('='.repeat(60) + '\n');

  if (insertCount > 0) {
    console.log('🎉 Context mappings successfully imported to database!');
  } else if (skipCount > 0 && insertCount === 0) {
    console.log('ℹ️  All mappings already exist in database.');
  } else {
    console.log('⚠️  No mappings were imported. Check the logs above for details.');
  }
}

// ============================================================================
// RUN SCRIPT
// ============================================================================

// Run if this is the main module (ES module syntax)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  importContextMappings()
    .then(() => {
      console.log('\n✨ Script completed successfully!\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed with error:');
      console.error(error);
      process.exit(1);
    });
}

export { importContextMappings, routeContextMap, keywordToSlugMappings };
