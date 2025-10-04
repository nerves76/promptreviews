#!/usr/bin/env node

/**
 * Article Extraction Tool
 *
 * Extracts content from hardcoded TSX pages and converts to:
 * - Markdown/MDX content
 * - JSON metadata
 *
 * Usage:
 *   node scripts/extract-article.js <page-path>
 *   node scripts/extract-article.js src/app/getting-started/page.tsx
 *
 * Output:
 *   - extracted/<slug>.md
 *   - extracted/<slug>.meta.json
 *   - extracted/<slug>.report.json
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const OUTPUT_DIR = path.join(__dirname, '../extracted');
const DOCS_ROOT = path.join(__dirname, '../src/app');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ============================================================================
// UTILITIES
// ============================================================================

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
    reset: '\x1b[0m'
  };
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  console.log(`${colors[type]}${prefix[type]} ${message}${colors.reset}`);
}

function extractSlugFromPath(filePath) {
  // Convert file path to slug
  // src/app/getting-started/page.tsx → getting-started
  // src/app/prompt-pages/types/service/page.tsx → prompt-pages/types/service

  const relativePath = path.relative(DOCS_ROOT, filePath);
  const slug = relativePath
    .replace(/\/page\.tsx$/, '')
    .replace(/^\.\//, '')
    .replace(/\\/g, '/');

  return slug === '' ? 'home' : slug;
}

// ============================================================================
// METADATA EXTRACTION
// ============================================================================

function extractMetadata(fileContent) {
  const metadata = {};

  // Extract Next.js metadata export
  const metadataMatch = fileContent.match(/export const metadata[:\s]*Metadata\s*=\s*({[\s\S]*?});/);

  if (metadataMatch) {
    try {
      // This is a simplified parser - in production, use a proper TypeScript parser
      const metadataStr = metadataMatch[1];

      // Extract title
      const titleMatch = metadataStr.match(/title:\s*['"]([^'"]+)['"]/);
      if (titleMatch) metadata.title = titleMatch[1];

      // Extract description
      const descMatch = metadataStr.match(/description:\s*['"]([^'"]+)['"]/);
      if (descMatch) metadata.description = descMatch[1];

      // Extract keywords
      const keywordsMatch = metadataStr.match(/keywords:\s*\[([\s\S]*?)\]/);
      if (keywordsMatch) {
        metadata.keywords = keywordsMatch[1]
          .split(',')
          .map(k => k.trim().replace(/['"]/g, ''))
          .filter(k => k);
      }

      // Extract canonical
      const canonicalMatch = metadataStr.match(/canonical:\s*['"]([^'"]+)['"]/);
      if (canonicalMatch) metadata.canonical_url = canonicalMatch[1];

    } catch (err) {
      log(`Warning: Could not parse metadata: ${err.message}`, 'warning');
    }
  }

  return metadata;
}

// ============================================================================
// COMPONENT PROPS EXTRACTION
// ============================================================================

function extractArrayProp(fileContent, propName) {
  // Extract array like: const keyFeatures = [...]
  // Need to handle nested braces properly
  const startRegex = new RegExp(`const ${propName}\\s*=\\s*\\[`, 'm');
  const startMatch = fileContent.match(startRegex);

  if (!startMatch) return null;

  const startIndex = startMatch.index + startMatch[0].length;

  // Find matching closing bracket
  let depth = 1;
  let endIndex = startIndex;
  let inString = false;
  let stringChar = null;
  let escaped = false;

  while (depth > 0 && endIndex < fileContent.length) {
    const char = fileContent[endIndex];

    if (escaped) {
      escaped = false;
      endIndex++;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      endIndex++;
      continue;
    }

    if (!inString) {
      if (char === '"' || char === "'" || char === '`') {
        inString = true;
        stringChar = char;
      } else if (char === '[' || char === '{') {
        depth++;
      } else if (char === ']' || char === '}') {
        depth--;
      }
    } else {
      if (char === stringChar) {
        inString = false;
        stringChar = null;
      }
    }

    endIndex++;
  }

  const arrayContent = fileContent.substring(startIndex, endIndex - 1);

  // Now extract objects from the array content
  const items = [];
  const objectRegex = /{\s*([^}]*(?:icon|title|description|number)[^}]*)\s*}/gs;
  const objectMatches = arrayContent.matchAll(objectRegex);

  for (const objMatch of objectMatches) {
    const obj = {};
    const content = objMatch[1];

    // Extract icon
    const iconMatch = content.match(/icon:\s*([A-Za-z]+)/);
    if (iconMatch) obj.icon = iconMatch[1];

    // Extract title - handle escaped quotes
    const titleMatch = content.match(/title:\s*['"]((?:[^'"\\]|\\.)*)['"]/)  ||
                       content.match(/title:\s*['`]((?:[^'`\\]|\\.)*?)['`]/s);
    if (titleMatch) {
      obj.title = titleMatch[1].replace(/\\'/g, "'").replace(/\\"/g, '"');
    }

    // Extract description - handle escaped quotes and multiline
    const descMatch = content.match(/description:\s*['"]((?:[^'"\\]|\\.)*)['"]/) ||
                      content.match(/description:\s*['`]((?:[^'`\\]|\\.)*?)['`]/s);
    if (descMatch) {
      obj.description = descMatch[1].replace(/\\'/g, "'").replace(/\\"/g, '"');
    }

    // Extract number (for howItWorks)
    const numberMatch = content.match(/number:\s*(\d+)/);
    if (numberMatch) obj.number = parseInt(numberMatch[1]);

    // Only add if we got meaningful data
    if (obj.title || obj.description) {
      items.push(obj);
    }
  }

  return items.length > 0 ? items : null;
}

function extractLayoutProps(fileContent) {
  const props = {};

  // Extract StandardOverviewLayout props
  const layoutMatch = fileContent.match(/<StandardOverviewLayout\s+([\s\S]*?)\/>/);

  if (layoutMatch) {
    const propsStr = layoutMatch[1];

    // Extract simple string props
    const titleMatch = propsStr.match(/title="([^"]+)"/);
    if (titleMatch) props.page_title = titleMatch[1];

    const descMatch = propsStr.match(/description="([^"]+)"/);
    if (descMatch) props.page_description = descMatch[1];

    const categoryLabelMatch = propsStr.match(/categoryLabel="([^"]+)"/);
    if (categoryLabelMatch) props.category_label = categoryLabelMatch[1];

    const categoryIconMatch = propsStr.match(/categoryIcon={([A-Za-z]+)}/);
    if (categoryIconMatch) props.category_icon = categoryIconMatch[1];

    const categoryColorMatch = propsStr.match(/categoryColor="([^"]+)"/);
    if (categoryColorMatch) props.category_color = categoryColorMatch[1];

    // Extract availablePlans
    const plansMatch = propsStr.match(/availablePlans={\[([^\]]+)\]}/);
    if (plansMatch) {
      props.available_plans = plansMatch[1]
        .split(',')
        .map(p => p.trim().replace(/['"]/g, ''));
    }
  }

  // Extract array props
  const keyFeatures = extractArrayProp(fileContent, 'keyFeatures');
  if (keyFeatures) props.key_features = keyFeatures;

  const howItWorks = extractArrayProp(fileContent, 'howItWorks');
  if (howItWorks) props.how_it_works = howItWorks;

  const bestPractices = extractArrayProp(fileContent, 'bestPractices');
  if (bestPractices) props.best_practices = bestPractices;

  return props;
}

// ============================================================================
// MARKDOWN GENERATION
// ============================================================================

function generateMarkdown(metadata, layoutProps, slug) {
  let markdown = '';

  // Frontmatter
  markdown += '---\n';
  markdown += `title: "${metadata.title || layoutProps.page_title || 'Untitled'}"\n`;
  if (metadata.description) markdown += `description: "${metadata.description}"\n`;
  markdown += `slug: "${slug}"\n`;
  markdown += `status: "draft"\n`;
  markdown += '---\n\n';

  // Main heading
  markdown += `# ${layoutProps.page_title || metadata.title || 'Untitled'}\n\n`;

  // Description
  if (layoutProps.page_description) {
    markdown += `${layoutProps.page_description}\n\n`;
  }

  // Key Features section
  if (layoutProps.key_features && layoutProps.key_features.length > 0) {
    markdown += '## Key Features\n\n';
    for (const feature of layoutProps.key_features) {
      markdown += `### ${feature.title}\n\n`;
      markdown += `${feature.description}\n\n`;
    }
  }

  // How It Works section
  if (layoutProps.how_it_works && layoutProps.how_it_works.length > 0) {
    markdown += '## How It Works\n\n';
    for (const step of layoutProps.how_it_works) {
      markdown += `### ${step.number}. ${step.title}\n\n`;
      markdown += `${step.description}\n\n`;
    }
  }

  // Best Practices section
  if (layoutProps.best_practices && layoutProps.best_practices.length > 0) {
    markdown += '## Best Practices\n\n';
    for (const practice of layoutProps.best_practices) {
      markdown += `### ${practice.title}\n\n`;
      markdown += `${practice.description}\n\n`;
    }
  }

  return markdown;
}

// ============================================================================
// METADATA JSON GENERATION
// ============================================================================

function generateMetadataJSON(metadata, layoutProps, slug) {
  return {
    // SEO
    description: metadata.description || layoutProps.page_description || '',
    keywords: metadata.keywords || [],
    canonical_url: metadata.canonical_url || `https://docs.promptreviews.app/${slug}`,

    // Organization
    category: slug.split('/')[0], // First segment as category
    tags: metadata.keywords || [],

    // Display
    category_label: layoutProps.category_label || '',
    category_icon: layoutProps.category_icon || '',
    category_color: layoutProps.category_color || 'blue',

    // Access Control
    available_plans: layoutProps.available_plans || ['grower', 'builder', 'maven', 'enterprise'],

    // Featured Content
    key_features: layoutProps.key_features || [],
    how_it_works: layoutProps.how_it_works || [],
    best_practices: layoutProps.best_practices || [],

    // Original metadata for reference
    _original: {
      metadata,
      layoutProps
    }
  };
}

// ============================================================================
// VALIDATION & REPORTING
// ============================================================================

function generateReport(slug, metadata, layoutProps, markdown, metadataJSON) {
  return {
    slug,
    extraction_date: new Date().toISOString(),

    // Statistics
    stats: {
      markdown_length: markdown.length,
      metadata_fields: Object.keys(metadataJSON).length,
      key_features_count: layoutProps.key_features?.length || 0,
      how_it_works_count: layoutProps.how_it_works?.length || 0,
      best_practices_count: layoutProps.best_practices?.length || 0,
    },

    // Extracted data summary
    extracted: {
      title: metadata.title || layoutProps.page_title,
      has_description: !!(metadata.description || layoutProps.page_description),
      has_keywords: metadata.keywords?.length > 0,
      has_features: layoutProps.key_features?.length > 0,
      has_workflow: layoutProps.how_it_works?.length > 0,
      has_best_practices: layoutProps.best_practices?.length > 0,
    },

    // Warnings
    warnings: []
  };
}

// ============================================================================
// MAIN EXTRACTION FUNCTION
// ============================================================================

function extractArticle(filePath) {
  log(`Processing: ${filePath}`, 'info');

  // Read file
  if (!fs.existsSync(filePath)) {
    log(`File not found: ${filePath}`, 'error');
    process.exit(1);
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const slug = extractSlugFromPath(filePath);

  log(`Extracted slug: ${slug}`, 'info');

  // Extract metadata
  const metadata = extractMetadata(fileContent);
  log(`Found ${Object.keys(metadata).length} metadata fields`, 'info');

  // Extract layout props
  const layoutProps = extractLayoutProps(fileContent);
  log(`Found ${Object.keys(layoutProps).length} layout props`, 'info');

  // Generate markdown
  const markdown = generateMarkdown(metadata, layoutProps, slug);
  log(`Generated ${markdown.length} characters of markdown`, 'info');

  // Generate metadata JSON
  const metadataJSON = generateMetadataJSON(metadata, layoutProps, slug);

  // Generate report
  const report = generateReport(slug, metadata, layoutProps, markdown, metadataJSON);

  // Add warnings
  if (!metadata.title && !layoutProps.page_title) {
    report.warnings.push('No title found');
  }
  if (!metadata.description && !layoutProps.page_description) {
    report.warnings.push('No description found');
  }

  // Write output files
  const slugSafe = slug.replace(/\//g, '-');
  const markdownPath = path.join(OUTPUT_DIR, `${slugSafe}.md`);
  const metadataPath = path.join(OUTPUT_DIR, `${slugSafe}.meta.json`);
  const reportPath = path.join(OUTPUT_DIR, `${slugSafe}.report.json`);

  fs.writeFileSync(markdownPath, markdown);
  fs.writeFileSync(metadataPath, JSON.stringify(metadataJSON, null, 2));
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  log(`✅ Markdown: ${markdownPath}`, 'success');
  log(`✅ Metadata: ${metadataPath}`, 'success');
  log(`✅ Report: ${reportPath}`, 'success');

  // Show warnings
  if (report.warnings.length > 0) {
    log(`Warnings: ${report.warnings.join(', ')}`, 'warning');
  }

  return { markdown, metadataJSON, report };
}

// ============================================================================
// CLI
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node scripts/extract-article.js <page-path>');
    console.log('Example: node scripts/extract-article.js src/app/getting-started/page.tsx');
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);
  extractArticle(filePath);
}

module.exports = { extractArticle };
