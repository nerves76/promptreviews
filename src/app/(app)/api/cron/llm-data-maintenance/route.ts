/**
 * Cron Job: LLM Data Maintenance
 *
 * Prunes bulky columns from old llm_visibility_checks rows to control table size:
 * 1. Null full_response & response_snippet on checks >30 days old
 * 2. Compress search_results (keep only domain + isOurs) on checks 30-90 days old
 * 3. Null search_results entirely on checks >90 days old
 *
 * Valuable long-term data is preserved forever: domain_cited, brand_mentioned,
 * citation_position, citation_url, total_citations, citations, mentioned_brands,
 * fan_out_queries, question, llm_provider, checked_at, api_cost_usd.
 *
 * Runs daily via the 8 AM dispatcher. Batched to stay within Vercel's 30s timeout.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logCronExecution, verifyCronSecret } from '@/lib/cronLogger';

const BATCH_SIZE_SQL = 5000;
const BATCH_SIZE_JSONB = 500;

interface SearchResultEntry {
  domain?: string;
  isOurs?: boolean;
  title?: string;
  description?: string;
  url?: string;
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  return logCronExecution('llm-data-maintenance', async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const ninetyDaysAgoISO = ninetyDaysAgo.toISOString();

    let nulledTextCount = 0;
    let compressedSearchCount = 0;
    let nulledSearchCount = 0;

    // ── Step 1: Null full_response & response_snippet on checks >30 days ──
    try {
      const { count, error } = await supabase
        .from('llm_visibility_checks')
        .update(
          { full_response: null, response_snippet: null },
          { count: 'exact' }
        )
        .lt('checked_at', thirtyDaysAgoISO)
        .or('full_response.not.is.null,response_snippet.not.is.null')
        .limit(BATCH_SIZE_SQL);

      if (error) {
        console.error('[LLM Maintenance] Error nulling text columns:', error);
      } else {
        nulledTextCount = count || 0;
        console.log(`[LLM Maintenance] Nulled text on ${nulledTextCount} rows`);
      }
    } catch (err) {
      console.error('[LLM Maintenance] Exception nulling text columns:', err);
    }

    // ── Step 2: Compress search_results (30-90 days) ──
    // Keep only domain + isOurs from each entry
    try {
      const { data: rows, error: fetchError } = await supabase
        .from('llm_visibility_checks')
        .select('id, search_results')
        .lt('checked_at', thirtyDaysAgoISO)
        .gte('checked_at', ninetyDaysAgoISO)
        .not('search_results', 'is', null)
        .limit(BATCH_SIZE_JSONB);

      if (fetchError) {
        console.error('[LLM Maintenance] Error fetching rows for compression:', fetchError);
      } else if (rows && rows.length > 0) {
        // Filter to rows that actually have compressible data
        const updates: Array<{ id: string; compressed: SearchResultEntry[] }> = [];

        for (const row of rows) {
          const sr = row.search_results as SearchResultEntry[] | null;
          if (!sr || !Array.isArray(sr)) continue;

          // Check if there's anything to strip
          const hasExtraFields = sr.some(
            (entry) => entry.title || entry.description || entry.url
          );
          if (!hasExtraFields) continue;

          const compressed = sr.map((entry) => ({
            domain: entry.domain,
            isOurs: entry.isOurs,
          }));
          updates.push({ id: row.id, compressed });
        }

        // Update each row individually (JSONB can't be batch-updated with different values)
        for (const { id, compressed } of updates) {
          const { error: updateError } = await supabase
            .from('llm_visibility_checks')
            .update({ search_results: compressed })
            .eq('id', id);

          if (updateError) {
            console.error(`[LLM Maintenance] Error compressing row ${id}:`, updateError);
          } else {
            compressedSearchCount++;
          }
        }

        console.log(`[LLM Maintenance] Compressed search_results on ${compressedSearchCount} rows`);
      }
    } catch (err) {
      console.error('[LLM Maintenance] Exception compressing search_results:', err);
    }

    // ── Step 3: Null search_results entirely on checks >90 days ──
    try {
      const { count, error } = await supabase
        .from('llm_visibility_checks')
        .update({ search_results: null }, { count: 'exact' })
        .lt('checked_at', ninetyDaysAgoISO)
        .not('search_results', 'is', null)
        .limit(BATCH_SIZE_SQL);

      if (error) {
        console.error('[LLM Maintenance] Error nulling search_results:', error);
      } else {
        nulledSearchCount = count || 0;
        console.log(`[LLM Maintenance] Nulled search_results on ${nulledSearchCount} rows`);
      }
    } catch (err) {
      console.error('[LLM Maintenance] Exception nulling search_results:', err);
    }

    const totalProcessed = nulledTextCount + compressedSearchCount + nulledSearchCount;

    return {
      success: true,
      summary: {
        nulledTextColumns: nulledTextCount,
        compressedSearchResults: compressedSearchCount,
        nulledSearchResults: nulledSearchCount,
        totalProcessed,
      },
    };
  });
}
