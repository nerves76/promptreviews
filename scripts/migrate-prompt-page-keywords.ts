/**
 * Migration Script: Prompt Page Keywords to Keyword Library
 *
 * This script migrates existing keywords from prompt_pages.keywords (TEXT[])
 * to the unified keywords table and creates junction records in keyword_prompt_page_usage.
 *
 * Usage:
 *   npx ts-node scripts/migrate-prompt-page-keywords.ts --dry-run
 *   npx ts-node scripts/migrate-prompt-page-keywords.ts --execute
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Keyword utilities (copied from keywordUtils.ts to avoid import issues)
function normalizePhrase(phrase: string): string {
  return phrase
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ');
}

function calculateWordCount(phrase: string): number {
  return phrase.trim().split(/\s+/).filter(Boolean).length;
}

const DEFAULT_GROUP_NAME = 'General';

interface MigrationStats {
  promptPagesProcessed: number;
  keywordsCreated: number;
  junctionsCreated: number;
  errors: string[];
}

async function migrateKeywords(dryRun: boolean): Promise<MigrationStats> {
  const stats: MigrationStats = {
    promptPagesProcessed: 0,
    keywordsCreated: 0,
    junctionsCreated: 0,
    errors: [],
  };

  console.log(`\n🔄 Starting keyword migration (${dryRun ? 'DRY RUN' : 'EXECUTE MODE'})...\n`);

  // Get all prompt pages with keywords
  const { data: promptPages, error: pagesError } = await supabase
    .from('prompt_pages')
    .select('id, account_id, keywords, slug')
    .not('keywords', 'is', null);

  if (pagesError) {
    console.error('Error fetching prompt pages:', pagesError);
    stats.errors.push(`Failed to fetch prompt pages: ${pagesError.message}`);
    return stats;
  }

  if (!promptPages || promptPages.length === 0) {
    console.log('No prompt pages with keywords found.');
    return stats;
  }

  console.log(`Found ${promptPages.length} prompt pages with keywords.\n`);

  // Group pages by account for efficient processing
  const pagesByAccount = new Map<string, typeof promptPages>();
  for (const page of promptPages) {
    if (!page.account_id) continue;
    if (!pagesByAccount.has(page.account_id)) {
      pagesByAccount.set(page.account_id, []);
    }
    pagesByAccount.get(page.account_id)!.push(page);
  }

  console.log(`Processing ${pagesByAccount.size} accounts...\n`);

  for (const [accountId, pages] of pagesByAccount) {
    console.log(`\n📁 Account ${accountId.substring(0, 8)}...`);

    // Get or create General group for this account
    let generalGroupId: string;

    const { data: existingGroup } = await supabase
      .from('keyword_groups')
      .select('id')
      .eq('account_id', accountId)
      .eq('name', DEFAULT_GROUP_NAME)
      .single();

    if (existingGroup) {
      generalGroupId = existingGroup.id;
    } else if (!dryRun) {
      const { data: newGroup, error: groupError } = await supabase
        .from('keyword_groups')
        .insert({
          account_id: accountId,
          name: DEFAULT_GROUP_NAME,
          display_order: 0,
        })
        .select('id')
        .single();

      if (groupError) {
        console.error(`  ❌ Failed to create General group:`, groupError.message);
        stats.errors.push(`Account ${accountId}: Failed to create group`);
        continue;
      }
      generalGroupId = newGroup!.id;
      console.log(`  ✅ Created General group`);
    } else {
      generalGroupId = 'dry-run-group-id';
      console.log(`  [DRY RUN] Would create General group`);
    }

    // Collect all unique keywords for this account
    const allKeywordsMap = new Map<string, { phrase: string; normalized: string }>();

    for (const page of pages) {
      const keywords = page.keywords as string[];
      if (!Array.isArray(keywords)) continue;

      for (const phrase of keywords) {
        if (!phrase || !phrase.trim()) continue;
        const trimmed = phrase.trim();
        const normalized = normalizePhrase(trimmed);
        if (!allKeywordsMap.has(normalized)) {
          allKeywordsMap.set(normalized, { phrase: trimmed, normalized });
        }
      }
    }

    console.log(`  Found ${allKeywordsMap.size} unique keywords`);

    // Get existing keywords for this account
    const { data: existingKeywords } = await supabase
      .from('keywords')
      .select('id, normalized_phrase')
      .eq('account_id', accountId)
      .in('normalized_phrase', Array.from(allKeywordsMap.keys()));

    const existingKeywordMap = new Map(
      (existingKeywords || []).map(k => [k.normalized_phrase, k.id])
    );

    // Create keywords that don't exist
    const keywordsToCreate = Array.from(allKeywordsMap.values())
      .filter(k => !existingKeywordMap.has(k.normalized));

    if (keywordsToCreate.length > 0) {
      if (!dryRun) {
        const { data: createdKeywords, error: createError } = await supabase
          .from('keywords')
          .insert(
            keywordsToCreate.map(k => ({
              account_id: accountId,
              group_id: generalGroupId,
              phrase: k.phrase,
              normalized_phrase: k.normalized,
              word_count: calculateWordCount(k.phrase),
              status: 'active',
              ai_generated: false,
            }))
          )
          .select('id, normalized_phrase');

        if (createError) {
          console.error(`  ❌ Failed to create keywords:`, createError.message);
          stats.errors.push(`Account ${accountId}: Failed to create keywords`);
          continue;
        }

        for (const k of createdKeywords || []) {
          existingKeywordMap.set(k.normalized_phrase, k.id);
        }
        stats.keywordsCreated += keywordsToCreate.length;
        console.log(`  ✅ Created ${keywordsToCreate.length} keywords`);
      } else {
        console.log(`  [DRY RUN] Would create ${keywordsToCreate.length} keywords:`);
        for (const k of keywordsToCreate.slice(0, 5)) {
          console.log(`    - "${k.phrase}"`);
        }
        if (keywordsToCreate.length > 5) {
          console.log(`    ... and ${keywordsToCreate.length - 5} more`);
        }
      }
    }

    // Process each page for junction records
    for (const page of pages) {
      const keywords = page.keywords as string[];
      if (!Array.isArray(keywords) || keywords.length === 0) continue;

      stats.promptPagesProcessed++;

      // Get existing junctions for this page
      const { data: existingJunctions } = await supabase
        .from('keyword_prompt_page_usage')
        .select('keyword_id')
        .eq('prompt_page_id', page.id)
        .eq('account_id', accountId);

      const existingJunctionKeywordIds = new Set(
        (existingJunctions || []).map(j => j.keyword_id)
      );

      // Create junctions for keywords not yet linked
      const junctionsToCreate: { account_id: string; keyword_id: string; prompt_page_id: string; is_in_active_pool: boolean; display_order: number }[] = [];

      for (let i = 0; i < keywords.length; i++) {
        const phrase = keywords[i];
        if (!phrase || !phrase.trim()) continue;

        const normalized = normalizePhrase(phrase.trim());
        const keywordId = existingKeywordMap.get(normalized);

        if (keywordId && !existingJunctionKeywordIds.has(keywordId)) {
          junctionsToCreate.push({
            account_id: accountId,
            keyword_id: keywordId,
            prompt_page_id: page.id,
            is_in_active_pool: true,
            display_order: i,
          });
        }
      }

      if (junctionsToCreate.length > 0) {
        if (!dryRun) {
          const { error: junctionError } = await supabase
            .from('keyword_prompt_page_usage')
            .insert(junctionsToCreate);

          if (junctionError) {
            console.error(`  ❌ Failed to create junctions for page ${page.slug}:`, junctionError.message);
            stats.errors.push(`Page ${page.id}: Failed to create junctions`);
          } else {
            stats.junctionsCreated += junctionsToCreate.length;
          }
        } else {
          console.log(`  [DRY RUN] Would create ${junctionsToCreate.length} junctions for page "${page.slug}"`);
        }
      }
    }
  }

  return stats;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');

  if (!args.includes('--dry-run') && !args.includes('--execute')) {
    console.log(`
Usage:
  npx ts-node scripts/migrate-prompt-page-keywords.ts --dry-run    # Preview changes
  npx ts-node scripts/migrate-prompt-page-keywords.ts --execute    # Apply changes
`);
    process.exit(0);
  }

  try {
    const stats = await migrateKeywords(dryRun);

    console.log('\n' + '='.repeat(50));
    console.log('Migration Summary');
    console.log('='.repeat(50));
    console.log(`Mode: ${dryRun ? 'DRY RUN (no changes made)' : 'EXECUTE'}`);
    console.log(`Prompt Pages Processed: ${stats.promptPagesProcessed}`);
    console.log(`Keywords Created: ${stats.keywordsCreated}`);
    console.log(`Junctions Created: ${stats.junctionsCreated}`);

    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Errors (${stats.errors.length}):`);
      for (const error of stats.errors) {
        console.log(`  - ${error}`);
      }
    } else {
      console.log('\n✅ No errors');
    }

    if (dryRun) {
      console.log('\n💡 Run with --execute to apply these changes.');
    } else {
      console.log('\n✅ Migration complete!');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
