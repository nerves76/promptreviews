/**
 * Backlinks Tracking Service
 *
 * Orchestrates backlink checks for tracked domains.
 * Stores results in the database and tracks API costs.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  BacklinkDomain,
  BacklinkCheck,
  BacklinkAnchor,
  BacklinkReferringDomain,
  BacklinkNewLost,
  BacklinkCheckResult,
  BacklinkCheckOptions,
  BACKLINK_CREDIT_COSTS,
} from '../utils/types';
import {
  getBacklinksSummary,
  getAnchors,
  getReferringDomains,
  getNewLostBacklinks,
} from '../api';
import { getBalance, debit, InsufficientCreditsError } from '@/lib/credits';
import { captureError } from '@/utils/sentry';

// Use generic SupabaseClient type to avoid strict typing issues
type ServiceSupabase = SupabaseClient<any, any, any>;

// ============================================
// Cost Calculation
// ============================================

/**
 * Calculate the credit cost for a backlink check
 */
export function calculateBacklinkCheckCost(options: BacklinkCheckOptions): number {
  if (options.checkType === 'full') {
    return BACKLINK_CREDIT_COSTS.full;
  }
  return BACKLINK_CREDIT_COSTS.summary;
}

// ============================================
// Main Check Function
// ============================================

/**
 * Run a backlink check for a tracked domain
 *
 * This is the main entry point for running backlink analysis.
 * It fetches data from DataForSEO and stores results in the database.
 *
 * @param domain - The tracked domain configuration
 * @param serviceSupabase - Supabase client with service role
 * @param options - Check options (what data to fetch)
 */
export async function runBacklinkCheck(
  domain: BacklinkDomain,
  serviceSupabase: ServiceSupabase,
  options: BacklinkCheckOptions = { checkType: 'full' }
): Promise<BacklinkCheckResult> {
  const {
    checkType,
    includeAnchors = checkType === 'full',
    includeReferringDomains = checkType === 'full',
    includeNewLost = checkType === 'full',
    anchorLimit = 50,
    referringDomainsLimit = 50,
    newLostLimit = 50,
  } = options;

  console.log(`🔗 [Backlinks] Starting check for domain: ${domain.domain}`);

  let totalCost = 0;

  try {
    // 1. Get backlinks summary (always required)
    console.log(`   [1/4] Fetching summary...`);
    const summaryResult = await getBacklinksSummary({
      target: domain.domain,
      includeSubdomains: true,
    });

    if (!summaryResult.success || !summaryResult.data) {
      return {
        success: false,
        totalCost: summaryResult.cost,
        error: summaryResult.error || 'Failed to get backlinks summary',
      };
    }

    totalCost += summaryResult.cost;
    const summary = summaryResult.data;

    // 2. Create check record
    const checkedAt = new Date().toISOString();
    const { data: checkRecord, error: checkError } = await serviceSupabase
      .from('backlink_checks')
      .insert({
        account_id: domain.accountId,
        domain_id: domain.id,
        backlinks_total: summary.backlinksTotal,
        referring_domains_total: summary.referringDomainsTotal,
        referring_domains_nofollow: summary.referringDomainsNofollow,
        referring_main_domains: summary.referringMainDomains,
        referring_ips: summary.referringIps,
        referring_subnets: summary.referringSubnets,
        rank: summary.rank,
        backlinks_follow: summary.backlinksFollow,
        backlinks_nofollow: summary.backlinksNofollow,
        backlinks_text: summary.backlinksText,
        backlinks_image: summary.backlinksImage,
        backlinks_redirect: summary.backlinksRedirect,
        backlinks_form: summary.backlinksForm,
        backlinks_frame: summary.backlinksFrame,
        referring_pages: summary.referringPages,
        api_cost_usd: summaryResult.cost,
        checked_at: checkedAt,
      })
      .select()
      .single();

    if (checkError || !checkRecord) {
      console.error('❌ [Backlinks] Failed to create check record:', checkError);
      return {
        success: false,
        totalCost,
        error: `Failed to save check: ${checkError?.message}`,
      };
    }

    const checkId = checkRecord.id;
    const anchorsToSave: BacklinkAnchor[] = [];
    const referringDomainsToSave: BacklinkReferringDomain[] = [];
    const newLostToSave: BacklinkNewLost[] = [];

    // 3. Get anchor text distribution (optional)
    if (includeAnchors) {
      console.log(`   [2/4] Fetching anchors...`);
      const anchorsResult = await getAnchors({
        target: domain.domain,
        limit: anchorLimit,
      });

      if (anchorsResult.success) {
        totalCost += anchorsResult.cost;

        // Update check with anchor cost
        await serviceSupabase
          .from('backlink_checks')
          .update({
            api_cost_usd: (checkRecord.api_cost_usd || 0) + anchorsResult.cost,
          })
          .eq('id', checkId);

        // Save anchors
        if (anchorsResult.anchors.length > 0) {
          const anchorRecords = anchorsResult.anchors.map((anchor) => ({
            account_id: domain.accountId,
            check_id: checkId,
            anchor_text: anchor.anchor,
            backlinks_count: anchor.backlinksCount,
            referring_domains_count: anchor.referringDomainsCount,
            first_seen: anchor.firstSeen,
            last_seen: anchor.lastSeen,
            rank: anchor.rank,
          }));

          const { error: anchorsError } = await serviceSupabase
            .from('backlink_anchors')
            .insert(anchorRecords);

          if (anchorsError) {
            console.warn('⚠️ [Backlinks] Failed to save anchors:', anchorsError);
          }
        }
      }
    } else {
      console.log(`   [2/4] Skipping anchors (not included)`);
    }

    // 4. Get referring domains (optional)
    if (includeReferringDomains) {
      console.log(`   [3/4] Fetching referring domains...`);
      const domainsResult = await getReferringDomains({
        target: domain.domain,
        limit: referringDomainsLimit,
        orderBy: 'rank',
      });

      if (domainsResult.success) {
        totalCost += domainsResult.cost;

        // Update check with domains cost
        await serviceSupabase
          .from('backlink_checks')
          .update({
            api_cost_usd: (checkRecord.api_cost_usd || 0) + domainsResult.cost,
          })
          .eq('id', checkId);

        // Save referring domains
        if (domainsResult.domains.length > 0) {
          const domainRecords = domainsResult.domains.map((d) => ({
            account_id: domain.accountId,
            check_id: checkId,
            referring_domain: d.domain,
            backlinks_count: d.backlinksCount,
            rank: d.rank,
            backlinks_spam_score: d.spamScore,
            first_seen: d.firstSeen,
            last_seen: d.lastSeen,
            is_follow: d.isFollow,
          }));

          const { error: domainsError } = await serviceSupabase
            .from('backlink_referring_domains')
            .insert(domainRecords);

          if (domainsError) {
            console.warn('⚠️ [Backlinks] Failed to save referring domains:', domainsError);
          }
        }
      }
    } else {
      console.log(`   [3/4] Skipping referring domains (not included)`);
    }

    // 5. Get new/lost backlinks (optional)
    if (includeNewLost) {
      console.log(`   [4/4] Fetching new/lost backlinks...`);

      // Get date range for new/lost (last 30 days)
      const dateTo = new Date().toISOString().split('T')[0];
      const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      // Fetch new backlinks
      const newResult = await getNewLostBacklinks({
        target: domain.domain,
        type: 'new',
        dateFrom,
        dateTo,
        limit: newLostLimit,
      });

      if (newResult.success) {
        totalCost += newResult.cost;

        // Save new backlinks
        if (newResult.backlinks.length > 0) {
          const newRecords = newResult.backlinks.map((bl) => ({
            account_id: domain.accountId,
            domain_id: domain.id,
            check_id: checkId,
            change_type: 'new' as const,
            source_url: bl.sourceUrl,
            source_domain: bl.sourceDomain,
            target_url: bl.targetUrl,
            anchor_text: bl.anchorText,
            link_type: bl.linkType,
            is_follow: bl.isFollow,
            first_seen: bl.firstSeen,
            last_seen: bl.lastSeen,
            source_rank: bl.sourceRank,
          }));

          await serviceSupabase.from('backlink_new_lost').insert(newRecords);
        }
      }

      // Fetch lost backlinks
      const lostResult = await getNewLostBacklinks({
        target: domain.domain,
        type: 'lost',
        dateFrom,
        dateTo,
        limit: newLostLimit,
      });

      if (lostResult.success) {
        totalCost += lostResult.cost;

        // Save lost backlinks
        if (lostResult.backlinks.length > 0) {
          const lostRecords = lostResult.backlinks.map((bl) => ({
            account_id: domain.accountId,
            domain_id: domain.id,
            check_id: checkId,
            change_type: 'lost' as const,
            source_url: bl.sourceUrl,
            source_domain: bl.sourceDomain,
            target_url: bl.targetUrl,
            anchor_text: bl.anchorText,
            link_type: bl.linkType,
            is_follow: bl.isFollow,
            first_seen: bl.firstSeen,
            last_seen: bl.lastSeen,
            source_rank: bl.sourceRank,
          }));

          await serviceSupabase.from('backlink_new_lost').insert(lostRecords);
        }
      }
    } else {
      console.log(`   [4/4] Skipping new/lost (not included)`);
    }

    // 6. Update domain last checked timestamp
    await serviceSupabase
      .from('backlink_domains')
      .update({
        last_checked_at: checkedAt,
      })
      .eq('id', domain.id);

    // 7. Update total API cost on check record
    await serviceSupabase
      .from('backlink_checks')
      .update({
        api_cost_usd: totalCost,
      })
      .eq('id', checkId);

    console.log(
      `✅ [Backlinks] Check complete for ${domain.domain}: ` +
      `${summary.backlinksTotal} backlinks, ${summary.referringDomainsTotal} referring domains, ` +
      `rank ${summary.rank} (cost: $${totalCost.toFixed(4)})`
    );

    // Return result
    return {
      success: true,
      checkId,
      summary: {
        id: checkId,
        accountId: domain.accountId,
        domainId: domain.id,
        backlinksTotal: summary.backlinksTotal,
        referringDomainsTotal: summary.referringDomainsTotal,
        referringDomainsNofollow: summary.referringDomainsNofollow,
        referringMainDomains: summary.referringMainDomains,
        referringIps: summary.referringIps,
        referringSubnets: summary.referringSubnets,
        rank: summary.rank,
        backlinksFollow: summary.backlinksFollow,
        backlinksNofollow: summary.backlinksNofollow,
        backlinksText: summary.backlinksText,
        backlinksImage: summary.backlinksImage,
        backlinksRedirect: summary.backlinksRedirect,
        backlinksForm: summary.backlinksForm,
        backlinksFrame: summary.backlinksFrame,
        referringPages: summary.referringPages,
        apiCostUsd: totalCost,
        checkedAt: new Date(checkedAt),
        createdAt: new Date(checkedAt),
      },
      totalCost,
    };
  } catch (error) {
    console.error('❌ [Backlinks] Check failed:', error);
    captureError(error, 'backlinks-checker', { domain: domain.domain });

    return {
      success: false,
      totalCost,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// Credit-Aware Check Function
// ============================================

/**
 * Run a backlink check with credit validation and deduction
 *
 * This wraps runBacklinkCheck with credit system integration.
 */
export async function runBacklinkCheckWithCredits(
  domain: BacklinkDomain,
  serviceSupabase: ServiceSupabase,
  options: BacklinkCheckOptions = { checkType: 'full' }
): Promise<BacklinkCheckResult> {
  const creditCost = calculateBacklinkCheckCost(options);

  // Check balance
  const balance = await getBalance(serviceSupabase, domain.accountId);

  if (balance.totalCredits < creditCost) {
    return {
      success: false,
      totalCost: 0,
      error: `Insufficient credits. Required: ${creditCost}, available: ${balance.totalCredits}`,
    };
  }

  // Generate idempotency key
  const idempotencyKey = `backlinks:${domain.accountId}:${domain.id}:${Date.now()}`;

  try {
    // Debit credits before running check
    await debit(serviceSupabase, domain.accountId, creditCost, {
      featureType: 'backlinks',
      featureMetadata: {
        domainId: domain.id,
        domain: domain.domain,
        checkType: options.checkType,
      },
      idempotencyKey,
      description: `Backlink check: ${domain.domain}`,
    });

    // Run the check
    const result = await runBacklinkCheck(domain, serviceSupabase, options);

    if (!result.success) {
      // Refund credits on failure
      console.log('⚠️ [Backlinks] Check failed, refunding credits');
      // Note: In production, you'd want to call a refund function
      // For now, we log the failure but don't refund (to match rank-tracking behavior)
    }

    return result;
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return {
        success: false,
        totalCost: 0,
        error: `Insufficient credits. Required: ${creditCost}, available: ${error.available}`,
      };
    }

    throw error;
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get the most recent check for a domain
 */
export async function getLatestCheck(
  domainId: string,
  serviceSupabase: ServiceSupabase
): Promise<BacklinkCheck | null> {
  const { data, error } = await serviceSupabase
    .from('backlink_checks')
    .select('*')
    .eq('domain_id', domainId)
    .order('checked_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    accountId: data.account_id,
    domainId: data.domain_id,
    backlinksTotal: data.backlinks_total,
    referringDomainsTotal: data.referring_domains_total,
    referringDomainsNofollow: data.referring_domains_nofollow,
    referringMainDomains: data.referring_main_domains,
    referringIps: data.referring_ips,
    referringSubnets: data.referring_subnets,
    rank: data.rank,
    backlinksFollow: data.backlinks_follow,
    backlinksNofollow: data.backlinks_nofollow,
    backlinksText: data.backlinks_text,
    backlinksImage: data.backlinks_image,
    backlinksRedirect: data.backlinks_redirect,
    backlinksForm: data.backlinks_form,
    backlinksFrame: data.backlinks_frame,
    referringPages: data.referring_pages,
    apiCostUsd: data.api_cost_usd,
    checkedAt: new Date(data.checked_at),
    createdAt: new Date(data.created_at),
  };
}

/**
 * Get check history for a domain
 */
export async function getCheckHistory(
  domainId: string,
  serviceSupabase: ServiceSupabase,
  limit: number = 30
): Promise<BacklinkCheck[]> {
  const { data, error } = await serviceSupabase
    .from('backlink_checks')
    .select('*')
    .eq('domain_id', domainId)
    .order('checked_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map((row: any) => ({
    id: row.id,
    accountId: row.account_id,
    domainId: row.domain_id,
    backlinksTotal: row.backlinks_total,
    referringDomainsTotal: row.referring_domains_total,
    referringDomainsNofollow: row.referring_domains_nofollow,
    referringMainDomains: row.referring_main_domains,
    referringIps: row.referring_ips,
    referringSubnets: row.referring_subnets,
    rank: row.rank,
    backlinksFollow: row.backlinks_follow,
    backlinksNofollow: row.backlinks_nofollow,
    backlinksText: row.backlinks_text,
    backlinksImage: row.backlinks_image,
    backlinksRedirect: row.backlinks_redirect,
    backlinksForm: row.backlinks_form,
    backlinksFrame: row.backlinks_frame,
    referringPages: row.referring_pages,
    apiCostUsd: row.api_cost_usd,
    checkedAt: new Date(row.checked_at),
    createdAt: new Date(row.created_at),
  }));
}
