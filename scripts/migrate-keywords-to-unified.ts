/**
 * Keyword Migration Script - Phase 2
 *
 * Migrates existing keywords from:
 * - prompt_pages.keywords[] (array of strings)
 * - businesses.keywords[] (array of strings)
 *
 * To the new unified keyword system:
 * - keyword_groups (creates "General" group per account)
 * - keywords (normalized, deduplicated)
 * - keyword_prompt_page_usage (junction records)
 *
 * Usage:
 *   npx ts-node scripts/migrate-keywords-to-unified.ts --dry-run
 *   npx ts-node scripts/migrate-keywords-to-unified.ts --execute
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load production environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.production') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const DEFAULT_GROUP_NAME = 'General';

interface PromptPageKeywords {
  id: string;
  account_id: string;
  slug: string;
  keywords: string[] | null;
}

interface BusinessKeywords {
  id: string;
  account_id: string;
  name: string;
  keywords: string[] | null;
}

interface MigrationStats {
  accountsProcessed: number;
  groupsCreated: number;
  keywordsCreated: number;
  keywordsDeduplicated: number;
  promptPageUsageCreated: number;
  errors: string[];
}

function normalizePhrase(phrase: string): string {
  return phrase.toLowerCase().trim().replace(/\s+/g, ' ');
}

function calculateWordCount(phrase: string): number {
  const trimmed = phrase.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

async function analyzeCurrentData(): Promise<void> {
  console.log('\n📊 Analyzing current keyword data...\n');

  // Check prompt_pages with keywords
  const { data: promptPages, error: ppError } = await supabase
    .from('prompt_pages')
    .select('id, account_id, slug, keywords')
    .not('keywords', 'is', null);

  if (ppError) {
    console.error('Error fetching prompt_pages:', ppError);
    return;
  }

  const promptPagesWithKeywords = (promptPages || []).filter(
    (pp: PromptPageKeywords) => pp.keywords && pp.keywords.length > 0
  );

  console.log(`📄 Prompt pages with keywords: ${promptPagesWithKeywords.length}`);

  // Check businesses with keywords
  const { data: businesses, error: bizError } = await supabase
    .from('businesses')
    .select('id, account_id, name, keywords')
    .not('keywords', 'is', null);

  if (bizError) {
    console.error('Error fetching businesses:', bizError);
    return;
  }

  const businessesWithKeywords = (businesses || []).filter(
    (b: BusinessKeywords) => b.keywords && b.keywords.length > 0
  );

  console.log(`🏢 Businesses with keywords: ${businessesWithKeywords.length}`);

  // Collect unique accounts
  const accountIds = new Set<string>();
  promptPagesWithKeywords.forEach((pp: PromptPageKeywords) => accountIds.add(pp.account_id));
  businessesWithKeywords.forEach((b: BusinessKeywords) => accountIds.add(b.account_id));

  console.log(`👥 Unique accounts with keywords: ${accountIds.size}`);

  // Count total keywords and unique keywords per account
  let totalKeywords = 0;
  let uniqueKeywords = 0;
  const keywordsByAccount: Record<string, Set<string>> = {};

  for (const pp of promptPagesWithKeywords) {
    if (!keywordsByAccount[pp.account_id]) {
      keywordsByAccount[pp.account_id] = new Set();
    }
    for (const kw of pp.keywords || []) {
      totalKeywords++;
      keywordsByAccount[pp.account_id].add(normalizePhrase(kw));
    }
  }

  for (const b of businessesWithKeywords) {
    if (!keywordsByAccount[b.account_id]) {
      keywordsByAccount[b.account_id] = new Set();
    }
    for (const kw of b.keywords || []) {
      totalKeywords++;
      keywordsByAccount[b.account_id].add(normalizePhrase(kw));
    }
  }

  for (const accountId of Object.keys(keywordsByAccount)) {
    uniqueKeywords += keywordsByAccount[accountId].size;
  }

  console.log(`\n📝 Total keyword entries: ${totalKeywords}`);
  console.log(`🔑 Unique keywords (after normalization): ${uniqueKeywords}`);
  console.log(`📉 Duplicates to be merged: ${totalKeywords - uniqueKeywords}`);

  // Show sample keywords
  if (promptPagesWithKeywords.length > 0) {
    console.log('\n📋 Sample prompt page keywords:');
    for (const pp of promptPagesWithKeywords.slice(0, 3)) {
      console.log(`  - ${pp.slug}: ${(pp.keywords || []).slice(0, 5).join(', ')}${(pp.keywords || []).length > 5 ? '...' : ''}`);
    }
  }

  if (businessesWithKeywords.length > 0) {
    console.log('\n📋 Sample business keywords:');
    for (const b of businessesWithKeywords.slice(0, 3)) {
      console.log(`  - ${b.name}: ${(b.keywords || []).slice(0, 5).join(', ')}${(b.keywords || []).length > 5 ? '...' : ''}`);
    }
  }

  // Check existing unified tables
  const { count: existingGroups } = await supabase
    .from('keyword_groups')
    .select('*', { count: 'exact', head: true });

  const { count: existingKeywords } = await supabase
    .from('keywords')
    .select('*', { count: 'exact', head: true });

  const { count: existingUsage } = await supabase
    .from('keyword_prompt_page_usage')
    .select('*', { count: 'exact', head: true });

  console.log('\n📦 Current unified system data:');
  console.log(`  - keyword_groups: ${existingGroups || 0}`);
  console.log(`  - keywords: ${existingKeywords || 0}`);
  console.log(`  - keyword_prompt_page_usage: ${existingUsage || 0}`);
}

async function migrateKeywords(dryRun: boolean): Promise<MigrationStats> {
  const stats: MigrationStats = {
    accountsProcessed: 0,
    groupsCreated: 0,
    keywordsCreated: 0,
    keywordsDeduplicated: 0,
    promptPageUsageCreated: 0,
    errors: [],
  };

  console.log(`\n🚀 ${dryRun ? '[DRY RUN] ' : ''}Starting keyword migration...\n`);

  // Step 1: Get all prompt pages with keywords
  const { data: promptPages, error: ppError } = await supabase
    .from('prompt_pages')
    .select('id, account_id, slug, keywords')
    .not('keywords', 'is', null);

  if (ppError) {
    stats.errors.push(`Error fetching prompt_pages: ${ppError.message}`);
    return stats;
  }

  const promptPagesWithKeywords = (promptPages || []).filter(
    (pp: PromptPageKeywords) => pp.keywords && pp.keywords.length > 0
  );

  // Step 2: Get all businesses with keywords
  const { data: businesses, error: bizError } = await supabase
    .from('businesses')
    .select('id, account_id, name, keywords')
    .not('keywords', 'is', null);

  if (bizError) {
    stats.errors.push(`Error fetching businesses: ${bizError.message}`);
    return stats;
  }

  const businessesWithKeywords = (businesses || []).filter(
    (b: BusinessKeywords) => b.keywords && b.keywords.length > 0
  );

  // Step 3: Collect all unique account IDs
  const accountIds = new Set<string>();
  promptPagesWithKeywords.forEach((pp: PromptPageKeywords) => accountIds.add(pp.account_id));
  businessesWithKeywords.forEach((b: BusinessKeywords) => accountIds.add(b.account_id));

  console.log(`📊 Found ${accountIds.size} accounts with keywords to migrate`);

  // Step 4: Process each account
  for (const accountId of accountIds) {
    console.log(`\n👤 Processing account: ${accountId}`);
    stats.accountsProcessed++;

    // Create or get "General" group for this account
    let generalGroupId: string;

    const { data: existingGroup } = await supabase
      .from('keyword_groups')
      .select('id')
      .eq('account_id', accountId)
      .eq('name', DEFAULT_GROUP_NAME)
      .maybeSingle();

    if (existingGroup) {
      generalGroupId = existingGroup.id;
      console.log(`  ✓ Found existing General group: ${generalGroupId}`);
    } else {
      if (!dryRun) {
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
          stats.errors.push(`Error creating group for ${accountId}: ${groupError.message}`);
          continue;
        }
        generalGroupId = newGroup.id;
      } else {
        generalGroupId = 'dry-run-group-id';
      }
      stats.groupsCreated++;
      console.log(`  + Created General group: ${generalGroupId}`);
    }

    // Collect all keywords for this account (from both sources)
    const keywordMap: Map<string, { phrase: string; promptPageIds: Set<string> }> = new Map();

    // From prompt pages
    const accountPromptPages = promptPagesWithKeywords.filter(
      (pp: PromptPageKeywords) => pp.account_id === accountId
    );
    for (const pp of accountPromptPages) {
      for (const kw of pp.keywords || []) {
        const normalized = normalizePhrase(kw);
        if (!keywordMap.has(normalized)) {
          keywordMap.set(normalized, { phrase: kw.trim(), promptPageIds: new Set() });
        }
        keywordMap.get(normalized)!.promptPageIds.add(pp.id);
      }
    }

    // From businesses (these won't have prompt page associations)
    const accountBusinesses = businessesWithKeywords.filter(
      (b: BusinessKeywords) => b.account_id === accountId
    );
    for (const b of accountBusinesses) {
      for (const kw of b.keywords || []) {
        const normalized = normalizePhrase(kw);
        if (!keywordMap.has(normalized)) {
          keywordMap.set(normalized, { phrase: kw.trim(), promptPageIds: new Set() });
        }
        // Business keywords don't associate with specific prompt pages
      }
    }

    const totalKeywords = Array.from(keywordMap.values()).reduce(
      (sum, v) => sum + 1,
      0
    );
    const duplicatesSkipped =
      accountPromptPages.reduce((sum, pp) => sum + (pp.keywords?.length || 0), 0) +
      accountBusinesses.reduce((sum, b) => sum + (b.keywords?.length || 0), 0) -
      totalKeywords;

    stats.keywordsDeduplicated += duplicatesSkipped;
    console.log(`  📝 Found ${keywordMap.size} unique keywords (${duplicatesSkipped} duplicates merged)`);

    // Insert keywords and create usage records
    for (const [normalized, data] of keywordMap) {
      // Check if keyword already exists
      const { data: existingKeyword } = await supabase
        .from('keywords')
        .select('id')
        .eq('account_id', accountId)
        .eq('normalized_phrase', normalized)
        .maybeSingle();

      let keywordId: string;

      if (existingKeyword) {
        keywordId = existingKeyword.id;
        console.log(`  ✓ Keyword exists: "${data.phrase}"`);
      } else {
        if (!dryRun) {
          const { data: newKeyword, error: kwError } = await supabase
            .from('keywords')
            .insert({
              account_id: accountId,
              group_id: generalGroupId,
              phrase: data.phrase,
              normalized_phrase: normalized,
              word_count: calculateWordCount(data.phrase),
              status: 'active',
              review_usage_count: 0,
            })
            .select('id')
            .single();

          if (kwError) {
            stats.errors.push(`Error creating keyword "${data.phrase}": ${kwError.message}`);
            continue;
          }
          keywordId = newKeyword.id;
        } else {
          keywordId = 'dry-run-keyword-id';
        }
        stats.keywordsCreated++;
        console.log(`  + Created keyword: "${data.phrase}" (${calculateWordCount(data.phrase)} words)`);
      }

      // Create prompt page usage records
      for (const promptPageId of data.promptPageIds) {
        // Check if usage record exists
        const { data: existingUsage } = await supabase
          .from('keyword_prompt_page_usage')
          .select('id')
          .eq('keyword_id', keywordId)
          .eq('prompt_page_id', promptPageId)
          .maybeSingle();

        if (!existingUsage) {
          if (!dryRun) {
            const { error: usageError } = await supabase
              .from('keyword_prompt_page_usage')
              .insert({
                keyword_id: keywordId,
                prompt_page_id: promptPageId,
                account_id: accountId,
              });

            if (usageError) {
              stats.errors.push(
                `Error creating usage for keyword "${data.phrase}" -> page ${promptPageId}: ${usageError.message}`
              );
              continue;
            }
          }
          stats.promptPageUsageCreated++;
        }
      }
    }
  }

  return stats;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const execute = args.includes('--execute');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Unified Keyword System Migration Script');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Database: ${SUPABASE_URL}`);
  console.log(`  Mode: ${dryRun ? 'DRY RUN (no changes)' : execute ? 'EXECUTE (will modify data)' : 'ANALYZE ONLY'}`);
  console.log('═══════════════════════════════════════════════════════════');

  // Always analyze first
  await analyzeCurrentData();

  if (!dryRun && !execute) {
    console.log('\n📌 To preview changes, run with: --dry-run');
    console.log('📌 To execute migration, run with: --execute');
    return;
  }

  const stats = await migrateKeywords(dryRun);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Migration Summary');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Accounts processed: ${stats.accountsProcessed}`);
  console.log(`  Groups created: ${stats.groupsCreated}`);
  console.log(`  Keywords created: ${stats.keywordsCreated}`);
  console.log(`  Duplicates merged: ${stats.keywordsDeduplicated}`);
  console.log(`  Prompt page usages created: ${stats.promptPageUsageCreated}`);

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors (${stats.errors.length}):`);
    for (const error of stats.errors) {
      console.log(`  - ${error}`);
    }
  }

  if (dryRun) {
    console.log('\n✨ Dry run complete. Run with --execute to apply changes.');
  } else if (execute) {
    console.log('\n✅ Migration complete!');
  }
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
