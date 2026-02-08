/**
 * DataForSEO AI Optimization API Client
 *
 * Wrapper for DataForSEO's AI Optimization APIs to track brand visibility
 * in AI assistants (ChatGPT, Claude, Gemini, Perplexity).
 *
 * API Documentation:
 * - ChatGPT Scraper: https://docs.dataforseo.com/v3/ai_optimization-chat_gpt-llm_scraper-live-advanced/
 * - LLM Responses: https://docs.dataforseo.com/v3/ai_optimization/llm_responses/live/
 * - SERP (AI Overview): https://docs.dataforseo.com/v3/serp/google/organic/live/advanced/
 */

import {
  LLMProvider,
  LLMCheckResult,
  LLMCitation,
  LLMBrandEntity,
  LLMSearchResult,
} from '../utils/types';

// ============================================
// Configuration
// ============================================

const DATAFORSEO_API_BASE = 'https://api.dataforseo.com/v3';

// ChatGPT Scraper - scrapes actual ChatGPT search results
const CHATGPT_SCRAPER_ENDPOINT = '/ai_optimization/chat_gpt/llm_scraper/live/advanced';

// Google SERP - for AI Overview extraction
const SERP_ENDPOINT = '/serp/google/organic/live/advanced';

// LLM Responses - queries LLMs directly via DataForSEO
const LLM_RESPONSES_ENDPOINTS: Record<Exclude<LLMProvider, 'chatgpt' | 'ai_overview'>, string> = {
  claude: '/ai_optimization/claude/llm_responses/live',
  gemini: '/ai_optimization/gemini/llm_responses/live',
  perplexity: '/ai_optimization/perplexity/llm_responses/live',
};

// Provider-specific request configurations
// model_name is REQUIRED for all LLM Response APIs
// web_search MUST be true for Claude/Gemini to return citations
// See: https://docs.dataforseo.com/v3/ai_optimization/
const PROVIDER_CONFIGS: Record<Exclude<LLMProvider, 'chatgpt' | 'ai_overview'>, Record<string, any>> = {
  claude: {
    model_name: 'claude-sonnet-4-0', // Latest Claude Sonnet model
    web_search: true, // Required to get citations
  },
  gemini: {
    model_name: 'gemini-2.0-flash', // Latest Gemini Flash model
    web_search: true, // Required to get citations
  },
  perplexity: {
    model_name: 'sonar', // Perplexity Sonar model (has web search built-in)
  },
};

// Request timeout (120 seconds for LLM queries - they can be slow)
const REQUEST_TIMEOUT = 120000;

// Delay between requests to avoid rate limiting (ms)
const REQUEST_DELAY = 200;

// Maximum response snippet length to store
const MAX_SNIPPET_LENGTH = 500;

// Maximum cleaned full response length to store
const MAX_FULL_RESPONSE_LENGTH = 3000;

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
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    // If URL parsing fails, try basic extraction
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }
}

/**
 * Normalize domain for comparison
 */
function normalizeDomain(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
}

/**
 * Check if a domain matches the target
 */
function isDomainMatch(sourceDomain: string | null | undefined, targetDomain: string): boolean {
  if (!sourceDomain) return false;
  const normalizedSource = normalizeDomain(sourceDomain);
  const normalizedTarget = normalizeDomain(targetDomain);

  // Exact match or subdomain match
  return (
    normalizedSource === normalizedTarget ||
    normalizedSource.endsWith(`.${normalizedTarget}`) ||
    normalizedTarget.endsWith(`.${normalizedSource}`)
  );
}

/**
 * Sleep helper for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// API Response Types
// ============================================

interface DataForSEOResponse {
  status_code: number;
  status_message: string;
  cost?: number;
  tasks?: Array<{
    status_code: number;
    status_message: string;
    cost: number;
    result?: any[];
  }>;
}

// ChatGPT Scraper specific response
interface ChatGPTScraperResult {
  keyword: string;
  location_code: number;
  language_code: string;
  model: string;
  check_url: string;
  datetime: string;
  markdown?: string;
  search_results?: Array<{
    url?: string;
    domain?: string;
    title?: string;
    description?: string;
  }>;
  sources?: Array<{
    domain: string;
    url?: string;
    title?: string;
  }>;
  brand_entities?: any[];
  items?: any[];
  fan_out_queries?: string[];
}

// LLM Responses specific result
interface LLMResponsesResult {
  model_name: string;
  input_tokens: number;
  output_tokens: number;
  web_search: boolean;
  money_spent: number;
  datetime: string;
  // The actual response structure from the API
  items?: Array<{
    type: string;
    sections?: Array<{
      type: string;
      text?: string;
      links?: Array<{
        url?: string;
        title?: string;
        text?: string;
      }>;
    }>;
  }>;
  fan_out_queries?: string[];
  // Legacy structure (kept for backwards compatibility, may not be present)
  message?: Array<{
    role: string;
    content?: string;
    annotations?: Array<{
      url?: string;
      title?: string;
    }>;
  }>;
}

// ============================================
// Generic Request Function
// ============================================

async function makeDataForSEORequest(
  endpoint: string,
  requestBody: any[],
  logPrefix: string
): Promise<DataForSEOResponse> {
  const credentials = getCredentials();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    console.log(`🤖 [DataForSEO AI] ${logPrefix}`);

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
      console.error(`❌ [DataForSEO AI] API error: ${response.status}`, errorText);
      // Provide user-friendly HTTP error messages
      if (response.status === 402) {
        throw new Error('[B4L] Service temporarily unavailable. Please contact support@promptreviews.app');
      } else if (response.status === 401 || response.status === 403) {
        throw new Error('Authentication failed. Please contact support.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (response.status >= 500) {
        throw new Error('AI service temporarily unavailable. Please try again in a few minutes.');
      } else {
        throw new Error('Request failed. Please try again.');
      }
    }

    const data: DataForSEOResponse = await response.json();

    // Check overall response status
    if (data.status_code !== 20000) {
      throw new Error(`API error: ${data.status_message}`);
    }

    console.log(`✅ [DataForSEO AI] ${logPrefix} - Success`);
    return data;
  } catch (error) {
    clearTimeout(timeout);

    // Handle timeout specifically
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`❌ [DataForSEO AI] Request timeout (${REQUEST_TIMEOUT / 1000}s)`);
      throw new Error(`Request timeout (${REQUEST_TIMEOUT / 1000} seconds)`);
    }

    console.error(`❌ [DataForSEO AI] ${logPrefix} - Failed:`, error);
    throw error;
  }
}

// ============================================
// ChatGPT Visibility Check (via Scraper API)
// ============================================

/**
 * Check visibility in ChatGPT search results using the Scraper API.
 *
 * This queries ChatGPT's search mode and returns structured data about
 * which sources are cited in the response.
 *
 * Cost: ~$0.004 per query
 */
export async function checkChatGPTVisibility(params: {
  question: string;
  targetDomain: string;
  businessName?: string | null;
  locationCode?: number;
  languageCode?: string;
}): Promise<LLMCheckResult> {
  const {
    question,
    targetDomain,
    businessName = null,
    locationCode = 2840, // US
    languageCode = 'en',
  } = params;

  const requestBody = [
    {
      keyword: question,
      location_code: locationCode,
      language_code: languageCode,
    },
  ];

  try {
    const data = await makeDataForSEORequest(
      CHATGPT_SCRAPER_ENDPOINT,
      requestBody,
      `ChatGPT check: "${question.substring(0, 50)}..."`
    );

    const task = data.tasks?.[0];
    if (!task) {
      return createErrorResult('chatgpt', question, 'No task returned from API');
    }

    if (task.status_code !== 20000) {
      const friendlyError = getDataForSEOErrorMessage(task.status_code, task.status_message, 'chatgpt');
      return createErrorResult('chatgpt', question, friendlyError, task.cost);
    }

    const result = task.result?.[0] as ChatGPTScraperResult | undefined;
    if (!result) {
      return createErrorResult('chatgpt', question, 'No result in task', task.cost);
    }

    // Debug: Log available fields in the result
    console.log(`🔍 [DataForSEO AI] ChatGPT result fields: ${Object.keys(result).join(', ')}`);
    console.log(`🔍 [DataForSEO AI] sources: ${result.sources?.length ?? 'undefined'}, search_results: ${result.search_results?.length ?? 'undefined'}, items: ${result.items?.length ?? 'undefined'}`);

    // Extract citations from sources array
    const citations: LLMCitation[] = [];
    let domainCited = false;
    let citationPosition: number | null = null;
    let citationUrl: string | null = null;

    if (result.sources && Array.isArray(result.sources)) {
      for (let i = 0; i < result.sources.length; i++) {
        const source = result.sources[i];
        const domain = source.domain || extractDomain(source.url || '');
        const isOurs = isDomainMatch(domain, targetDomain);

        citations.push({
          domain,
          url: source.url || null,
          title: source.title || null,
          position: i + 1,
          isOurs,
        });

        if (isOurs && !domainCited) {
          domainCited = true;
          citationPosition = i + 1;
          citationUrl = source.url || null;
        }
      }
    }

    // Extract full response text for brand checking
    let fullResponseText: string | null = null;
    if (result.markdown) {
      fullResponseText = result.markdown;
    } else if (result.items && result.items.length > 0) {
      const firstItem = result.items[0];
      if (firstItem.content) {
        fullResponseText = firstItem.content;
      }
    }

    // Check for brand mention in FULL response text
    const brandMentioned = checkBrandMentioned(fullResponseText, businessName);

    // Extract snippet - centered around brand mention if found
    const responseSnippet = extractSnippet(fullResponseText, businessName);

    // Clean and store full response (with fluff removed)
    const fullResponse = cleanLLMResponse(fullResponseText);

    // Extract brand entities mentioned in the response
    const mentionedBrands: LLMBrandEntity[] = [];
    if (result.brand_entities && Array.isArray(result.brand_entities)) {
      for (const entity of result.brand_entities) {
        if (entity.title) {
          mentionedBrands.push({
            title: entity.title,
            category: entity.category || null,
            urls: entity.urls || null,
          });
        }
      }
    }

    // Extract search results (all websites the AI retrieved, including unused)
    const searchResults: LLMSearchResult[] = [];
    if (result.search_results && Array.isArray(result.search_results)) {
      for (const sr of result.search_results) {
        if (sr.url || sr.domain) {
          const domain = sr.domain || extractDomain(sr.url || '');
          searchResults.push({
            url: sr.url || '',
            domain,
            title: sr.title || null,
            description: sr.description || null,
            isOurs: isDomainMatch(domain, targetDomain),
          });
        }
      }
    }

    // Extract fan-out queries (related searches the AI performed)
    const fanOutQueries: string[] = result.fan_out_queries || [];

    console.log(
      `🤖 [DataForSEO AI] ChatGPT: ${citations.length} citations, ` +
      `${searchResults.length} search results, ${fanOutQueries.length} fan-out queries, ` +
      `${mentionedBrands.length} brands mentioned, ` +
      `domain cited: ${domainCited}${citationPosition ? ` (position ${citationPosition})` : ''}, ` +
      `brand mentioned: ${brandMentioned}, ` +
      `cost: $${task.cost}`
    );

    return {
      success: true,
      provider: 'chatgpt',
      question,
      domainCited,
      brandMentioned,
      citationPosition,
      citationUrl,
      totalCitations: citations.length,
      citations,
      mentionedBrands,
      responseSnippet,
      fullResponse,
      searchResults,
      fanOutQueries,
      cost: task.cost || 0,
    };
  } catch (error) {
    console.error('❌ [DataForSEO AI] checkChatGPTVisibility failed:', error);
    return createErrorResult(
      'chatgpt',
      question,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// ============================================
// LLM Responses API (Claude, Gemini, Perplexity)
// ============================================

/**
 * Check visibility using the LLM Responses API.
 *
 * This queries the LLM directly with web search enabled to get citations.
 * Works for Claude, Gemini, and Perplexity.
 *
 * Cost: ~$0.0006 base + provider token costs (~$0.002-0.003 total)
 */
export async function checkLLMResponseVisibility(params: {
  question: string;
  targetDomain: string;
  businessName?: string | null;
  provider: Exclude<LLMProvider, 'chatgpt' | 'ai_overview'>;
}): Promise<LLMCheckResult> {
  const { question, targetDomain, businessName = null, provider } = params;

  const endpoint = LLM_RESPONSES_ENDPOINTS[provider];
  const providerConfig = PROVIDER_CONFIGS[provider];

  if (!endpoint) {
    return createErrorResult(provider, question, `Unsupported provider: ${provider}`);
  }

  // Build request body with provider-specific parameters
  const requestParams: Record<string, any> = {
    user_prompt: question,
    ...providerConfig, // Spread provider-specific config
  };

  const requestBody = [requestParams];

  try {
    const data = await makeDataForSEORequest(
      endpoint,
      requestBody,
      `${provider} check: "${question.substring(0, 50)}..."`
    );

    const task = data.tasks?.[0];
    if (!task) {
      return createErrorResult(provider, question, 'No task returned from API');
    }

    if (task.status_code !== 20000) {
      const friendlyError = getDataForSEOErrorMessage(task.status_code, task.status_message, provider);
      return createErrorResult(provider, question, friendlyError, task.cost);
    }

    const result = task.result?.[0] as LLMResponsesResult | undefined;
    if (!result) {
      return createErrorResult(provider, question, 'No result in task', task.cost);
    }

    // Extract response text and citations
    const citations: LLMCitation[] = [];
    let domainCited = false;
    let citationPosition: number | null = null;
    let citationUrl: string | null = null;
    let fullResponseText: string | null = null;

    // The LLM Responses API returns data in result.items[].sections[].text format
    // NOT in result.message[].content format as previously assumed
    if (result.items && Array.isArray(result.items)) {
      const textParts: string[] = [];
      let citationIndex = 0;

      for (const item of result.items) {
        if (item.sections && Array.isArray(item.sections)) {
          for (const section of item.sections) {
            // Extract text content
            if (section.text) {
              textParts.push(section.text);
            }

            // Extract citations from links if present
            if (section.links && Array.isArray(section.links)) {
              for (const link of section.links) {
                if (link.url) {
                  citationIndex++;
                  const domain = extractDomain(link.url);
                  const isOurs = isDomainMatch(domain, targetDomain);

                  citations.push({
                    domain,
                    url: link.url,
                    title: link.title || link.text || null,
                    position: citationIndex,
                    isOurs,
                  });

                  if (isOurs && !domainCited) {
                    domainCited = true;
                    citationPosition = citationIndex;
                    citationUrl = link.url;
                  }
                }
              }
            }
          }
        }
      }

      fullResponseText = textParts.join('');
    }

    // Extract fan-out queries (searches the AI performed)
    const fanOutQueries: string[] = result.fan_out_queries || [];

    console.log(`🔍 [DataForSEO AI] ${provider} parsed:`, {
      hasItems: !!result.items,
      itemCount: result.items?.length || 0,
      responseLength: fullResponseText?.length || 0,
      citationCount: citations.length,
      fanOutQueryCount: fanOutQueries.length,
    });

    // Check for brand mention in FULL response text
    const brandMentioned = checkBrandMentioned(fullResponseText, businessName);

    // Extract snippet - centered around brand mention if found
    const responseSnippet = extractSnippet(fullResponseText, businessName);

    // Clean and store full response (with fluff removed)
    const fullResponse = cleanLLMResponse(fullResponseText);

    console.log(
      `🤖 [DataForSEO AI] ${provider}: ${citations.length} citations, ` +
      `domain cited: ${domainCited}${citationPosition ? ` (position ${citationPosition})` : ''}, ` +
      `brand mentioned: ${brandMentioned}, ` +
      `cost: $${task.cost}`
    );

    return {
      success: true,
      provider,
      question,
      domainCited,
      brandMentioned,
      citationPosition,
      citationUrl,
      totalCitations: citations.length,
      citations,
      mentionedBrands: [], // LLM Responses API doesn't provide brand_entities like ChatGPT Scraper
      responseSnippet,
      fullResponse,
      searchResults: [], // LLM Responses API doesn't provide search_results like ChatGPT Scraper
      fanOutQueries, // Fan-out queries ARE provided by the LLM Responses API
      cost: task.cost || 0,
    };
  } catch (error) {
    console.error(`❌ [DataForSEO AI] check${provider}Visibility failed:`, error);
    return createErrorResult(
      provider,
      question,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// ============================================
// AI Overview Visibility Check (via Google SERP API)
// ============================================

/**
 * Check visibility in Google AI Overviews using the SERP API.
 *
 * Queries Google SERP with `load_async_ai_overview: true` to get the AI-generated
 * overview at the top of search results. Extracts citations from the `references`
 * array (ai_overview_reference objects).
 *
 * Cost: ~$0.0012 per query
 */
export async function checkAIOverviewVisibility(params: {
  question: string;
  targetDomain: string;
  businessName?: string | null;
  locationCode?: number;
  languageCode?: string;
}): Promise<LLMCheckResult> {
  const {
    question,
    targetDomain,
    businessName = null,
    locationCode = 2840, // US
    languageCode = 'en',
  } = params;

  const requestBody = [
    {
      keyword: question,
      location_code: locationCode,
      language_code: languageCode,
      load_async_ai_overview: true,
    },
  ];

  try {
    const data = await makeDataForSEORequest(
      SERP_ENDPOINT,
      requestBody,
      `AI Overview check: "${question.substring(0, 50)}..."`
    );

    const task = data.tasks?.[0];
    if (!task) {
      return createErrorResult('ai_overview', question, 'No task returned from API');
    }

    if (task.status_code !== 20000) {
      const friendlyError = getDataForSEOErrorMessage(task.status_code, task.status_message, 'ai_overview');
      return createErrorResult('ai_overview', question, friendlyError, task.cost);
    }

    const result = task.result?.[0];
    if (!result) {
      return createErrorResult('ai_overview', question, 'No result in task', task.cost);
    }

    // Find the ai_overview item in the SERP results
    const aiOverviewItem = result.items?.find(
      (item: any) => item.type === 'ai_overview'
    );

    // No AI Overview for this query — not an error, just no coverage
    if (!aiOverviewItem) {
      console.log(
        `🤖 [DataForSEO AI] AI Overview: No AI Overview present for query, cost: $${task.cost}`
      );

      return {
        success: true,
        provider: 'ai_overview',
        question,
        domainCited: false,
        brandMentioned: false,
        citationPosition: null,
        citationUrl: null,
        totalCitations: 0,
        citations: [],
        mentionedBrands: [],
        responseSnippet: null,
        fullResponse: null,
        searchResults: [],
        fanOutQueries: [],
        cost: task.cost || 0,
      };
    }

    // Extract citations from references array
    const citations: LLMCitation[] = [];
    let domainCited = false;
    let citationPosition: number | null = null;
    let citationUrl: string | null = null;

    const references = aiOverviewItem.references || [];
    for (let i = 0; i < references.length; i++) {
      const ref = references[i];
      // References can be ai_overview_reference objects with domain, url, title, source, text
      const domain = ref.domain || (ref.url ? extractDomain(ref.url) : '');
      if (!domain) continue;

      const isOurs = isDomainMatch(domain, targetDomain);

      citations.push({
        domain,
        url: ref.url || null,
        title: ref.title || ref.source || null,
        position: i + 1,
        isOurs,
      });

      if (isOurs && !domainCited) {
        domainCited = true;
        citationPosition = i + 1;
        citationUrl = ref.url || null;
      }
    }

    // Extract response text from the AI Overview
    // The ai_overview item can have items[].text or top-level text/markdown
    let fullResponseText: string | null = null;

    if (aiOverviewItem.items && Array.isArray(aiOverviewItem.items)) {
      const textParts: string[] = [];
      for (const subItem of aiOverviewItem.items) {
        if (subItem.text) {
          textParts.push(subItem.text);
        }
      }
      if (textParts.length > 0) {
        fullResponseText = textParts.join('\n\n');
      }
    }

    // Fallback to top-level text or markdown
    if (!fullResponseText && aiOverviewItem.text) {
      fullResponseText = aiOverviewItem.text;
    }

    // Also check reference text snippets if no main text found
    if (!fullResponseText && references.length > 0) {
      const refTexts = references
        .filter((ref: any) => ref.text)
        .map((ref: any) => ref.text);
      if (refTexts.length > 0) {
        fullResponseText = refTexts.join('\n\n');
      }
    }

    // Check for brand mention in the full response text
    const brandMentioned = checkBrandMentioned(fullResponseText, businessName);

    // Extract snippet centered around brand mention
    const responseSnippet = extractSnippet(fullResponseText, businessName);

    // Clean and store full response
    const fullResponse = cleanLLMResponse(fullResponseText);

    console.log(
      `🤖 [DataForSEO AI] AI Overview: ${citations.length} citations, ` +
      `domain cited: ${domainCited}${citationPosition ? ` (position ${citationPosition})` : ''}, ` +
      `brand mentioned: ${brandMentioned}, ` +
      `cost: $${task.cost}`
    );

    return {
      success: true,
      provider: 'ai_overview',
      question,
      domainCited,
      brandMentioned,
      citationPosition,
      citationUrl,
      totalCitations: citations.length,
      citations,
      mentionedBrands: [],
      responseSnippet,
      fullResponse,
      searchResults: [],
      fanOutQueries: [],
      cost: task.cost || 0,
    };
  } catch (error) {
    console.error('❌ [DataForSEO AI] checkAIOverviewVisibility failed:', error);
    return createErrorResult(
      'ai_overview',
      question,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// ============================================
// Unified Check Function
// ============================================

/**
 * Check visibility for a question across one or more LLM providers.
 *
 * This is the main entry point for LLM visibility checks.
 */
export async function checkLLMVisibility(params: {
  question: string;
  targetDomain: string;
  businessName?: string | null;
  provider: LLMProvider;
}): Promise<LLMCheckResult> {
  const { provider } = params;

  if (provider === 'chatgpt') {
    return checkChatGPTVisibility(params);
  }

  if (provider === 'ai_overview') {
    return checkAIOverviewVisibility(params);
  }

  return checkLLMResponseVisibility({
    ...params,
    provider: provider as Exclude<LLMProvider, 'chatgpt' | 'ai_overview'>,
  });
}

/**
 * Check visibility across multiple LLM providers for a single question.
 *
 * Runs all providers in parallel since each hits a different DataForSEO endpoint.
 */
export async function checkMultipleProviders(params: {
  question: string;
  targetDomain: string;
  businessName?: string | null;
  providers: LLMProvider[];
}): Promise<LLMCheckResult[]> {
  const { question, targetDomain, businessName, providers } = params;

  const results = await Promise.all(
    providers.map(provider =>
      checkLLMVisibility({
        question,
        targetDomain,
        businessName,
        provider,
      })
    )
  );

  return results;
}

/**
 * Check visibility for multiple questions across one or more providers.
 *
 * Processes questions sequentially with delays to avoid rate limiting.
 */
export async function checkMultipleQuestions(params: {
  questions: string[];
  targetDomain: string;
  providers: LLMProvider[];
}): Promise<LLMCheckResult[]> {
  const { questions, targetDomain, providers } = params;
  const results: LLMCheckResult[] = [];

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];

    // Add delay between questions (except for first)
    if (i > 0) {
      await sleep(REQUEST_DELAY);
    }

    const questionResults = await checkMultipleProviders({
      question,
      targetDomain,
      providers,
    });

    results.push(...questionResults);
  }

  return results;
}

// ============================================
// Helper: Create Error Result
// ============================================

/**
 * Map DataForSEO error codes to user-friendly messages.
 * See: https://docs.dataforseo.com/v3/appendix/errors/
 */
function getDataForSEOErrorMessage(statusCode: number, statusMessage: string, provider: LLMProvider): string {
  const providerLabel = provider === 'chatgpt' ? 'ChatGPT' :
    provider === 'claude' ? 'Claude' :
    provider === 'gemini' ? 'Gemini' :
    provider === 'ai_overview' ? 'AI Overviews' : 'Perplexity';

  // Map common error codes to friendly messages
  switch (statusCode) {
    case 50000:
      return `${providerLabel} check failed (service temporarily unavailable). Try again in a few minutes.`;
    case 40000:
      return `${providerLabel} check failed (invalid request). Please try a different question.`;
    case 40100:
      return `${providerLabel} check failed (authentication error). Please contact support.`;
    case 40200:
      return `${providerLabel} check failed (insufficient balance). Please contact support.`;
    case 40400:
      return `${providerLabel} check failed (resource not found). Please try again.`;
    case 40500:
      return `${providerLabel} check failed (rate limit exceeded). Please wait and try again.`;
    case 50100:
      return `${providerLabel} check failed (timeout). The AI took too long to respond. Try again.`;
    default:
      // For unknown errors, provide a clean message without raw details
      if (statusCode >= 50000) {
        return `${providerLabel} check failed (service error). Try again later.`;
      } else if (statusCode >= 40000) {
        return `${providerLabel} check failed. Please try again or contact support.`;
      }
      return `${providerLabel} check failed: ${statusMessage}`;
  }
}

function createErrorResult(
  provider: LLMProvider,
  question: string,
  error: string,
  cost = 0
): LLMCheckResult {
  return {
    success: false,
    provider,
    question,
    domainCited: false,
    brandMentioned: false,
    citationPosition: null,
    citationUrl: null,
    totalCitations: 0,
    citations: [],
    mentionedBrands: [],
    responseSnippet: null,
    fullResponse: null,
    searchResults: [],
    fanOutQueries: [],
    cost,
    error,
  };
}

/**
 * Find the position of a brand mention in text.
 * Returns the index of the match, or -1 if not found.
 */
function findBrandPosition(responseText: string, businessName: string): number {
  const normalizedResponse = responseText.toLowerCase();
  const normalizedBrand = businessName.toLowerCase().trim();

  // Direct match
  const directIndex = normalizedResponse.indexOf(normalizedBrand);
  if (directIndex !== -1) {
    return directIndex;
  }

  // Also check without common suffixes like LLC, Inc, etc.
  const brandWithoutSuffix = normalizedBrand
    .replace(/\s*(llc|inc|corp|ltd|co|company|corporation)\.?$/i, '')
    .trim();

  if (brandWithoutSuffix.length > 2) {
    return normalizedResponse.indexOf(brandWithoutSuffix);
  }

  return -1;
}

/**
 * Check if the business name is mentioned in the response text.
 * Uses case-insensitive matching and handles common variations.
 */
function checkBrandMentioned(responseText: string | null, businessName: string | null): boolean {
  if (!responseText || !businessName) return false;
  return findBrandPosition(responseText, businessName) !== -1;
}

/**
 * Extract a snippet from the response, centered around the brand mention if found.
 * If no brand mention, returns the first MAX_SNIPPET_LENGTH characters.
 */
function extractSnippet(
  fullText: string | null,
  businessName: string | null,
  maxLength: number = MAX_SNIPPET_LENGTH
): string | null {
  if (!fullText) return null;

  // If no business name or brand not found, return start of text
  if (!businessName) {
    return fullText.substring(0, maxLength);
  }

  const brandPosition = findBrandPosition(fullText, businessName);
  if (brandPosition === -1) {
    return fullText.substring(0, maxLength);
  }

  // Center the snippet around the brand mention
  const padding = Math.floor(maxLength / 2);
  let start = Math.max(0, brandPosition - padding);
  let end = Math.min(fullText.length, start + maxLength);

  // Adjust start if we're near the end
  if (end - start < maxLength) {
    start = Math.max(0, end - maxLength);
  }

  let snippet = fullText.substring(start, end);

  // Add ellipsis if truncated
  if (start > 0) {
    snippet = '...' + snippet.substring(3);
  }
  if (end < fullText.length) {
    snippet = snippet.substring(0, snippet.length - 3) + '...';
  }

  return snippet;
}

/**
 * Clean LLM response text by removing common fluff patterns.
 *
 * Removes:
 * - Opening pleasantries ("Great question!", "I'd be happy to help", etc.)
 * - Closing follow-up offers ("Would you like...", "Let me know if...", etc.)
 * - Truncates to MAX_FULL_RESPONSE_LENGTH (3000 chars)
 */
function cleanLLMResponse(
  fullText: string | null,
  maxLength: number = MAX_FULL_RESPONSE_LENGTH
): string | null {
  if (!fullText) return null;

  let cleaned = fullText;

  // Strip opening fluff patterns (case-insensitive)
  const openingPatterns = [
    /^(Great question!?\s*)/i,
    /^(That's a great question!?\s*)/i,
    /^(That's an? (excellent|good|interesting) question!?\s*)/i,
    /^(I'd be happy to help[^.!]*[.!]?\s*)/i,
    /^(I would be happy to help[^.!]*[.!]?\s*)/i,
    /^(Sure!?\s*)/i,
    /^(Absolutely!?\s*)/i,
    /^(Of course!?\s*)/i,
    /^(Certainly!?\s*)/i,
    /^(Yes,?\s*)/i,
    /^(Thanks for (asking|your question)[^.!]*[.!]?\s*)/i,
    /^(Good question!?\s*)/i,
  ];

  for (const pattern of openingPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Strip closing fluff patterns (find and remove from end of text)
  // These patterns typically start a new paragraph
  const closingPatterns = [
    /\n\n+(Would you like[^]*?)$/i,
    /\n\n+(Is there anything else[^]*?)$/i,
    /\n\n+(Let me know if[^]*?)$/i,
    /\n\n+(Feel free to[^]*?)$/i,
    /\n\n+(I hope this helps[^]*?)$/i,
    /\n\n+(If you('d| would) like[^]*?)$/i,
    /\n\n+(Do you have any[^]*?)$/i,
    /\n\n+(Please let me know[^]*?)$/i,
    /\n\n+(Should I[^]*?)$/i,
    /\n\n+(Want me to[^]*?)$/i,
  ];

  for (const pattern of closingPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Trim whitespace
  cleaned = cleaned.trim();

  // Cap at max length, trying to break at sentence boundary
  if (cleaned.length > maxLength) {
    // Find last sentence boundary within limit
    const truncated = cleaned.substring(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('. ');
    const lastQuestion = truncated.lastIndexOf('? ');
    const lastExclaim = truncated.lastIndexOf('! ');
    const lastBreak = Math.max(lastPeriod, lastQuestion, lastExclaim);

    if (lastBreak > maxLength * 0.7) {
      // Break at sentence if we're at least 70% through
      cleaned = truncated.substring(0, lastBreak + 1).trim();
    } else {
      // Just truncate with ellipsis
      cleaned = truncated.trim() + '...';
    }
  }

  return cleaned.length > 0 ? cleaned : null;
}

// ============================================
// Cost Estimation
// ============================================

/**
 * Estimate the cost of LLM visibility checks.
 *
 * These are approximate costs based on DataForSEO pricing:
 * - ChatGPT Scraper: ~$0.004 per query
 * - LLM Responses (Claude/Gemini/Perplexity): ~$0.0006 + token costs (~$0.002-0.003)
 */
export const ESTIMATED_COSTS: Record<LLMProvider, number> = {
  chatgpt: 0.004,
  claude: 0.003,
  gemini: 0.002,
  perplexity: 0.003,
  ai_overview: 0.0012,
};

export function estimateTotalCost(
  questionCount: number,
  providers: LLMProvider[]
): number {
  const costPerQuestion = providers.reduce(
    (sum, provider) => sum + ESTIMATED_COSTS[provider],
    0
  );
  return questionCount * costPerQuestion;
}
