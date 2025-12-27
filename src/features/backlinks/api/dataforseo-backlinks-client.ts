/**
 * DataForSEO Backlinks API Client
 *
 * Wrapper for DataForSEO's backlinks analysis APIs.
 * Used for tracking domain backlink profiles, referring domains,
 * anchor text distribution, and new/lost backlinks.
 *
 * API Documentation:
 * - Summary: https://docs.dataforseo.com/v3/backlinks/summary/
 * - Referring Domains: https://docs.dataforseo.com/v3/backlinks/referring_domains/
 * - Anchors: https://docs.dataforseo.com/v3/backlinks/anchors/
 * - History: https://docs.dataforseo.com/v3/backlinks/history/
 */

// ============================================
// Types
// ============================================

export interface BacklinksSummaryResult {
  success: boolean;
  cost: number;
  data: BacklinksSummaryData | null;
  error?: string;
}

export interface BacklinksSummaryData {
  target: string;
  rank: number;
  backlinksTotal: number;
  referringDomainsTotal: number;
  referringDomainsNofollow: number;
  referringMainDomains: number;
  referringIps: number;
  referringSubnets: number;
  backlinksFollow: number;
  backlinksNofollow: number;
  backlinksText: number;
  backlinksImage: number;
  backlinksRedirect: number;
  backlinksForm: number;
  backlinksFrame: number;
  referringPages: number;
}

export interface ReferringDomainItem {
  domain: string;
  rank: number;
  backlinksCount: number;
  spamScore: number | null;
  firstSeen: string | null;
  lastSeen: string | null;
  isFollow: boolean;
}

export interface ReferringDomainsResult {
  success: boolean;
  cost: number;
  domains: ReferringDomainItem[];
  total: number;
  error?: string;
}

export interface AnchorItem {
  anchor: string;
  backlinksCount: number;
  referringDomainsCount: number;
  firstSeen: string | null;
  lastSeen: string | null;
  rank: number | null;
}

export interface AnchorsResult {
  success: boolean;
  cost: number;
  anchors: AnchorItem[];
  total: number;
  error?: string;
}

export interface BacklinkHistoryItem {
  date: string;
  newBacklinks: number;
  lostBacklinks: number;
  newReferringDomains: number;
  lostReferringDomains: number;
}

export interface BacklinksHistoryResult {
  success: boolean;
  cost: number;
  history: BacklinkHistoryItem[];
  error?: string;
}

export interface NewLostBacklinkItem {
  sourceUrl: string;
  sourceDomain: string;
  targetUrl: string;
  anchorText: string | null;
  linkType: string;
  isFollow: boolean;
  firstSeen: string | null;
  lastSeen: string | null;
  sourceRank: number | null;
}

export interface NewLostBacklinksResult {
  success: boolean;
  cost: number;
  backlinks: NewLostBacklinkItem[];
  total: number;
  error?: string;
}

// Internal types for API responses
interface DataForSEOResponse {
  status_code: number;
  status_message: string;
  tasks?: Array<{
    status_code: number;
    status_message: string;
    cost: number;
    result?: any[];
  }>;
}

// ============================================
// Configuration
// ============================================

const DATAFORSEO_API_BASE = 'https://api.dataforseo.com/v3';
const BACKLINKS_SUMMARY_ENDPOINT = '/backlinks/summary/live';
const REFERRING_DOMAINS_ENDPOINT = '/backlinks/referring_domains/live';
const ANCHORS_ENDPOINT = '/backlinks/anchors/live';
const HISTORY_ENDPOINT = '/backlinks/history/live';
const NEW_BACKLINKS_ENDPOINT = '/backlinks/backlinks/live';

// Request timeout (30 seconds)
const REQUEST_TIMEOUT = 30000;

// ============================================
// Credentials
// ============================================

interface DataForSEOCredentials {
  login: string;
  password: string;
}

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
// Helper Functions
// ============================================

/**
 * Make authenticated request to DataForSEO API
 */
async function makeDataForSEORequest(
  endpoint: string,
  requestBody: any[],
  logPrefix: string
): Promise<DataForSEOResponse> {
  const credentials = getCredentials();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    console.log(`🔗 [DataForSEO Backlinks] ${logPrefix}`);

    const response = await fetch(`${DATAFORSEO_API_BASE}${endpoint}`, {
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
      console.error(`❌ [DataForSEO Backlinks] API error: ${response.status}`, errorText);
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const data: DataForSEOResponse = await response.json();

    // Check overall response status
    if (data.status_code !== 20000) {
      throw new Error(`API error: ${data.status_message}`);
    }

    console.log(`✅ [DataForSEO Backlinks] ${logPrefix} - Success`);
    return data;
  } catch (error) {
    clearTimeout(timeout);

    // Handle timeout specifically
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`❌ [DataForSEO Backlinks] Request timeout (${REQUEST_TIMEOUT / 1000}s)`);
      throw new Error(`Request timeout (${REQUEST_TIMEOUT / 1000} seconds)`);
    }

    console.error(`❌ [DataForSEO Backlinks] ${logPrefix} - Failed:`, error);
    throw error;
  }
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// ============================================
// API Functions
// ============================================

/**
 * 1. Get backlinks summary for a domain
 *
 * Returns high-level metrics including:
 * - Total backlinks and referring domains
 * - DataForSEO Rank (authority score)
 * - Follow/nofollow breakdown
 * - Link type distribution
 */
export async function getBacklinksSummary(params: {
  target: string; // Domain to analyze (e.g., "example.com")
  includeSubdomains?: boolean;
}): Promise<BacklinksSummaryResult> {
  const { target, includeSubdomains = true } = params;

  const requestBody = [
    {
      target,
      include_subdomains: includeSubdomains,
    },
  ];

  try {
    const data = await makeDataForSEORequest(
      BACKLINKS_SUMMARY_ENDPOINT,
      requestBody,
      `Getting summary for "${target}"`
    );

    const task = data.tasks?.[0];
    if (!task) {
      return {
        success: false,
        cost: 0,
        data: null,
        error: 'No task returned from API',
      };
    }

    if (task.status_code !== 20000) {
      return {
        success: false,
        cost: task.cost || 0,
        data: null,
        error: `Task failed: ${task.status_message}`,
      };
    }

    const result = task.result?.[0];
    if (!result) {
      return {
        success: false,
        cost: task.cost || 0,
        data: null,
        error: 'No results returned',
      };
    }

    const summaryData: BacklinksSummaryData = {
      target: result.target || target,
      rank: result.rank || 0,
      backlinksTotal: result.backlinks || 0,
      referringDomainsTotal: result.referring_domains || 0,
      referringDomainsNofollow: result.referring_domains_nofollow || 0,
      referringMainDomains: result.referring_main_domains || 0,
      referringIps: result.referring_ips || 0,
      referringSubnets: result.referring_subnets || 0,
      backlinksFollow: result.backlinks - (result.backlinks_nofollow || 0),
      backlinksNofollow: result.backlinks_nofollow || 0,
      backlinksText: result.backlinks_text || 0,
      backlinksImage: result.backlinks_image || 0,
      backlinksRedirect: result.backlinks_redirect || 0,
      backlinksForm: result.backlinks_form || 0,
      backlinksFrame: result.backlinks_frame || 0,
      referringPages: result.referring_pages || 0,
    };

    console.log(
      `🔗 [DataForSEO Backlinks] Summary: ${summaryData.backlinksTotal} backlinks, ` +
      `${summaryData.referringDomainsTotal} referring domains, rank ${summaryData.rank} ` +
      `(cost: $${task.cost})`
    );

    return {
      success: true,
      cost: task.cost || 0,
      data: summaryData,
    };
  } catch (error) {
    console.error('❌ [DataForSEO Backlinks] getBacklinksSummary failed:', error);
    return {
      success: false,
      cost: 0,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 2. Get top referring domains for a target
 *
 * Returns list of domains linking to the target with:
 * - Domain authority (rank)
 * - Backlinks count from that domain
 * - First/last seen dates
 */
export async function getReferringDomains(params: {
  target: string;
  limit?: number;
  offset?: number;
  orderBy?: 'rank' | 'backlinks' | 'first_seen';
  includeSubdomains?: boolean;
}): Promise<ReferringDomainsResult> {
  const {
    target,
    limit = 100,
    offset = 0,
    orderBy = 'rank',
    includeSubdomains = true,
  } = params;

  // Map our orderBy options to DataForSEO field names
  const orderByMap: Record<string, string> = {
    rank: 'rank,desc',
    backlinks: 'backlinks,desc',
    first_seen: 'first_seen,desc',
  };

  const requestBody = [
    {
      target,
      include_subdomains: includeSubdomains,
      limit,
      offset,
      order_by: [orderByMap[orderBy] || 'rank,desc'],
    },
  ];

  try {
    const data = await makeDataForSEORequest(
      REFERRING_DOMAINS_ENDPOINT,
      requestBody,
      `Getting referring domains for "${target}"`
    );

    const task = data.tasks?.[0];
    if (!task) {
      return {
        success: false,
        cost: 0,
        domains: [],
        total: 0,
        error: 'No task returned from API',
      };
    }

    if (task.status_code !== 20000) {
      return {
        success: false,
        cost: task.cost || 0,
        domains: [],
        total: 0,
        error: `Task failed: ${task.status_message}`,
      };
    }

    const result = task.result?.[0];
    const items = result?.items || [];
    const total = result?.total_count || 0;

    const domains: ReferringDomainItem[] = items.map((item: any) => ({
      domain: item.domain || '',
      rank: item.rank || 0,
      backlinksCount: item.backlinks || 0,
      spamScore: item.backlinks_spam_score ?? null,
      firstSeen: item.first_seen || null,
      lastSeen: item.last_seen || null,
      isFollow: !item.is_nofollow,
    }));

    console.log(
      `🔗 [DataForSEO Backlinks] Found ${domains.length} referring domains ` +
      `(total: ${total}, cost: $${task.cost})`
    );

    return {
      success: true,
      cost: task.cost || 0,
      domains,
      total,
    };
  } catch (error) {
    console.error('❌ [DataForSEO Backlinks] getReferringDomains failed:', error);
    return {
      success: false,
      cost: 0,
      domains: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 3. Get anchor text distribution for a target
 *
 * Returns list of anchor texts used to link to the target with:
 * - Number of backlinks using this anchor
 * - Number of referring domains using this anchor
 */
export async function getAnchors(params: {
  target: string;
  limit?: number;
  offset?: number;
  includeSubdomains?: boolean;
}): Promise<AnchorsResult> {
  const { target, limit = 100, offset = 0, includeSubdomains = true } = params;

  const requestBody = [
    {
      target,
      include_subdomains: includeSubdomains,
      limit,
      offset,
      order_by: ['backlinks,desc'],
    },
  ];

  try {
    const data = await makeDataForSEORequest(
      ANCHORS_ENDPOINT,
      requestBody,
      `Getting anchors for "${target}"`
    );

    const task = data.tasks?.[0];
    if (!task) {
      return {
        success: false,
        cost: 0,
        anchors: [],
        total: 0,
        error: 'No task returned from API',
      };
    }

    if (task.status_code !== 20000) {
      return {
        success: false,
        cost: task.cost || 0,
        anchors: [],
        total: 0,
        error: `Task failed: ${task.status_message}`,
      };
    }

    const result = task.result?.[0];
    const items = result?.items || [];
    const total = result?.total_count || 0;

    const anchors: AnchorItem[] = items.map((item: any) => ({
      anchor: item.anchor || '',
      backlinksCount: item.backlinks || 0,
      referringDomainsCount: item.referring_domains || 0,
      firstSeen: item.first_seen || null,
      lastSeen: item.last_seen || null,
      rank: item.rank ?? null,
    }));

    console.log(
      `🔗 [DataForSEO Backlinks] Found ${anchors.length} anchor texts ` +
      `(total: ${total}, cost: $${task.cost})`
    );

    return {
      success: true,
      cost: task.cost || 0,
      anchors,
      total,
    };
  } catch (error) {
    console.error('❌ [DataForSEO Backlinks] getAnchors failed:', error);
    return {
      success: false,
      cost: 0,
      anchors: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 4. Get backlinks history for a target
 *
 * Returns historical data showing new/lost backlinks and referring domains
 * over time for trend analysis.
 */
export async function getBacklinksHistory(params: {
  target: string;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
  includeSubdomains?: boolean;
}): Promise<BacklinksHistoryResult> {
  const { target, dateFrom, dateTo, includeSubdomains = true } = params;

  const requestBody: any[] = [
    {
      target,
      include_subdomains: includeSubdomains,
    },
  ];

  // Add date filters if provided
  if (dateFrom) {
    requestBody[0].date_from = dateFrom;
  }
  if (dateTo) {
    requestBody[0].date_to = dateTo;
  }

  try {
    const data = await makeDataForSEORequest(
      HISTORY_ENDPOINT,
      requestBody,
      `Getting history for "${target}"`
    );

    const task = data.tasks?.[0];
    if (!task) {
      return {
        success: false,
        cost: 0,
        history: [],
        error: 'No task returned from API',
      };
    }

    if (task.status_code !== 20000) {
      return {
        success: false,
        cost: task.cost || 0,
        history: [],
        error: `Task failed: ${task.status_message}`,
      };
    }

    const result = task.result?.[0];
    const items = result?.items || [];

    const history: BacklinkHistoryItem[] = items.map((item: any) => ({
      date: item.date || '',
      newBacklinks: item.new_backlinks || 0,
      lostBacklinks: item.lost_backlinks || 0,
      newReferringDomains: item.new_referring_domains || 0,
      lostReferringDomains: item.lost_referring_domains || 0,
    }));

    console.log(
      `🔗 [DataForSEO Backlinks] Retrieved ${history.length} history entries ` +
      `(cost: $${task.cost})`
    );

    return {
      success: true,
      cost: task.cost || 0,
      history,
    };
  } catch (error) {
    console.error('❌ [DataForSEO Backlinks] getBacklinksHistory failed:', error);
    return {
      success: false,
      cost: 0,
      history: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 5. Get new or lost backlinks for a target
 *
 * Returns individual backlinks that were newly discovered or lost
 * within a date range.
 */
export async function getNewLostBacklinks(params: {
  target: string;
  type: 'new' | 'lost';
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  includeSubdomains?: boolean;
}): Promise<NewLostBacklinksResult> {
  const {
    target,
    type,
    dateFrom,
    dateTo,
    limit = 100,
    includeSubdomains = true,
  } = params;

  // Build filters based on type
  const filters: string[][] = [];

  if (type === 'new') {
    // New backlinks: first_seen within date range
    if (dateFrom) {
      filters.push(['first_seen', '>=', dateFrom]);
    }
    if (dateTo) {
      filters.push(['first_seen', '<=', dateTo]);
    }
  } else {
    // Lost backlinks: last_seen within date range (link no longer exists)
    if (dateFrom) {
      filters.push(['last_seen', '>=', dateFrom]);
    }
    if (dateTo) {
      filters.push(['last_seen', '<=', dateTo]);
    }
    // Only include links that are no longer live
    filters.push(['is_lost', '=', true]);
  }

  const requestBody: any[] = [
    {
      target,
      include_subdomains: includeSubdomains,
      limit,
      order_by: [type === 'new' ? 'first_seen,desc' : 'last_seen,desc'],
    },
  ];

  // Add filters if we have any
  if (filters.length > 0) {
    requestBody[0].filters = filters;
  }

  try {
    const data = await makeDataForSEORequest(
      NEW_BACKLINKS_ENDPOINT,
      requestBody,
      `Getting ${type} backlinks for "${target}"`
    );

    const task = data.tasks?.[0];
    if (!task) {
      return {
        success: false,
        cost: 0,
        backlinks: [],
        total: 0,
        error: 'No task returned from API',
      };
    }

    if (task.status_code !== 20000) {
      return {
        success: false,
        cost: task.cost || 0,
        backlinks: [],
        total: 0,
        error: `Task failed: ${task.status_message}`,
      };
    }

    const result = task.result?.[0];
    const items = result?.items || [];
    const total = result?.total_count || 0;

    const backlinks: NewLostBacklinkItem[] = items.map((item: any) => ({
      sourceUrl: item.url_from || '',
      sourceDomain: item.domain_from || extractDomain(item.url_from || ''),
      targetUrl: item.url_to || '',
      anchorText: item.anchor || null,
      linkType: item.link_type || 'text',
      isFollow: !item.is_nofollow,
      firstSeen: item.first_seen || null,
      lastSeen: item.last_seen || null,
      sourceRank: item.domain_from_rank ?? null,
    }));

    console.log(
      `🔗 [DataForSEO Backlinks] Found ${backlinks.length} ${type} backlinks ` +
      `(total: ${total}, cost: $${task.cost})`
    );

    return {
      success: true,
      cost: task.cost || 0,
      backlinks,
      total,
    };
  } catch (error) {
    console.error('❌ [DataForSEO Backlinks] getNewLostBacklinks failed:', error);
    return {
      success: false,
      cost: 0,
      backlinks: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// Test & Utility Functions
// ============================================

/**
 * Test API connection with a simple summary request
 */
export async function testConnection(): Promise<{
  success: boolean;
  message: string;
  cost?: number;
}> {
  try {
    const result = await getBacklinksSummary({
      target: 'google.com',
    });

    if (result.success && result.data) {
      return {
        success: true,
        message: `Connection successful. Google.com has ${result.data.backlinksTotal} backlinks.`,
        cost: result.cost,
      };
    } else {
      return {
        success: false,
        message: result.error || 'Unknown error',
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// Exports
// ============================================

export const dataForSEOBacklinksClient = {
  getBacklinksSummary,
  getReferringDomains,
  getAnchors,
  getBacklinksHistory,
  getNewLostBacklinks,
  testConnection,
};

export default dataForSEOBacklinksClient;
