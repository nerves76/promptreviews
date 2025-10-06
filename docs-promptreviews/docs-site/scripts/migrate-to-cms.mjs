#!/usr/bin/env node

/**
 * Migration script to convert static documentation pages to CMS pattern
 *
 * This script:
 * 1. Extracts content from existing static page.tsx files
 * 2. Creates CMS articles via the admin API
 * 3. Updates page.tsx files to use the CMS pattern
 *
 * Usage: node scripts/migrate-to-cms.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MAIN_APP_URL = process.env.MAIN_APP_URL || 'https://app.promptreviews.app';
const API_KEY = process.env.ADMIN_API_KEY; // Need to pass this

if (!API_KEY) {
  console.error('Error: ADMIN_API_KEY environment variable is required');
  console.error('Usage: ADMIN_API_KEY=your_key node scripts/migrate-to-cms.mjs');
  process.exit(1);
}

// Pages to migrate - mapping route path to slug
const PAGES_TO_MIGRATE = [
  { path: 'advanced', slug: 'advanced', title: 'Advanced Features' },
  { path: 'analytics', slug: 'analytics', title: 'Analytics & Insights' },
  { path: 'api', slug: 'api', title: 'API Documentation' },
  { path: 'api/reference', slug: 'api-reference', title: 'API Reference' },
  { path: 'billing', slug: 'billing', title: 'Billing & Plans' },
  { path: 'billing/upgrades-downgrades', slug: 'billing-upgrades-downgrades', title: 'Upgrades & Downgrades' },
  { path: 'business-profile', slug: 'business-profile', title: 'Business Profile' },
  { path: 'contacts', slug: 'contacts', title: 'Contact Management' },
  { path: 'faq', slug: 'faq', title: 'FAQ' },
  { path: 'faq-comprehensive', slug: 'faq-comprehensive', title: 'Comprehensive FAQ' },
  { path: 'features', slug: 'features', title: 'Features Overview' },
  { path: 'google-biz-optimizer', slug: 'google-biz-optimizer', title: 'Google Business Optimizer' },
  { path: 'help', slug: 'help', title: 'Help Center' },
  { path: 'integrations', slug: 'integrations', title: 'Integrations' },
  { path: 'prompt-pages', slug: 'prompt-pages', title: 'Prompt Pages' },
  { path: 'prompt-pages/settings', slug: 'prompt-pages-settings', title: 'Prompt Page Settings' },
  { path: 'reviews', slug: 'reviews', title: 'Reviews Management' },
  { path: 'settings', slug: 'settings', title: 'Account Settings' },
  { path: 'style-settings', slug: 'style-settings', title: 'Style Settings' },
  { path: 'team', slug: 'team', title: 'Team Management' },
  { path: 'troubleshooting', slug: 'troubleshooting', title: 'Troubleshooting' },
  { path: 'widgets', slug: 'widgets', title: 'Review Widgets' },
];

// Icon mapping for common categories
const CATEGORY_ICONS = {
  'Advanced Features': 'BarChart3',
  'Insights': 'BarChart3',
  'Developer API': 'Code2',
  'Account Management': 'CreditCard',
  'Business Management': 'Building2',
  'Features': 'Sparkles',
  'Help': 'HelpCircle',
  'Reviews': 'Star',
  'Customization': 'Palette',
  'Team': 'Users',
  'Support': 'LifeBuoy',
};

/**
 * Extract metadata and content from a page.tsx file
 */
async function extractPageContent(pagePath) {
  const fullPath = path.join(__dirname, '..', 'src', 'app', pagePath, 'page.tsx');

  try {
    const content = await fs.readFile(fullPath, 'utf-8');

    // Extract metadata
    const metadata = {};

    // Extract title from metadata
    const titleMatch = content.match(/title:\s*['"]([^'"]+)['"]/);
    if (titleMatch) metadata.title = titleMatch[1].replace(' | Prompt Reviews', '').replace(' | PromptReviews', '');

    // Extract description
    const descMatch = content.match(/description:\s*['"]([^'"]+)['"]/);
    if (descMatch) metadata.description = descMatch[1];

    // Extract keywords
    const keywordsMatch = content.match(/keywords:\s*(\[[^\]]+\]|['"][^'"]+['"])/);
    if (keywordsMatch) {
      try {
        const kwStr = keywordsMatch[1].replace(/'/g, '"');
        metadata.keywords = JSON.parse(kwStr);
      } catch (e) {
        metadata.keywords = [keywordsMatch[1].replace(/['"]/g, '')];
      }
    }

    // Extract canonical URL
    const canonicalMatch = content.match(/canonical:\s*['"]([^'"]+)['"]/);
    if (canonicalMatch) metadata.canonical_url = canonicalMatch[1];

    // Extract category label
    const catLabelMatch = content.match(/categoryLabel:\s*['"]([^'"]+)['"]/);
    if (catLabelMatch) metadata.category_label = catLabelMatch[1];

    // Extract category color
    const catColorMatch = content.match(/categoryColor:\s*['"]([^'"]+)['"]/);
    if (catColorMatch) metadata.category_color = catColorMatch[1];

    // Extract category icon
    const catIconMatch = content.match(/categoryIcon:\s*\{?(\w+)\}?/);
    if (catIconMatch) metadata.category_icon = catIconMatch[1];

    // Extract available plans
    const plansMatch = content.match(/availablePlans:\s*\[([^\]]+)\]/);
    if (plansMatch) {
      metadata.available_plans = plansMatch[1]
        .split(',')
        .map(p => p.trim().replace(/['"]/g, ''));
    }

    // Extract key features
    const featuresMatch = content.match(/const keyFeatures = \[([\s\S]*?)\];/);
    if (featuresMatch) {
      try {
        // This is a simplified extraction - may need refinement
        metadata.key_features = extractArrayItems(featuresMatch[1], ['icon', 'title', 'description', 'href']);
      } catch (e) {
        console.warn(`Could not extract key features: ${e.message}`);
      }
    }

    // Extract how it works
    const howMatch = content.match(/const howItWorks = \[([\s\S]*?)\];/);
    if (howMatch) {
      try {
        metadata.how_it_works = extractArrayItems(howMatch[1], ['number', 'title', 'description', 'icon']);
      } catch (e) {
        console.warn(`Could not extract how it works: ${e.message}`);
      }
    }

    // Extract best practices
    const bestMatch = content.match(/const bestPractices = \[([\s\S]*?)\];/);
    if (bestMatch) {
      try {
        metadata.best_practices = extractArrayItems(bestMatch[1], ['icon', 'title', 'description']);
      } catch (e) {
        console.warn(`Could not extract best practices: ${e.message}`);
      }
    }

    // Extract overview content (if present as JSX)
    const overviewMatch = content.match(/const overviewContent = \(([\s\S]*?)\);/);
    if (overviewMatch) {
      metadata.overview_markdown = convertJSXToMarkdown(overviewMatch[1]);
    }

    return metadata;
  } catch (error) {
    console.error(`Error reading ${fullPath}:`, error.message);
    return null;
  }
}

/**
 * Extract array items from a string representation
 */
function extractArrayItems(str, fields) {
  const items = [];
  const objectMatches = str.match(/\{[\s\S]*?\}/g);

  if (!objectMatches) return items;

  for (const objStr of objectMatches) {
    const item = {};

    for (const field of fields) {
      // Match icon: IconName or icon: { IconName }
      if (field === 'icon') {
        const iconMatch = objStr.match(/icon:\s*\{?(\w+)\}?/);
        if (iconMatch) item.icon = iconMatch[1];
      } else {
        // Match string fields
        const regex = new RegExp(`${field}:\\s*['"\`]([^'"\`]+)['"\`]`, 's');
        const match = objStr.match(regex);
        if (match) {
          item[field] = match[1].trim();
        } else if (field === 'number') {
          // Try to match number field
          const numMatch = objStr.match(/number:\s*(\d+)/);
          if (numMatch) item.number = parseInt(numMatch[1]);
        }
      }
    }

    if (Object.keys(item).length > 0) {
      items.push(item);
    }
  }

  return items;
}

/**
 * Convert simple JSX to markdown
 */
function convertJSXToMarkdown(jsx) {
  // This is a simplified conversion - may need refinement
  let markdown = jsx
    .replace(/<>\s*/g, '')
    .replace(/<\/>\s*/g, '')
    .replace(/<p className="[^"]*">/g, '')
    .replace(/<\/p>/g, '\n\n')
    .replace(/<h3[^>]*>/g, '### ')
    .replace(/<\/h3>/g, '\n\n')
    .replace(/<h4[^>]*>/g, '#### ')
    .replace(/<\/h4>/g, '\n\n')
    .replace(/<div[^>]*>/g, '')
    .replace(/<\/div>/g, '')
    .replace(/<code[^>]*>/g, '`')
    .replace(/<\/code>/g, '`')
    .replace(/<pre[^>]*>/g, '\n```\n')
    .replace(/<\/pre>/g, '\n```\n')
    .replace(/\{`([^`]+)`\}/g, '$1')
    .replace(/\s+\n/g, '\n')
    .trim();

  return markdown;
}

/**
 * Create article via API
 */
async function createArticle(slug, title, metadata) {
  const url = `${MAIN_APP_URL}/api/admin/help-content`;

  const article = {
    slug,
    title,
    content: `# ${title}\n\nContent migrated from static page.`,
    metadata: {
      ...metadata,
      seo_title: metadata.seo_title || metadata.title || title,
      seo_description: metadata.seo_description || metadata.description,
    },
    status: 'published',
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(article),
    });

    if (!response.ok) {
      const error = await response.json();

      // If article already exists, try to update it
      if (response.status === 409) {
        console.log(`  Article '${slug}' already exists, updating...`);
        return await updateArticle(slug, title, metadata);
      }

      throw new Error(`API error: ${error.error || response.statusText}`);
    }

    const result = await response.json();
    return result.article;
  } catch (error) {
    console.error(`Error creating article '${slug}':`, error.message);
    throw error;
  }
}

/**
 * Update existing article via API
 */
async function updateArticle(slug, title, metadata) {
  const url = `${MAIN_APP_URL}/api/admin/help-content/${slug}`;

  const updates = {
    title,
    metadata: {
      ...metadata,
      seo_title: metadata.seo_title || metadata.title || title,
      seo_description: metadata.seo_description || metadata.description,
    },
    status: 'published',
  };

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API error: ${error.error || response.statusText}`);
    }

    const result = await response.json();
    return result.article;
  } catch (error) {
    console.error(`Error updating article '${slug}':`, error.message);
    throw error;
  }
}

/**
 * Generate CMS-pattern page.tsx content
 */
function generateCMSPageContent(pagePath, slug, metadata) {
  const hasOverview = !!metadata.overview_markdown;
  const categoryIcon = metadata.category_icon || 'Sparkles';

  return `import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import StandardOverviewLayout from '${getRelativeComponentPath(pagePath, 'StandardOverviewLayout')}'
import MarkdownRenderer from '${getRelativeComponentPath(pagePath, 'MarkdownRenderer')}'
import { pageFAQs } from '${getRelativePath(pagePath, 'utils/faqData')}'
import { getArticleBySlug } from '@/lib/docs/articles'

const { ${categoryIcon} } = Icons

const fallbackDescription = ${JSON.stringify(metadata.description || '')}

function resolveIcon(iconName: string | undefined, fallback: LucideIcon): LucideIcon {
  if (!iconName) return fallback
  const normalized = iconName.trim()
  const lookup = Icons as Record<string, unknown>
  const candidates = [
    normalized,
    normalized.toLowerCase(),
    normalized.toUpperCase(),
    normalized.charAt(0).toUpperCase() + normalized.slice(1),
    normalized.replace(/[-_\\s]+/g, ''),
  ]

  for (const key of candidates) {
    const maybeIcon = lookup[key]
    if (typeof maybeIcon === 'function') {
      return maybeIcon as LucideIcon
    }
  }

  return fallback
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const article = await getArticleBySlug('${slug}')
    if (!article) {
      return {
        title: '${metadata.title || metadata.seo_title} | Prompt Reviews',
        description: fallbackDescription,
        alternates: {
          canonical: '${metadata.canonical_url || `https://docs.promptreviews.app/${pagePath}`}',
        },
      }
    }

    const seoTitle = article.metadata?.seo_title || article.title
    const seoDescription = article.metadata?.seo_description || article.metadata?.description || fallbackDescription

    return {
      title: \`\${seoTitle} | Prompt Reviews\`,
      description: seoDescription,
      keywords: article.metadata?.keywords ?? [],
      alternates: {
        canonical: article.metadata?.canonical_url ?? '${metadata.canonical_url || `https://docs.promptreviews.app/${pagePath}`}',
      },
    }
  } catch (error) {
    console.error('generateMetadata ${slug} error:', error)
    return {
      title: '${metadata.title || metadata.seo_title} | Prompt Reviews',
      description: fallbackDescription,
      alternates: {
        canonical: '${metadata.canonical_url || `https://docs.promptreviews.app/${pagePath}`}',
      },
    }
  }
}

export default async function ${toPascalCase(slug)}Page() {
  let article = null

  try {
    article = await getArticleBySlug('${slug}')
  } catch (error) {
    console.error('Error fetching ${slug} article:', error)
  }

  if (!article) {
    notFound()
  }

  const metadata = article.metadata ?? {}

  const getString = (value: unknown): string | undefined => {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim()
    }
    return undefined
  }

  const availablePlans: ('grower' | 'builder' | 'maven' | 'enterprise')[] =
    Array.isArray(metadata.available_plans) && metadata.available_plans.length
      ? (metadata.available_plans as ('grower' | 'builder' | 'maven' | 'enterprise')[])
      : ['grower', 'builder', 'maven']

  const mappedKeyFeatures = Array.isArray(metadata.key_features) && metadata.key_features.length
    ? metadata.key_features.map((feature: any) => ({
        icon: resolveIcon(feature.icon, ${categoryIcon}),
        title: feature.title,
        description: feature.description,
        href: feature.href,
      }))
    : []

  const mappedHowItWorks = Array.isArray(metadata.how_it_works) && metadata.how_it_works.length
    ? metadata.how_it_works.map((step: any, index: number) => ({
        number: step.number ?? index + 1,
        title: step.title,
        description: step.description,
        icon: resolveIcon(step.icon, ${categoryIcon}),
      }))
    : []

  const mappedBestPractices = Array.isArray(metadata.best_practices) && metadata.best_practices.length
    ? metadata.best_practices.map((practice: any) => ({
        icon: resolveIcon(practice.icon, ${categoryIcon}),
        title: practice.title,
        description: practice.description,
      }))
    : []

  const CategoryIcon = resolveIcon(
    typeof metadata.category_icon === 'string' && metadata.category_icon.trim().length
      ? metadata.category_icon
      : '${categoryIcon}',
    ${categoryIcon},
  )

  const overviewMarkdown = getString((metadata as Record<string, unknown>).overview_markdown)
  const overviewTitle = getString((metadata as Record<string, unknown>).overview_title) || 'Overview'

  const overviewNode = overviewMarkdown
    ? <MarkdownRenderer content={overviewMarkdown} />
    : null

  const callToActionMeta = (metadata as Record<string, unknown>).call_to_action
  const parseCTAButton = (value: any) => {
    const text = getString(value?.text)
    const href = getString(value?.href)
    if (!text || !href) return undefined
    return {
      text,
      href,
      external: Boolean(value?.external),
    }
  }

  const callToAction = (callToActionMeta && typeof callToActionMeta === 'object')
    ? {
        primary: parseCTAButton((callToActionMeta as any).primary),
        secondary: parseCTAButton((callToActionMeta as any).secondary),
      }
    : undefined

  const faqMetadata = Array.isArray((metadata as Record<string, unknown>).faqs)
    ? ((metadata as Record<string, unknown>).faqs as { question: string; answer: string }[])
    : null

  const faqsTitle = getString((metadata as Record<string, unknown>).faqs_title)
  const keyFeaturesTitle = getString((metadata as Record<string, unknown>).key_features_title)
  const howItWorksTitle = getString((metadata as Record<string, unknown>).how_it_works_title)
  const bestPracticesTitle = getString((metadata as Record<string, unknown>).best_practices_title)

  return (
    <StandardOverviewLayout
      title={article.title || '${metadata.title}'}
      description={metadata.description ?? fallbackDescription}
      categoryLabel={metadata.category_label || '${metadata.category_label || 'Documentation'}'}
      categoryIcon={CategoryIcon}
      categoryColor={metadata.category_color || '${metadata.category_color || 'blue'}'}
      currentPage="${metadata.title}"
      availablePlans={availablePlans}
      keyFeatures={mappedKeyFeatures}
      keyFeaturesTitle={keyFeaturesTitle}
      howItWorks={mappedHowItWorks}
      howItWorksTitle={howItWorksTitle}
      bestPractices={mappedBestPractices}
      bestPracticesTitle={bestPracticesTitle}
      faqs={faqMetadata && faqMetadata.length ? faqMetadata : pageFAQs['${getFAQKey(slug)}']}
      faqsTitle={faqsTitle}
      callToAction={callToAction}${hasOverview ? `
      overview={overviewNode ? {
        title: overviewTitle,
        content: overviewNode,
      } : undefined}` : ''}
    />
  )
}
`;
}

/**
 * Helper functions
 */
function getRelativeComponentPath(fromPath, componentName) {
  const depth = fromPath.split('/').length;
  const prefix = '../'.repeat(depth);
  return `${prefix}components/${componentName}`;
}

function getRelativePath(fromPath, targetPath) {
  const depth = fromPath.split('/').length;
  const prefix = '../'.repeat(depth);
  return `${prefix}${targetPath}`;
}

function toPascalCase(str) {
  return str
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function getFAQKey(slug) {
  // Map slugs to FAQ keys
  const mapping = {
    'advanced': 'advanced',
    'analytics': 'analytics',
    'api': 'api',
    'api-reference': 'api',
    'billing': 'billing',
    'billing-upgrades-downgrades': 'billing',
    'business-profile': 'business-profile',
    'contacts': 'contacts',
    'faq': 'general',
    'faq-comprehensive': 'general',
    'features': 'features',
    'google-biz-optimizer': 'google-business',
    'help': 'general',
    'integrations': 'integrations',
    'prompt-pages': 'prompt-pages',
    'prompt-pages-settings': 'prompt-pages',
    'reviews': 'reviews',
    'settings': 'settings',
    'style-settings': 'customization',
    'team': 'team',
    'troubleshooting': 'troubleshooting',
    'widgets': 'widgets',
  };

  return mapping[slug] || 'general';
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('Starting CMS migration...\n');

  const results = {
    success: [],
    failed: [],
    skipped: [],
  };

  for (const page of PAGES_TO_MIGRATE) {
    console.log(`\n[${page.slug}] Processing ${page.path}...`);

    try {
      // Step 1: Extract content from existing page
      console.log(`  Extracting content...`);
      const metadata = await extractPageContent(page.path);

      if (!metadata) {
        console.log(`  ❌ Could not extract content`);
        results.skipped.push({ ...page, reason: 'Could not extract content' });
        continue;
      }

      // Step 2: Create CMS article
      console.log(`  Creating CMS article...`);
      await createArticle(page.slug, page.title, metadata);
      console.log(`  ✅ CMS article created`);

      // Step 3: Update page.tsx to use CMS pattern
      console.log(`  Updating page.tsx...`);
      const newPageContent = generateCMSPageContent(page.path, page.slug, metadata);
      const pagePath = path.join(__dirname, '..', 'src', 'app', page.path, 'page.tsx');

      // Backup original
      const backupPath = pagePath + '.backup';
      await fs.copyFile(pagePath, backupPath);
      console.log(`  💾 Backup saved to ${path.basename(backupPath)}`);

      // Write new content
      await fs.writeFile(pagePath, newPageContent, 'utf-8');
      console.log(`  ✅ page.tsx updated`);

      results.success.push({ ...page, metadata });
      console.log(`✅ [${page.slug}] Migration complete`);

    } catch (error) {
      console.error(`❌ [${page.slug}] Migration failed:`, error.message);
      results.failed.push({ ...page, error: error.message });
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('MIGRATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`\nTotal pages: ${PAGES_TO_MIGRATE.length}`);
  console.log(`✅ Success: ${results.success.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⏭️  Skipped: ${results.skipped.length}`);

  if (results.success.length > 0) {
    console.log('\n✅ Successfully migrated:');
    results.success.forEach(p => console.log(`  - ${p.slug} (${p.path})`));
  }

  if (results.failed.length > 0) {
    console.log('\n❌ Failed migrations:');
    results.failed.forEach(p => console.log(`  - ${p.slug}: ${p.error}`));
  }

  if (results.skipped.length > 0) {
    console.log('\n⏭️  Skipped:');
    results.skipped.forEach(p => console.log(`  - ${p.slug}: ${p.reason}`));
  }

  console.log('\n' + '='.repeat(80));

  // Save detailed report
  const reportPath = path.join(__dirname, '..', 'migration-report.json');
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Run migration
migrate().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
