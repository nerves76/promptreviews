/**
 * DataForSEO Domain Analytics API Client
 *
 * Wrapper for DataForSEO's Domain Analytics APIs:
 * - Domain Technologies API: tech stack, contact info, social links
 * - Whois Overview API: registration, metrics, backlinks
 *
 * API Documentation:
 * - https://docs.dataforseo.com/v3/domain_analytics/technologies/domain_technologies/live/
 * - https://docs.dataforseo.com/v3/domain_analytics/whois/overview/live/
 */

import {
  DataForSEOCredentials,
  DomainTechnologiesResponse,
  DomainTechnologiesResult,
  WhoisOverviewResponse,
  WhoisResult,
  DomainTechResult,
  WhoisResult2,
  DomainAnalysisResult,
  DomainAnalysisApiResult,
  Technology,
  TechnologyCategory,
  PositionDistribution,
  TrafficMetrics,
} from '../types';

// ============================================
// Configuration
// ============================================

const DATAFORSEO_API_BASE = 'https://api.dataforseo.com/v3';
const DOMAIN_TECHNOLOGIES_ENDPOINT = '/domain_analytics/technologies/domain_technologies/live';
const WHOIS_OVERVIEW_ENDPOINT = '/domain_analytics/whois/overview/live';

// Request timeout (30 seconds)
const REQUEST_TIMEOUT_MS = 30000;

// ============================================
// Credentials
// ============================================

function getCredentials(): DataForSEOCredentials {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    throw new Error(
      'DataForSEO credentials not configured. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables.'
    );
  }

  return { login, password };
}

function getAuthHeader(credentials: DataForSEOCredentials): string {
  const encoded = Buffer.from(`${credentials.login}:${credentials.password}`).toString('base64');
  return `Basic ${encoded}`;
}

// ============================================
// Domain Validation
// ============================================

/**
 * Normalize and validate a domain input
 * Strips protocol, www, paths, and query strings
 */
export function normalizeDomain(input: string): string {
  let domain = input.trim().toLowerCase();

  // Remove protocol
  domain = domain.replace(/^https?:\/\//, '');

  // Remove www.
  domain = domain.replace(/^www\./, '');

  // Remove path and query string
  domain = domain.split('/')[0].split('?')[0].split('#')[0];

  return domain;
}

/**
 * Basic domain format validation
 */
export function isValidDomain(domain: string): boolean {
  // Basic pattern: at least one character, a dot, then TLD
  const domainPattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;
  return domainPattern.test(domain) && domain.length <= 253;
}

// ============================================
// API Calls
// ============================================

/**
 * Get domain technology information
 */
export async function getDomainTechnologies(domain: string): Promise<DomainTechResult> {
  const normalizedDomain = normalizeDomain(domain);

  if (!isValidDomain(normalizedDomain)) {
    return {
      success: false,
      cost: 0,
      error: 'Invalid domain format',
    };
  }

  const credentials = getCredentials();

  const requestBody = [
    {
      target: normalizedDomain,
    },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    console.log(`[DomainAnalysis] Fetching technologies for: ${normalizedDomain}`);

    const response = await fetch(`${DATAFORSEO_API_BASE}${DOMAIN_TECHNOLOGIES_ENDPOINT}`, {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(credentials),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DomainAnalysis] Technologies API error:', response.status, errorText);
      return {
        success: false,
        cost: 0,
        error: `API returned ${response.status}: ${errorText}`,
      };
    }

    const data: DomainTechnologiesResponse = await response.json();

    // Check overall status
    if (data.status_code !== 20000) {
      return {
        success: false,
        cost: data.cost || 0,
        error: `API error: ${data.status_message}`,
      };
    }

    // Check task status
    const task = data.tasks?.[0];
    if (!task) {
      return {
        success: false,
        cost: 0,
        error: 'No task returned from API',
      };
    }

    if (task.status_code !== 20000) {
      return {
        success: false,
        cost: task.cost || 0,
        error: `Task failed: ${task.status_message}`,
      };
    }

    const result = task.result?.[0];
    if (!result) {
      return {
        success: true,
        cost: task.cost || 0,
        data: undefined,
        error: 'No data found for this domain',
      };
    }

    console.log(`[DomainAnalysis] Technologies fetched. Cost: $${task.cost?.toFixed(4)}`);
    console.log(`[DomainAnalysis] Full tech result:`, JSON.stringify({
      title: result.title,
      description: result.description,
      meta_keywords: result.meta_keywords,
      domain_rank: result.domain_rank,
      country_iso_code: result.country_iso_code,
      language_code: result.language_code,
      phone_numbers: result.phone_numbers,
      emails: result.emails,
      social_graph_urls: result.social_graph_urls,
      technologies: result.technologies ? Object.keys(result.technologies) : null,
    }, null, 2));

    return {
      success: true,
      cost: task.cost || 0,
      data: result,
    };
  } catch (error) {
    clearTimeout(timeout);

    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[DomainAnalysis] Technologies request timeout (30s)');
      return {
        success: false,
        cost: 0,
        error: 'Request timeout (30 seconds)',
      };
    }

    console.error('[DomainAnalysis] Technologies request failed:', error);
    return {
      success: false,
      cost: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get domain whois and metrics information
 */
export async function getWhoisOverview(domain: string): Promise<WhoisResult2> {
  const normalizedDomain = normalizeDomain(domain);

  if (!isValidDomain(normalizedDomain)) {
    return {
      success: false,
      cost: 0,
      error: 'Invalid domain format',
    };
  }

  const credentials = getCredentials();

  // Whois overview requires filters to get specific domain data
  const requestBody = [
    {
      limit: 1,
      filters: [
        ["domain", "=", normalizedDomain]
      ]
    },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    console.log(`[DomainAnalysis] Fetching whois for: ${normalizedDomain}`);

    const response = await fetch(`${DATAFORSEO_API_BASE}${WHOIS_OVERVIEW_ENDPOINT}`, {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(credentials),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DomainAnalysis] Whois API error:', response.status, errorText);
      return {
        success: false,
        cost: 0,
        error: `API returned ${response.status}: ${errorText}`,
      };
    }

    const data: WhoisOverviewResponse = await response.json();

    // Check overall status
    if (data.status_code !== 20000) {
      return {
        success: false,
        cost: data.cost || 0,
        error: `API error: ${data.status_message}`,
      };
    }

    // Check task status
    const task = data.tasks?.[0];
    if (!task) {
      return {
        success: false,
        cost: 0,
        error: 'No task returned from API',
      };
    }

    if (task.status_code !== 20000) {
      return {
        success: false,
        cost: task.cost || 0,
        error: `Task failed: ${task.status_message}`,
      };
    }

    // Whois response has nested structure: result[0].items[0] contains the domain data
    const resultContainer = task.result?.[0];
    const result = resultContainer?.items?.[0];

    if (!result) {
      console.log(`[DomainAnalysis] No whois data found. Result container:`, JSON.stringify(resultContainer, null, 2)?.slice(0, 500));
      return {
        success: true,
        cost: task.cost || 0,
        data: undefined,
        error: 'No whois data found for this domain',
      };
    }

    console.log(`[DomainAnalysis] Whois fetched. Cost: $${task.cost?.toFixed(4)}`);
    console.log(`[DomainAnalysis] Whois result:`, JSON.stringify(result, null, 2)?.slice(0, 2000));

    return {
      success: true,
      cost: task.cost || 0,
      data: result as WhoisResult,
    };
  } catch (error) {
    clearTimeout(timeout);

    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[DomainAnalysis] Whois request timeout (30s)');
      return {
        success: false,
        cost: 0,
        error: 'Request timeout (30 seconds)',
      };
    }

    console.error('[DomainAnalysis] Whois request failed:', error);
    return {
      success: false,
      cost: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// Combined Analysis
// ============================================

/**
 * Transform raw technologies data into a cleaner structure
 * Note: DataForSEO returns tech names as strings OR objects depending on the endpoint
 */
function transformTechnologies(
  raw: Record<string, Record<string, (string | { name: string; version?: string | null; icon?: string | null; website?: string | null })[]>> | null
): Record<string, TechnologyCategory> | undefined {
  if (!raw) return undefined;

  const result: Record<string, TechnologyCategory> = {};

  for (const [category, subcategories] of Object.entries(raw)) {
    result[category] = {};
    for (const [subcategory, items] of Object.entries(subcategories)) {
      result[category][subcategory] = items.map((item) => {
        // Handle both string format and object format
        if (typeof item === 'string') {
          return { name: item };
        }
        return {
          name: item.name,
          version: item.version ?? undefined,
          icon: item.icon ?? undefined,
          website: item.website ?? undefined,
        };
      });
    }
  }

  return result;
}

/**
 * Extract position distribution from traffic metrics
 */
function extractPositionDistribution(metrics: TrafficMetrics | null | undefined): PositionDistribution | undefined {
  if (!metrics) return undefined;

  return {
    pos_1: metrics.pos_1 || 0,
    pos_2_3: metrics.pos_2_3 || 0,
    pos_4_10: metrics.pos_4_10 || 0,
    pos_11_20: metrics.pos_11_20 || 0,
    pos_21_30: metrics.pos_21_30 || 0,
    pos_31_40: metrics.pos_31_40 || 0,
    pos_41_50: metrics.pos_41_50 || 0,
    pos_51_60: metrics.pos_51_60 || 0,
    pos_61_70: metrics.pos_61_70 || 0,
    pos_71_80: metrics.pos_71_80 || 0,
    pos_81_90: metrics.pos_81_90 || 0,
    pos_91_100: metrics.pos_91_100 || 0,
  };
}

/**
 * Run full domain analysis (technologies + whois)
 */
export async function analyzeDomain(domain: string): Promise<DomainAnalysisApiResult> {
  const normalizedDomain = normalizeDomain(domain);

  if (!isValidDomain(normalizedDomain)) {
    return {
      success: false,
      error: 'Invalid domain format. Please enter a valid domain (e.g., example.com)',
    };
  }

  // Run both API calls
  // Note: Running sequentially to avoid potential rate limits
  // Could be parallelized with Promise.all if needed
  const techResult = await getDomainTechnologies(normalizedDomain);

  // Small delay between requests
  await new Promise((resolve) => setTimeout(resolve, 100));

  const whoisResult = await getWhoisOverview(normalizedDomain);

  // Check if both failed
  if (!techResult.success && !whoisResult.success) {
    return {
      success: false,
      error: techResult.error || whoisResult.error || 'Failed to fetch domain data',
    };
  }

  // Build combined result
  const tech = techResult.data;
  const whois = whoisResult.data;

  const result: DomainAnalysisResult = {
    domain: normalizedDomain,
    analyzedAt: new Date().toISOString(),

    // Technologies data
    title: tech?.title ?? undefined,
    description: tech?.description ?? undefined,
    metaKeywords: tech?.meta_keywords ?? undefined,
    domainRank: tech?.domain_rank ?? undefined,
    lastVisited: tech?.last_visited ?? undefined,
    countryIsoCode: tech?.country_iso_code ?? undefined,
    languageCode: tech?.language_code ?? tech?.content_language_code ?? undefined,
    phoneNumbers: tech?.phone_numbers ?? undefined,
    emails: tech?.emails ?? undefined,
    socialGraphUrls: tech?.social_graph_urls ?? undefined,
    technologies: transformTechnologies(tech?.technologies ?? null),

    // Whois data
    registrar: whois?.registrar ?? undefined,
    createdDatetime: whois?.created_datetime ?? undefined,
    expirationDatetime: whois?.expiration_datetime ?? undefined,
    changedDatetime: whois?.changed_datetime ?? undefined,
    eppStatusCodes: whois?.epp_status_codes ?? undefined,
    registered: whois?.registered,

    // Organic metrics
    organicEtv: whois?.metrics?.organic?.etv,
    organicCount: whois?.metrics?.organic?.count,
    organicPositions: extractPositionDistribution(whois?.metrics?.organic),

    // Paid metrics
    paidEtv: whois?.metrics?.paid?.etv,
    paidCount: whois?.metrics?.paid?.count,
    paidPositions: extractPositionDistribution(whois?.metrics?.paid),
    estimatedPaidTrafficCost: whois?.metrics?.paid?.estimated_paid_traffic_cost,

    // Backlinks
    referringDomains: whois?.backlinks_info?.referring_domains,
    referringMainDomains: whois?.backlinks_info?.referring_main_domains,
    referringPages: whois?.backlinks_info?.referring_pages,
    dofollow: whois?.backlinks_info?.dofollow,
    backlinks: whois?.backlinks_info?.backlinks,
    backlinksUpdated: whois?.backlinks_info?.time_update ?? undefined,

    // Costs
    techCost: techResult.cost,
    whoisCost: whoisResult.cost,
    totalCost: techResult.cost + whoisResult.cost,
  };

  console.log(`[DomainAnalysis] Analysis complete. Total cost: $${result.totalCost.toFixed(4)}`);

  return {
    success: true,
    result,
  };
}

// ============================================
// Exports
// ============================================

export const domainAnalysisClient = {
  getDomainTechnologies,
  getWhoisOverview,
  analyzeDomain,
  normalizeDomain,
  isValidDomain,
};

export default domainAnalysisClient;
