import { NextResponse, NextRequest } from 'next/server';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';
import { normalizePhrase, calculateWordCount, DEFAULT_GROUP_NAME } from '@/features/keywords/keywordUtils';

// Service client for privileged operations
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/keywords/upload
 *
 * Uploads keyword concepts from a CSV file.
 * - Creates keywords in the keywords table
 * - Optionally assigns to keyword groups (creates if needed)
 * - Optionally adds to rank tracking groups
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'No valid account found or access denied' }, { status: 403 });
    }

    // Get the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read and parse the CSV file
    const text = await file.text();

    // Split into lines and clean them
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter(
        (line) =>
          line.length > 0 &&
          !line.startsWith('#') && // Skip comment lines
          line.split(',').some((cell) => cell.trim().length > 0)
      );

    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file must have a header row and at least one data row' }, { status: 400 });
    }

    // Define expected columns and their aliases
    const expectedColumns: Record<string, string[]> = {
      phrase: ['phrase', 'keyword', 'keywordphrase', 'keyword phrase', 'conceptname', 'concept name', 'concept_name'],
      review_phrase: ['reviewphrase', 'review phrase', 'review_phrase', 'customerphrase', 'customer phrase'],
      search_terms: ['searchterms', 'search terms', 'search_terms'],
      search_query: ['searchquery', 'search query', 'search_query', 'searchphrase', 'search phrase'],
      aliases: ['aliases', 'alias', 'alternativeterms', 'alternative terms'],
      location_scope: ['locationscope', 'location scope', 'location_scope', 'scope'],
      ai_questions: ['aiquestions', 'ai questions', 'ai_questions', 'relatedquestions', 'related questions', 'related_questions', 'questions'],
      funnel_stages: ['funnelstages', 'funnel stages', 'funnel_stages', 'stages'],
      keyword_group: ['keywordgroup', 'keyword group', 'keyword_group', 'group'],
      rank_tracking_group: ['ranktrackinggroup', 'rank tracking group', 'rank_tracking_group', 'rankgroup', 'rank group'],
    };

    // Parse the CSV with flexible header matching
    const records = parse(lines.join('\n'), {
      columns: (headers: string[]) => {
        const normalize = (h: string) => h.toLowerCase().replace(/\s|_/g, '');
        return headers.map((header: string, index: number) => {
          const norm = normalize(header);
          for (const [key, aliases] of Object.entries(expectedColumns)) {
            if (aliases.includes(norm)) return key;
          }
          return `_extra_${index}`;
        });
      },
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true,
      quote: '"',
      escape: '"',
      delimiter: ',',
      skip_records_with_empty_values: false, // Don't skip - we'll validate ourselves
    });

    // Validation and processing
    const errors: string[] = [];
    const keywordsToInsert: any[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 2; // +2 because: 1-indexed + header row

      // Clean up record values
      Object.keys(record).forEach((k) => {
        if (record[k] && typeof record[k] === 'string') {
          record[k] = record[k].trim();
        }
      });

      // Validate required fields
      if (!record.phrase || record.phrase.trim() === '') {
        errors.push(`Row ${rowNumber}: Phrase is required`);
        continue;
      }

      // Parse aliases (supports pipe or comma separated)
      const aliases = record.aliases
        ? record.aliases.split(/[|,]/).map((a: string) => a.trim()).filter(Boolean)
        : [];

      // Parse search_terms (pipe-delimited: term1|term2|term3)
      const searchTerms = record.search_terms
        ? record.search_terms.split('|').map((t: string, index: number) => ({
            term: t.trim(),
            is_canonical: index === 0,
            added_at: new Date().toISOString(),
          })).filter((st: any) => st.term.length > 0)
        : [];

      // Parse ai_questions and funnel_stages as separate columns (pipe-separated)
      // New format: ai_questions = "Q1|Q2|Q3", funnel_stages = "top|middle|bottom"
      // Also supports old combined format for backwards compatibility
      const relatedQuestionsWithStage: Array<{ question: string; funnel_stage: string }> = [];

      if (record.ai_questions) {
        const questions = record.ai_questions.split('|').map((q: string) => q.trim()).filter(Boolean);
        const stages = record.funnel_stages
          ? record.funnel_stages.split('|').map((s: string) => s.trim())
          : [];

        for (let i = 0; i < questions.length; i++) {
          const question = questions[i];
          let funnelStage = stages[i] || 'middle';
          // Validate funnel stage
          if (!['top', 'middle', 'bottom'].includes(funnelStage)) {
            funnelStage = 'middle';
          }
          relatedQuestionsWithStage.push({ question, funnel_stage: funnelStage });
        }
      }

      // Validate location_scope if provided
      const validScopes = ['local', 'regional', 'national', 'global'];
      let locationScope = record.location_scope?.toLowerCase() || null;
      if (locationScope && !validScopes.includes(locationScope)) {
        errors.push(`Row ${rowNumber}: Invalid location_scope. Must be one of: ${validScopes.join(', ')}`);
        continue;
      }

      keywordsToInsert.push({
        phrase: record.phrase.trim(),
        review_phrase: record.review_phrase?.trim() || null,
        search_query: record.search_query?.trim() || null,
        search_terms: searchTerms,
        aliases,
        location_scope: locationScope,
        related_questions: relatedQuestionsWithStage,
        keyword_group: record.keyword_group?.trim() || null,
        rank_tracking_group: record.rank_tracking_group?.trim() || null,
        rowNumber,
      });
    }

    // If all rows had errors, return early
    if (keywordsToInsert.length === 0) {
      return NextResponse.json({
        error: 'No valid keywords to import',
        errors,
      }, { status: 400 });
    }

    // Check for duplicates - fetch existing keywords for this account
    const { data: existingKeywords } = await serviceSupabase
      .from('keywords')
      .select('normalized_phrase')
      .eq('account_id', accountId);

    const existingPhraseSet = new Set(
      existingKeywords?.map(k => k.normalized_phrase?.toLowerCase()).filter(Boolean) || []
    );

    // Filter out duplicates
    const uniqueKeywords: typeof keywordsToInsert = [];
    let duplicatesSkipped = 0;
    const skippedPhrases: string[] = [];

    for (const keyword of keywordsToInsert) {
      const normalizedPhrase = normalizePhrase(keyword.phrase);
      if (existingPhraseSet.has(normalizedPhrase.toLowerCase())) {
        duplicatesSkipped++;
        skippedPhrases.push(keyword.phrase);
        errors.push(`Row ${keyword.rowNumber}: Duplicate keyword "${keyword.phrase}" skipped`);
      } else {
        uniqueKeywords.push({ ...keyword, normalizedPhrase });
        existingPhraseSet.add(normalizedPhrase.toLowerCase());
      }
    }

    // If all keywords were duplicates
    if (uniqueKeywords.length === 0) {
      return NextResponse.json({
        message: 'No new keywords to import',
        keywordsCreated: 0,
        duplicatesSkipped,
        skippedPhrases,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    // Get existing keyword groups for this account
    const { data: existingGroups } = await serviceSupabase
      .from('keyword_groups')
      .select('id, name')
      .eq('account_id', accountId);

    const groupMap = new Map<string, string>();
    existingGroups?.forEach(g => {
      groupMap.set(g.name.toLowerCase(), g.id);
    });

    // Get existing rank tracking groups for this account
    const { data: existingRankGroups } = await serviceSupabase
      .from('rank_keyword_groups')
      .select('id, name')
      .eq('account_id', accountId);

    const rankGroupMap = new Map<string, string>();
    existingRankGroups?.forEach(g => {
      rankGroupMap.set(g.name.toLowerCase(), g.id);
    });

    // Ensure "General" group exists
    if (!groupMap.has(DEFAULT_GROUP_NAME.toLowerCase())) {
      const { data: newGroup, error: groupError } = await serviceSupabase
        .from('keyword_groups')
        .insert({
          account_id: accountId,
          name: DEFAULT_GROUP_NAME,
          display_order: 0,
        })
        .select('id')
        .single();

      if (!groupError && newGroup) {
        groupMap.set(DEFAULT_GROUP_NAME.toLowerCase(), newGroup.id);
      }
    }

    // Create any new keyword groups needed
    const neededGroups = new Set(
      uniqueKeywords
        .map(k => k.keyword_group?.toLowerCase())
        .filter(Boolean)
    );

    for (const groupName of neededGroups) {
      if (!groupMap.has(groupName)) {
        const originalName = uniqueKeywords.find(
          k => k.keyword_group?.toLowerCase() === groupName
        )?.keyword_group;

        const { data: newGroup, error: groupError } = await serviceSupabase
          .from('keyword_groups')
          .insert({
            account_id: accountId,
            name: originalName,
            display_order: groupMap.size,
          })
          .select('id')
          .single();

        if (!groupError && newGroup) {
          groupMap.set(groupName, newGroup.id);
        }
      }
    }

    // Insert keywords
    const keywordInserts = uniqueKeywords.map(k => ({
      account_id: accountId,
      group_id: k.keyword_group
        ? groupMap.get(k.keyword_group.toLowerCase())
        : groupMap.get(DEFAULT_GROUP_NAME.toLowerCase()),
      phrase: k.phrase,
      normalized_phrase: k.normalizedPhrase,
      word_count: calculateWordCount(k.phrase),
      status: 'active',
      review_usage_count: 0,
      review_phrase: k.review_phrase,
      search_query: k.search_query,
      search_terms: k.search_terms,
      aliases: k.aliases,
      location_scope: k.location_scope,
      related_questions: k.related_questions,
      ai_generated: false,
    }));

    const { data: insertedKeywords, error: insertError } = await serviceSupabase
      .from('keywords')
      .insert(keywordInserts)
      .select('id, phrase');

    if (insertError) {
      console.error('Error inserting keywords:', insertError);
      return NextResponse.json({
        error: `Failed to save keywords: ${insertError.message}`,
        details: insertError.details,
      }, { status: 500 });
    }

    // Insert keyword questions into the keyword_questions table
    let questionsCreated = 0;
    if (insertedKeywords) {
      for (let i = 0; i < uniqueKeywords.length; i++) {
        const keyword = uniqueKeywords[i];
        const insertedKeyword = insertedKeywords[i];

        if (keyword.related_questions && keyword.related_questions.length > 0 && insertedKeyword) {
          const questionInserts = keyword.related_questions.map((q: any) => ({
            account_id: accountId,
            keyword_id: insertedKeyword.id,
            question: q.question,
            funnel_stage: q.funnel_stage,
            added_at: new Date().toISOString(),
          }));

          const { error: questionsError } = await serviceSupabase
            .from('keyword_questions')
            .insert(questionInserts);

          if (!questionsError) {
            questionsCreated += questionInserts.length;
          }
        }
      }
    }

    // Track rank tracking group additions
    let rankGroupsLinked = 0;

    // Add keywords to rank tracking groups if specified
    if (insertedKeywords) {
      for (let i = 0; i < uniqueKeywords.length; i++) {
        const keyword = uniqueKeywords[i];
        const insertedKeyword = insertedKeywords[i];

        if (keyword.rank_tracking_group && insertedKeyword) {
          const rankGroupId = rankGroupMap.get(keyword.rank_tracking_group.toLowerCase());
          if (rankGroupId) {
            // Check if already linked
            const { data: existing } = await serviceSupabase
              .from('rank_group_keywords')
              .select('id')
              .eq('group_id', rankGroupId)
              .eq('keyword_id', insertedKeyword.id)
              .maybeSingle();

            if (!existing) {
              const { error: linkError } = await serviceSupabase
                .from('rank_group_keywords')
                .insert({
                  account_id: accountId,
                  group_id: rankGroupId,
                  keyword_id: insertedKeyword.id,
                  is_enabled: true,
                });

              if (!linkError) {
                rankGroupsLinked++;
              }
            }
          } else {
            errors.push(`Row ${keyword.rowNumber}: Rank tracking group "${keyword.rank_tracking_group}" not found`);
          }
        }
      }
    }

    return NextResponse.json({
      message: 'Successfully uploaded keywords',
      keywordsCreated: insertedKeywords?.length || 0,
      duplicatesSkipped,
      skippedPhrases,
      rankGroupsLinked,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Error processing keyword upload:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/keywords/upload
 *
 * Returns a CSV template for keyword uploads
 * Includes user's keyword groups and rank tracking groups in comments
 */
export async function GET(request: NextRequest) {
  // Try to get user's groups if authenticated
  let keywordGroups: string[] = [];
  let rankGroups: string[] = [];

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const accountId = await getRequestAccountId(request, user.id, supabase);
      if (accountId) {
        const { data: groups } = await serviceSupabase
          .from('keyword_groups')
          .select('name')
          .eq('account_id', accountId);
        if (groups) {
          keywordGroups = groups.map(g => g.name).filter(Boolean);
        }

        const { data: rankGroupsData } = await serviceSupabase
          .from('rank_keyword_groups')
          .select('name')
          .eq('account_id', accountId);
        if (rankGroupsData) {
          rankGroups = rankGroupsData.map(g => g.name).filter(Boolean);
        }
      }
    }
  } catch {
    // Unauthenticated - just provide generic template
  }

  const headers = [
    'concept_name',
    'review_phrase',
    'aliases',
    'search_terms',
    'ai_questions',
    'funnel_stages',
    'keyword_group',
    'rank_tracking_group',
  ];

  // Build example rows (no comments - they cause issues in spreadsheets)
  const exampleRows = [
    [
      'portland plumber',
      'plumbing services',
      'plumber|plumbing',
      'plumber portland oregon|best plumber portland',
      'How much does a plumber cost?|What are the best plumbers near me?',
      'top|middle',
      keywordGroups[0] || 'Services',
      rankGroups[0] || '',
    ],
    [
      'emergency plumbing',
      'emergency plumbing help',
      '24 hour plumber|urgent plumbing',
      'emergency plumber near me|24/7 plumber',
      'Who to call for plumbing emergency?',
      'top',
      keywordGroups[0] || 'Services',
      '',
    ],
    [
      'drain cleaning',
      'professional drain cleaning',
      'clogged drain|drain unclogging',
      'drain cleaning service portland',
      '',
      '',
      '',
      '',
    ],
  ];

  const csvContent = [
    '# Only concept_name is required. All other columns are optional.',
    headers.join(','),
    ...exampleRows.map((row) => row.map(escapeCSVField).join(',')),
  ].join('\n');

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="keyword-concepts-template.csv"',
    },
  });
}

function escapeCSVField(field: string): string {
  if (!field) return '';
  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('|')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}
