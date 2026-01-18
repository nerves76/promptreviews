/**
 * Cron Job: Process Analysis Batch Runs
 *
 * Processes queued domain and competitor analysis batch runs.
 * Processes a limited number of items per execution to stay within timeout limits.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logCronExecution, verifyCronSecret } from '@/lib/cronLogger';
import OpenAI from 'openai';

// Extend timeout for this route
export const maxDuration = 300; // 5 minutes

// Process up to N items per execution to stay within timeout
const ITEMS_PER_EXECUTION = 10;

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface BatchRunRow {
  id: string;
  account_id: string;
  batch_type: 'domain' | 'competitor';
  status: string;
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  started_at: string | null;
}

interface BatchRunItemRow {
  id: string;
  batch_run_id: string;
  item_type: 'domain' | 'competitor';
  item_key: string;
  item_display_name: string;
  item_metadata: Record<string, any> | null;
  status: string;
}

export async function GET(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  return logCronExecution('process-analysis-batch', async () => {
    // First, clean up any stuck runs (processing for > 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: stuckRuns } = await serviceSupabase
      .from('analysis_batch_runs')
      .select('id')
      .eq('status', 'processing')
      .lt('started_at', fifteenMinutesAgo);

    if (stuckRuns && stuckRuns.length > 0) {
      console.log(`📋 [AnalysisBatch] Found ${stuckRuns.length} stuck runs, marking as failed`);
      for (const stuckRun of stuckRuns) {
        await serviceSupabase
          .from('analysis_batch_runs')
          .update({
            status: 'failed',
            error_message: 'Run timed out after 15 minutes',
            completed_at: new Date().toISOString(),
          })
          .eq('id', stuckRun.id);
      }
    }

    // Find oldest pending or processing batch run
    const { data: batchRun, error: runError } = await serviceSupabase
      .from('analysis_batch_runs')
      .select('*')
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (runError || !batchRun) {
      return { success: true, summary: { message: 'No pending analysis batch runs to process' } };
    }

    const run = batchRun as BatchRunRow;
    console.log(`📋 [AnalysisBatch] Processing ${run.batch_type} batch run ${run.id}`);

    try {
      // Mark as processing if pending
      if (run.status === 'pending') {
        await serviceSupabase
          .from('analysis_batch_runs')
          .update({ status: 'processing', started_at: new Date().toISOString() })
          .eq('id', run.id);
      }

      // Get business data for context (competitor analysis)
      const { data: business } = await serviceSupabase
        .from('businesses')
        .select('name, description, business_website')
        .eq('account_id', run.account_id)
        .single();

      // Get next batch of pending items
      const { data: pendingItems, error: itemsError } = await serviceSupabase
        .from('analysis_batch_run_items')
        .select('*')
        .eq('batch_run_id', run.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(ITEMS_PER_EXECUTION);

      if (itemsError) {
        console.error('❌ [AnalysisBatch] Failed to fetch pending items:', itemsError);
        return { success: false, error: 'Failed to fetch pending items' };
      }

      const items = (pendingItems || []) as BatchRunItemRow[];

      if (items.length === 0) {
        // No more pending items - check if all are done
        await checkAndCompleteBatch(run.id);
        return { success: true, summary: { message: 'No pending items, checked completion' } };
      }

      console.log(`   Processing ${items.length} items...`);

      let successCount = 0;
      let failCount = 0;
      let skipCount = 0;

      // Process each item
      for (const item of items) {
        console.log(`   → ${item.item_type}: "${item.item_display_name}"`);

        // Mark as processing
        await serviceSupabase
          .from('analysis_batch_run_items')
          .update({ status: 'processing', updated_at: new Date().toISOString() })
          .eq('id', item.id);

        try {
          if (item.item_type === 'domain') {
            // Check if already cached
            const { data: cached } = await serviceSupabase
              .from('domain_analysis_cache')
              .select('id')
              .eq('domain', item.item_key)
              .single();

            if (cached) {
              await serviceSupabase
                .from('analysis_batch_run_items')
                .update({ status: 'skipped', updated_at: new Date().toISOString() })
                .eq('id', item.id);
              skipCount++;
              console.log(`   ⊘ Skipped (already cached)`);
              continue;
            }

            // Analyze domain
            const analysis = await analyzeDomain(item.item_key);

            // Cache result
            await serviceSupabase
              .from('domain_analysis_cache')
              .upsert({
                domain: item.item_key,
                difficulty: analysis.difficulty,
                site_type: analysis.siteType,
                strategy: analysis.strategy,
                analyzed_at: new Date().toISOString(),
              }, { onConflict: 'domain' });

            await serviceSupabase
              .from('analysis_batch_run_items')
              .update({ status: 'completed', updated_at: new Date().toISOString() })
              .eq('id', item.id);
            successCount++;
            console.log(`   ✓ Completed`);

          } else {
            // Competitor analysis
            // Check if already cached for this account
            const { data: cached } = await serviceSupabase
              .from('competitor_analysis_cache')
              .select('id')
              .eq('account_id', run.account_id)
              .eq('competitor_name', item.item_key)
              .single();

            if (cached) {
              await serviceSupabase
                .from('analysis_batch_run_items')
                .update({ status: 'skipped', updated_at: new Date().toISOString() })
                .eq('id', item.id);
              skipCount++;
              console.log(`   ⊘ Skipped (already cached)`);
              continue;
            }

            // Analyze competitor
            const analysis = await analyzeCompetitor(
              item.item_display_name,
              item.item_metadata,
              business
            );

            // Cache result
            await serviceSupabase
              .from('competitor_analysis_cache')
              .upsert({
                account_id: run.account_id,
                competitor_name: item.item_key,
                who_they_are: analysis.whoTheyAre,
                why_mentioned: analysis.whyMentioned,
                how_to_differentiate: analysis.howToDifferentiate,
                domain: item.item_metadata?.domains?.[0] || null,
                analyzed_at: new Date().toISOString(),
              }, { onConflict: 'account_id,competitor_name' });

            await serviceSupabase
              .from('analysis_batch_run_items')
              .update({ status: 'completed', updated_at: new Date().toISOString() })
              .eq('id', item.id);
            successCount++;
            console.log(`   ✓ Completed`);
          }

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          await serviceSupabase
            .from('analysis_batch_run_items')
            .update({
              status: 'failed',
              error_message: errorMsg,
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.id);
          failCount++;
          console.error(`   ✗ Error: ${errorMsg}`);
        }
      }

      // Update batch run progress
      const newProcessed = run.processed_items + successCount + failCount + skipCount;
      await serviceSupabase
        .from('analysis_batch_runs')
        .update({
          processed_items: newProcessed,
          successful_items: run.successful_items + successCount + skipCount,
          failed_items: run.failed_items + failCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', run.id);

      // Check if batch is complete
      await checkAndCompleteBatch(run.id);

      return {
        success: true,
        summary: {
          runId: run.id,
          batchType: run.batch_type,
          itemsProcessed: items.length,
          successCount,
          failCount,
          skipCount,
        },
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unexpected error';
      console.error(`❌ [AnalysisBatch] Error processing batch ${run.id}:`, error);
      await markBatchFailed(run.id, errorMessage);
      return { success: false, error: errorMessage };
    }
  });
}

async function analyzeDomain(domain: string): Promise<{
  difficulty: 'easy' | 'medium' | 'hard';
  siteType: string;
  strategy: string;
}> {
  const prompt = `Analyze the following website domain and determine:
1. What type of site it is (directory, blog, news site, review site, brand/company site, government site, educational site, etc.)
2. How difficult it would be for a business to get mentioned or listed on this site (easy, medium, or hard)
3. Specific, actionable advice on how to get listed or mentioned

Domain: ${domain}

Guidelines for difficulty:
- EASY: Directories, review sites, business listings where anyone can create a profile or submit a listing
- MEDIUM: Blogs, news sites, forums, community sites where you could pitch a story, contribute content, or participate
- HARD: Competitor brand sites, major publications with strict editorial standards, government sites, educational institutions

For HARD sites: Be honest. If it's very difficult, say "Getting a citation on this site would be difficult. No known direct strategy."

Respond in JSON format:
{
  "siteType": "type of site",
  "difficulty": "easy|medium|hard",
  "strategy": "Your specific advice here. Keep it concise (2-4 sentences max)."
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an SEO and digital marketing expert. Analyze domains and provide realistic, actionable advice. Be honest about difficulty.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const responseText = completion.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(responseText);

  return {
    difficulty: parsed.difficulty || 'medium',
    siteType: parsed.siteType || 'Unknown',
    strategy: parsed.strategy || 'Unable to analyze this domain.',
  };
}

async function analyzeCompetitor(
  competitorName: string,
  metadata: Record<string, any> | null,
  business: { name?: string; description?: string } | null
): Promise<{
  whoTheyAre: string;
  whyMentioned: string;
  howToDifferentiate: string;
}> {
  const businessContext = business?.name
    ? `The user's business is "${business.name}"${business.description ? ` which ${business.description}` : ''}.`
    : '';

  const competitorContext = [
    metadata?.domains?.length ? `Their website is ${metadata.domains[0]}.` : '',
    metadata?.categories?.length ? `They operate in: ${metadata.categories.join(', ')}.` : '',
    metadata?.concepts?.length ? `They appear when people ask about: ${metadata.concepts.join(', ')}.` : '',
  ].filter(Boolean).join(' ');

  const prompt = `Analyze this competitor and provide strategic insights. Be concise - each section should be 1-2 sentences max.

Competitor: ${competitorName}
${competitorContext}
${businessContext}

Provide analysis in this exact JSON format:
{
  "whoTheyAre": "Brief description of what this company/brand does and who they serve. One sentence.",
  "whyMentioned": "Why AI assistants recommend them - what makes them authoritative or notable. One sentence.",
  "howToDifferentiate": "Actionable advice on how to stand out from this competitor. One sentence with a specific suggestion."
}

Guidelines:
- Keep each response to ONE concise sentence
- Be specific and actionable, not generic
- For "howToDifferentiate", give a concrete suggestion`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a competitive intelligence analyst. Provide brief, actionable insights about competitors. Always respond with valid JSON.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const responseText = completion.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(responseText);

  return {
    whoTheyAre: parsed.whoTheyAre || 'Unable to determine.',
    whyMentioned: parsed.whyMentioned || 'Unable to determine.',
    howToDifferentiate: parsed.howToDifferentiate || 'Unable to determine.',
  };
}

async function checkAndCompleteBatch(runId: string): Promise<void> {
  const { data: items } = await serviceSupabase
    .from('analysis_batch_run_items')
    .select('status')
    .eq('batch_run_id', runId);

  if (!items) return;

  const pending = items.filter(i => i.status === 'pending').length;
  const processing = items.filter(i => i.status === 'processing').length;
  const completed = items.filter(i => i.status === 'completed').length;
  const skipped = items.filter(i => i.status === 'skipped').length;
  const failed = items.filter(i => i.status === 'failed').length;

  if (pending === 0 && processing === 0) {
    const status = failed === items.length ? 'failed' : 'completed';
    const errorMessage = failed > 0 ? `${failed} of ${items.length} items failed` : null;

    await serviceSupabase
      .from('analysis_batch_runs')
      .update({
        status,
        processed_items: items.length,
        successful_items: completed + skipped,
        failed_items: failed,
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', runId);

    console.log(`📋 [AnalysisBatch] Batch ${runId} ${status}: ${completed} completed, ${skipped} skipped, ${failed} failed`);
  }
}

async function markBatchFailed(runId: string, errorMessage: string): Promise<void> {
  await serviceSupabase
    .from('analysis_batch_runs')
    .update({
      status: 'failed',
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', runId);
}
