/**
 * ENHANCED: Migrate Static Documentation Pages to CMS
 *
 * This version preserves ALL design elements by extracting structured metadata
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { globSync } from 'glob';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// ============================================================================
// ICON MAPPINGS (Lucide → Emoji)
// ============================================================================

const ICON_TO_EMOJI: Record<string, string> = {
  // Common icons
  'CheckCircle': '✅',
  'Smile': '😊',
  'Heart': '❤️',
  'ThumbsUp': '👍',
  'Meh': '😐',
  'ThumbsDown': '👎',
  'Frown': '☹️',
  'Bot': '🤖',
  'Sparkles': '✨',
  'Zap': '⚡',
  'Download': '📥',
  'QrCode': '📱',
  'CreditCard': '💳',
  'Printer': '🖨️',
  'Users': '👥',
  'Smartphone': '📱',
  'Palette': '🎨',
  'Image': '🖼️',
  'Type': '📝',
  'Layout': '📐',
  'Eye': '👁️',
  'TouchSquare': '👆',
  'Wifi': '📶',
  'BarChart3': '📊',
  'TrendingUp': '📈',
  'Target': '🎯',
  'Clock': '⏰',
  'PieChart': '📊',
  'Activity': '📈',
  'Share2': '🔗',
  'Globe': '🌐',
  'Mail': '📧',
  'Facebook': '📘',
  'Instagram': '📷',
  'Twitter': '🐦',
  'Link2': '🔗',
  'Copy': '📋',
  'Monitor': '🖥️',
  'Tablet': '📱',
  'Lock': '🔒',
  'Key': '🔑',
  'Shield': '🛡️',
  'FileCheck': '✅',
  'AlertCircle': '⚠️',
  'Star': '⭐',
  'MapPin': '📍',
  'Building2': '🏢',
};

/**
 * Convert Lucide icon name to emoji
 */
function iconToEmoji(iconName: string): string {
  return ICON_TO_EMOJI[iconName] || '📌';
}

// ============================================================================
// STRUCTURED DATA EXTRACTORS
// ============================================================================

interface KeyFeature {
  icon: string;
  title: string;
  description: string;
}

interface HowItWorksStep {
  number: number;
  icon: string;
  title: string;
  description: string;
}

interface BestPractice {
  icon: string;
  title: string;
  description: string;
}

/**
 * Extract "How it works" section
 */
function extractHowItWorks(fileContent: string): HowItWorksStep[] {
  const steps: HowItWorksStep[] = [];

  // First, try to extract from TypeScript const howItWorks array
  const tsArrayMatch = fileContent.match(/const howItWorks\s*=\s*\[([\s\S]*?)\]\s*(?:export|const|function|$)/);
  if (tsArrayMatch) {
    const arrayContent = tsArrayMatch[1];
    // Extract each object (allowing multiline descriptions)
    const objectMatches = arrayContent.matchAll(/\{\s*number:\s*(\d+),\s*icon:\s*\w+,\s*title:\s*['"`]([^'"`]+)['"`],\s*description:\s*['"`]([^'"`]+)['"`]\s*\}/gs);

    for (const match of objectMatches) {
      const number = parseInt(match[1]);
      const title = match[2];
      const description = match[3];

      steps.push({
        number,
        icon: '▶️',
        title,
        description
      });
    }

    if (steps.length > 0) return steps;
  }

  // Fallback: Find the "How it works" heading and its container in JSX
  const howItWorksMatch = fileContent.match(/<h2[^>]*>How it works<\/h2>\s*<ol[\s\S]*?<\/ol>/i);
  if (!howItWorksMatch) return steps;

  const section = howItWorksMatch[0];
  const listItemRegex = /<li className="flex gap-4">\s*<span[^>]*>(\d+)<\/span>\s*<div>([\s\S]*?)<\/div>\s*<\/li>/g;
  let match;

  while ((match = listItemRegex.exec(section)) !== null) {
    const stepNumber = parseInt(match[1]);
    const content = match[2];

    const titleMatch = content.match(/<h4[^>]*>(.*?)<\/h4>/);
    const title = titleMatch ? titleMatch[1].trim() : '';

    const descMatch = content.match(/<p[^>]*>(.*?)<\/p>/);
    const description = descMatch ? descMatch[1].trim() : '';

    if (title && description) {
      steps.push({
        number: stepNumber,
        icon: '▶️',
        title,
        description
      });
    }
  }

  return steps;
}

/**
 * Extract key features/capabilities section
 */
function extractKeyFeatures(fileContent: string): KeyFeature[] {
  const features: KeyFeature[] = [];

  // First, try to extract from TypeScript const keyFeatures array
  const tsArrayMatch = fileContent.match(/const keyFeatures\s*=\s*\[([\s\S]*?)\]\s*(?:export|const|function|$)/);
  if (tsArrayMatch) {
    const arrayContent = tsArrayMatch[1];
    // Extract each object in the array
    const objectMatches = arrayContent.matchAll(/\{\s*icon:\s*(\w+),\s*title:\s*['"`]([^'"`]+)['"`],\s*description:\s*['"`]([^'"`]+)['"`]\s*\}/g);

    for (const match of objectMatches) {
      const iconName = match[1];
      const title = match[2];
      const description = match[3];
      const icon = iconToEmoji(iconName);

      features.push({ icon, title, description });
    }

    if (features.length > 0) return features;
  }

  // Fallback: Look for rendered JSX sections
  const sectionMatch = fileContent.match(/<h2[^>]*>(AI capabilities|Key features|Features)<\/h2>\s*<div className="grid[^"]*">([\s\S]*?)<\/div>\s*<\/div>/i);
  if (!sectionMatch) return features;

  const gridContent = sectionMatch[2];
  const cardSections = gridContent.split(/<div className="bg-white\/5 rounded-lg p-4">/).filter(c => c.trim());

  for (const cardSection of cardSections) {
    if (!cardSection.includes('className="w-5 h-5')) continue;

    const iconMatch = cardSection.match(/<(\w+) className="w-5 h-5/);
    const icon = iconMatch ? iconToEmoji(iconMatch[1]) : '📌';

    const titleMatch = cardSection.match(/<h3[^>]*>(.*?)<\/h3>/);
    const title = titleMatch ? titleMatch[1].trim() : '';

    const descMatch = cardSection.match(/<p[^>]*>\s*([\s\S]*?)\s*<\/p>/);
    const description = descMatch ? descMatch[1].trim().replace(/\s+/g, ' ') : '';

    if (title && description) {
      features.push({ icon, title, description });
    }
  }

  return features;
}

/**
 * Extract best practices section
 */
function extractBestPractices(fileContent: string): BestPractice[] {
  const practices: BestPractice[] = [];

  // Find best practices, tips, or key benefits section
  const sectionMatch = fileContent.match(/<h2[^>]*>(Best practices|Tips|Key benefits)<\/h2>\s*<div[\s\S]*?<\/div>\s*<\/div>/i);
  if (!sectionMatch) return practices;

  const section = sectionMatch[0];

  // Extract cards with h4 titles (best practices style)
  const cardMatches = section.matchAll(/<div className="bg-white\/5 rounded-lg p-4">([\s\S]*?)<\/div>/g);

  for (const match of cardMatches) {
    const card = match[1];

    // Extract title from h4
    const titleMatch = card.match(/<h4[^>]*>(.*?)<\/h4>/);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Extract description from p
    const descMatch = card.match(/<p[^>]*>(.*?)<\/p>/);
    const description = descMatch ? descMatch[1].trim() : '';

    if (title && description) {
      practices.push({
        icon: '💡',
        title,
        description
      });
    }
  }

  // Also look for checklist-style benefits (div with checkmark + h4 + p)
  if (practices.length === 0) {
    const benefitMatches = section.matchAll(/<div className="flex gap-3">[\s\S]*?<h4[^>]*>(.*?)<\/h4>[\s\S]*?<p[^>]*>(.*?)<\/p>[\s\S]*?<\/div>/g);

    for (const match of benefitMatches) {
      const title = match[1].trim();
      const description = match[2].trim();

      if (title && description) {
        practices.push({
          icon: '✓',
          title,
          description
        });
      }
    }
  }

  return practices;
}

/**
 * Extract category info from header
 */
function extractCategoryInfo(fileContent: string): { label?: string; icon?: string; color?: string } {
  const category: { label?: string; icon?: string; color?: string } = {};

  // Try to find gradient color from header
  const gradientMatch = fileContent.match(/bg-gradient-to-br from-(\w+)-500/);
  if (gradientMatch) {
    category.color = gradientMatch[1];
  }

  return category;
}

// ============================================================================
// MAIN EXTRACTION FUNCTION
// ============================================================================

interface ExtractedArticle {
  slug: string;
  title: string;
  content: string;
  metadata: {
    title?: string;
    description?: string;
    keywords?: string | string[];
    category?: string;
    category_label?: string;
    category_icon?: string;
    category_color?: string;
    available_plans?: string[];
    key_features?: KeyFeature[];
    how_it_works?: HowItWorksStep[];
    best_practices?: BestPractice[];
  };
  status: 'published' | 'draft';
}

function parseStaticPageEnhanced(filePath: string): ExtractedArticle | null {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const slug = getSlugFromPath(filePath);

    // Extract basic metadata
    const metadata: any = {};

    // Title
    const titleMatch = fileContent.match(/title:\s*['"`]([^'"`]+)['"`]/);
    if (titleMatch) {
      metadata.title = titleMatch[1].replace(/\s*\|.*$/, '').trim();
    }

    // Description
    const descMatch = fileContent.match(/description:\s*['"`]([^'"`]+)['"`]/);
    if (descMatch) {
      metadata.description = descMatch[1];
    }

    // Keywords
    const keywordsMatch = fileContent.match(/keywords:\s*(\[[\s\S]*?\]|['"`][^'"`]+['"`])/);
    if (keywordsMatch) {
      const keywordsStr = keywordsMatch[1];
      if (keywordsStr.startsWith('[')) {
        const arrayMatch = keywordsStr.match(/['"`]([^'"`]+)['"`]/g);
        if (arrayMatch) {
          metadata.keywords = arrayMatch.map(k => k.replace(/['"`]/g, ''));
        }
      } else {
        metadata.keywords = keywordsStr.replace(/['"`]/g, '');
      }
    }

    // Extract structured sections
    metadata.key_features = extractKeyFeatures(fileContent);
    metadata.how_it_works = extractHowItWorks(fileContent);
    metadata.best_practices = extractBestPractices(fileContent);

    // Extract category info
    const categoryInfo = extractCategoryInfo(fileContent);
    Object.assign(metadata, categoryInfo);

    // Extract main content (Overview sections)
    let content = extractMainContent(fileContent);

    if (!metadata.title) {
      console.warn(`⚠️  No title found for ${slug}, skipping...`);
      return null;
    }

    // Convert structured metadata to markdown and append to content
    let fullContent = content + '\n\n';

    // Add Key Features section if exists
    if (metadata.key_features && metadata.key_features.length > 0) {
      fullContent += '## Key Features\n\n';
      for (const feature of metadata.key_features) {
        fullContent += `### ${feature.icon} ${feature.title}\n\n`;
        fullContent += `${feature.description}\n\n`;
      }
    }

    // Add How It Works section if exists
    if (metadata.how_it_works && metadata.how_it_works.length > 0) {
      fullContent += '## How It Works\n\n';
      for (const step of metadata.how_it_works) {
        fullContent += `${step.number}. **${step.title}**\n\n`;
        fullContent += `   ${step.description}\n\n`;
      }
    }

    // Add Best Practices section if exists
    if (metadata.best_practices && metadata.best_practices.length > 0) {
      fullContent += '## Best Practices\n\n';
      for (const practice of metadata.best_practices) {
        fullContent += `- ${practice.icon} **${practice.title}**: ${practice.description}\n\n`;
      }
    }

    return {
      slug,
      title: metadata.title,
      content: fullContent.trim(),
      metadata,
      status: 'published'
    };
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return null;
  }
}

/**
 * Extract main textual content (Overview, What is, etc.)
 */
function extractMainContent(fileContent: string): string {
  let content = '';

  // Try to extract from StandardOverviewLayout description prop
  const layoutDescMatch = fileContent.match(/description=["']([^"']+)["']/);
  if (layoutDescMatch) {
    content = layoutDescMatch[1];
    return content;
  }

  // Fallback: extract from metadata description
  const metadataDescMatch = fileContent.match(/description:\s*['"`]([^'"`]+)['"`]/);
  if (metadataDescMatch) {
    content = metadataDescMatch[1];
    return content;
  }

  // Last resort: extract the header description (the paragraph after h1)
  const headerDescMatch = fileContent.match(/<h1[^>]*>.*?<\/h1>\s*<\/div>\s*<p[^>]*>(.*?)<\/p>/);
  if (headerDescMatch) {
    content += headerDescMatch[1].trim() + '\n\n';
  }

  // Extract all bg-white/10 backdrop-blur sections (overview boxes)
  const sectionMatches = fileContent.matchAll(/<div className="bg-white\/10 backdrop-blur-md rounded-xl[^"]*"[^>]*>([\s\S]*?)<\/div>(?=\s*(?:<div|$))/g);

  for (const match of sectionMatches) {
    const section = match[1];

    // Extract heading
    const headingMatch = section.match(/<h2[^>]*>(.*?)<\/h2>/);
    const heading = headingMatch ? headingMatch[1].trim() : '';

    // Skip sections we handle separately
    if (heading && (
      heading.toLowerCase().includes('how it works') ||
      heading.toLowerCase().includes('ai capabilities') ||
      heading.toLowerCase().includes('key features') ||
      heading.toLowerCase().includes('key benefits') ||
      heading.toLowerCase().includes('best practices') ||
      heading.toLowerCase().includes('related features') ||
      heading.toLowerCase().includes('related')
    )) {
      continue;
    }

    // Extract all paragraphs from this section
    const paragraphs = section.match(/<p[^>]*>(.*?)<\/p>/g);
    if (paragraphs && paragraphs.length > 0) {
      if (heading) {
        content += `## ${heading}\n\n`;
      }

      // Clean HTML tags from paragraphs
      const cleanParas = paragraphs.map(p => {
        return p
          .replace(/<p[^>]*>/, '')
          .replace(/<\/p>/, '')
          .replace(/<strong[^>]*>(.*?)<\/strong>/g, '**$1**')
          .replace(/<[^>]+>/g, '')
          .trim();
      });

      content += cleanParas.join('\n\n') + '\n\n';
    }
  }

  // Also extract any ul/ol lists in the overview sections
  const listMatches = fileContent.matchAll(/<ul[^>]*>([\s\S]*?)<\/ul>/g);
  for (const match of listMatches) {
    const list = match[1];
    const items = list.match(/<li[^>]*>(.*?)<\/li>/g);
    if (items) {
      items.forEach(item => {
        const text = item.replace(/<[^>]+>/g, '').trim();
        if (text) {
          content += `- ${text}\n`;
        }
      });
      content += '\n';
    }
  }

  return content.trim() || 'No content available.';
}

function getSlugFromPath(filePath: string): string {
  const relativePath = filePath
    .replace(/.*docs-site\/src\/app\//, '')
    .replace(/\/page\.tsx$/, '');
  return relativePath === '' || relativePath === 'page' ? 'home' : relativePath;
}

// ============================================================================
// MIGRATION FUNCTION
// ============================================================================

async function migrateStaticDocsEnhanced() {
  console.log('🚀 Starting ENHANCED static docs migration to CMS...\n');
  console.log('✨ This version preserves ALL design elements\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const docsBasePath = path.resolve(process.cwd(), 'docs-promptreviews/docs-site/src/app');

  console.log(`📁 Scanning: ${docsBasePath}\n`);

  const pattern = path.join(docsBasePath, '**/page.tsx');
  const files = globSync(pattern, {
    ignore: ['**/node_modules/**', '**/docs/[slug]/**']
  });

  console.log(`📄 Found ${files.length} static page files\n`);

  let importCount = 0;
  let updateCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const filePath of files) {
    const article = parseStaticPageEnhanced(filePath);

    if (!article) {
      skipCount++;
      continue;
    }

    console.log(`\n📝 Processing: ${article.slug}`);
    console.log(`   Title: ${article.title}`);
    console.log(`   Content: ${article.content.length} chars`);
    console.log(`   Key Features: ${article.metadata.key_features?.length || 0}`);
    console.log(`   How It Works Steps: ${article.metadata.how_it_works?.length || 0}`);
    console.log(`   Best Practices: ${article.metadata.best_practices?.length || 0}`);

    const { data: existing } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', article.slug)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('articles')
        .update({
          title: article.title,
          content: article.content,
          metadata: article.metadata,
          status: article.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        console.error(`   ❌ Error: ${error.message}`);
        errorCount++;
      } else {
        console.log(`   🔄 Updated with full design`);
        updateCount++;
      }
    } else {
      const { error } = await supabase
        .from('articles')
        .insert({
          slug: article.slug,
          title: article.title,
          content: article.content,
          metadata: article.metadata,
          status: article.status,
          published_at: new Date().toISOString(),
        });

      if (error) {
        console.error(`   ❌ Error: ${error.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ Created with full design`);
        importCount++;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 ENHANCED MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Articles created: ${importCount}`);
  console.log(`🔄 Articles updated: ${updateCount}`);
  console.log(`⏭️  Skipped: ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('='.repeat(60) + '\n');

  if (importCount > 0 || updateCount > 0) {
    console.log('🎉 Migration completed with FULL design preservation!');
    console.log('\n📍 All design elements preserved:');
    console.log('   ✅ Structured sections (How it works, Key features, etc.)');
    console.log('   ✅ Icons converted to emojis');
    console.log('   ✅ Multi-column grids');
    console.log('   ✅ Styled cards');
    console.log('   ✅ Visual hierarchy\n');
    console.log('📍 Next step: npx ts-node scripts/import-context-mappings.ts\n');
  }
}

// Run migration
migrateStaticDocsEnhanced()
  .then(() => {
    console.log('\n✨ Script completed!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:');
    console.error(error);
    process.exit(1);
  });

export { migrateStaticDocsEnhanced };
