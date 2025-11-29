"use server";

import type { SupabaseClient } from '@supabase/supabase-js';

type SupabaseServiceClient = SupabaseClient<any, 'public', any>;

type PromptPageKeywordImportOptions = {
  setName?: string;
  createdBy?: string;
};

export interface PromptPageKeywordImportResult {
  created: boolean;
  keywordSetId?: string;
  keywordCount: number;
  skippedCount: number;
  message: string;
}

const normalize = (phrase: string): string =>
  phrase
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

export async function importPromptPageKeywords(
  supabase: SupabaseServiceClient,
  accountId: string,
  options: PromptPageKeywordImportOptions = {}
): Promise<PromptPageKeywordImportResult> {
  const { data, error } = await supabase
    .from('prompt_pages')
    .select('id, keywords')
    .eq('account_id', accountId);

  if (error) {
    console.error('❌ Failed to fetch prompt pages for keyword import:', error);
    throw new Error(error.message);
  }

  const dedup = new Map<string, string>();

  for (const page of data || []) {
    const keywords: string[] | null = page.keywords || null;
    if (!Array.isArray(keywords)) continue;

    for (const raw of keywords) {
      if (!raw) continue;
      const normalized = normalize(raw);
      if (!normalized) continue;
      if (!dedup.has(normalized)) {
        dedup.set(normalized, raw.trim());
      }
    }
  }

  if (dedup.size === 0) {
    return {
      created: false,
      keywordCount: 0,
      skippedCount: 0,
      message: 'No keywords found on Prompt Pages for this account.'
    };
  }

  const setName =
    options.setName ||
    `Prompt Page Keywords (${new Date().toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    })})`;

  const { data: newSet, error: setError } = await supabase
    .from('keyword_sets')
    .insert({
      account_id: accountId,
      name: setName,
      scope_type: 'account',
      created_by: options.createdBy || null,
      is_active: true
    })
    .select('id')
    .single();

  if (setError || !newSet) {
    console.error('❌ Failed to create keyword set from Prompt Pages:', setError);
    throw new Error(setError?.message || 'Failed to create keyword set');
  }

  const termRows = Array.from(dedup.entries()).map(([normalizedPhrase, originalPhrase]) => ({
    keyword_set_id: newSet.id,
    phrase: originalPhrase,
    normalized_phrase: normalizedPhrase
  }));

  const { error: insertError } = await supabase
    .from('keyword_set_terms')
    .insert(termRows);

  if (insertError) {
    console.error('❌ Failed to insert keyword set terms:', insertError);
    throw new Error(insertError.message);
  }

  return {
    created: true,
    keywordSetId: newSet.id,
    keywordCount: termRows.length,
    skippedCount: dedup.size - termRows.length,
    message: `Imported ${termRows.length} keywords from Prompt Pages into "${setName}".`
  };
}
