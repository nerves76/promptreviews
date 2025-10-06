/**
 * Migration script to extract hardcoded default content from pages
 * and insert it into the database
 */

import fs from 'fs';
import path from 'path';

const pagesWithDefaults = [
  { slug: 'ai-reviews', file: 'src/app/ai-reviews/page.tsx' },
  { slug: 'prompt-pages', file: 'src/app/prompt-pages/page.tsx' },
  { slug: 'strategies', file: 'src/app/strategies/page.tsx' },
  { slug: 'getting-started', file: 'src/app/getting-started/page.tsx' },
  { slug: 'google-business/image-upload', file: 'src/app/google-business/image-upload/page.tsx' },
  { slug: 'google-business/business-info', file: 'src/app/google-business/business-info/page.tsx' },
  { slug: 'google-business/scheduling', file: 'src/app/google-business/scheduling/page.tsx' },
  { slug: 'google-business/categories-services', file: 'src/app/google-business/categories-services/page.tsx' },
  { slug: 'google-business/bulk-updates', file: 'src/app/google-business/bulk-updates/page.tsx' },
  { slug: 'google-business/review-import', file: 'src/app/google-business/review-import/page.tsx' },
];

interface ExtractedContent {
  slug: string;
  keyFeatures?: any[];
  howItWorks?: any[];
  bestPractices?: any[];
}

function extractArrayContent(fileContent: string, arrayName: string): any[] | null {
  // Match const arrayName = [...] with proper handling of nested brackets
  const regex = new RegExp(`const\\s+${arrayName}\\s*=\\s*\\[([\\s\\S]*?)\\](?=\\s*(?:const|function|export|\\n\\n))`, 'm');
  const match = fileContent.match(regex);

  if (!match) return null;

  try {
    // Clean up the content for JSON parsing
    let content = match[1];

    // Replace component references (like Brain, Target, etc.) with string names
    content = content.replace(/icon:\s*(\w+)/g, 'icon: "$1"');

    // Try to parse as JSON
    const jsonString = `[${content}]`;
    const parsed = eval(`(${jsonString})`);

    return parsed;
  } catch (error) {
    console.error(`Error parsing ${arrayName}:`, error);
    return null;
  }
}

function extractContent(filePath: string): ExtractedContent | null {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return null;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');

  const keyFeatures = extractArrayContent(content, 'defaultKeyFeatures');
  const howItWorks = extractArrayContent(content, 'defaultHowItWorks');
  const bestPractices = extractArrayContent(content, 'defaultBestPractices');

  return {
    slug: '',
    keyFeatures: keyFeatures || undefined,
    howItWorks: howItWorks || undefined,
    bestPractices: bestPractices || undefined,
  };
}

function generateSQL(data: Array<{ slug: string; content: ExtractedContent }>): string {
  const statements: string[] = [];

  for (const { slug, content } of data) {
    const updates: string[] = [];

    if (content.keyFeatures) {
      updates.push(`key_features = '${JSON.stringify(content.keyFeatures)}'::jsonb`);
    }

    if (content.howItWorks) {
      updates.push(`how_it_works = '${JSON.stringify(content.howItWorks)}'::jsonb`);
    }

    if (content.bestPractices) {
      updates.push(`best_practices = '${JSON.stringify(content.bestPractices)}'::jsonb`);
    }

    if (updates.length > 0) {
      statements.push(`
-- Update ${slug}
UPDATE articles
SET metadata = jsonb_set(
  jsonb_set(
    jsonb_set(metadata, '{key_features}', '${JSON.stringify(content.keyFeatures || [])}'::jsonb),
    '{how_it_works}', '${JSON.stringify(content.howItWorks || [])}'::jsonb
  ),
  '{best_practices}', '${JSON.stringify(content.bestPractices || [])}'::jsonb
)
WHERE slug = '${slug}';
`);
    }
  }

  return statements.join('\n');
}

// Main execution
console.log('Extracting default content from pages...\n');

const extractedData: Array<{ slug: string; content: ExtractedContent }> = [];

for (const page of pagesWithDefaults) {
  console.log(`Processing ${page.slug}...`);
  const content = extractContent(page.file);

  if (content && (content.keyFeatures || content.howItWorks || content.bestPractices)) {
    extractedData.push({ slug: page.slug, content });
    console.log(`  ✓ Found ${content.keyFeatures?.length || 0} features, ${content.howItWorks?.length || 0} steps, ${content.bestPractices?.length || 0} practices`);
  } else {
    console.log(`  - No content found`);
  }
}

console.log('\nGenerating SQL migration...\n');
const sql = generateSQL(extractedData);

fs.writeFileSync(
  path.join(process.cwd(), 'scripts/migrate-default-content.sql'),
  sql
);

console.log('SQL migration written to scripts/migrate-default-content.sql');
console.log(`\nReady to update ${extractedData.length} articles`);
