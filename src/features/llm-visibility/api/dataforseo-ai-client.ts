/**
 * DataForSEO AI Optimization API Client
 *
 * Wrapper for DataForSEO's AI Optimization APIs to track brand visibility
 * in AI assistants (ChatGPT, Claude, Gemini, Perplexity).
 *
 * API Documentation:
 * - ChatGPT Scraper: https://docs.dataforseo.com/v3/ai_optimization-chat_gpt-llm_scraper-live-advanced/
 * - LLM Responses: https://docs.dataforseo.com/v3/ai_optimization/llm_responses/live/
 */

import {
  LLMProvider,
  LLMCheckResult,
  LLMCitation,
} from '../utils/types';

// ============================================
// Configuration
// ============================================

const DATAFORSEO_API_BASE = 'https://api.dataforseo.com/v3';

// ChatGPT Scraper - scrapes actual ChatGPT search results
const CHATGPT_SCRAPER_ENDPOINT = '/ai_optimization/chat_gpt/llm_scraper/live/advanced';

// LLM Responses - queries LLMs directly via DataForSEO
const LLM_RESPONSES_ENDPOINTS: Record<Exclude<LLMProvider, 'chatgpt'>, string> = {
  claude: '/ai_optimization/claude/llm_responses/live',
  gemini: '/ai_optimization/gemini/llm_responses/live',
  perplexity: '/ai_optimization/perplexity/llm_responses/live',
};

// Provider-specific request configurations
// model_name is REQUIRED for all LLM Response APIs
// See: https://docs.dataforseo.com/v3/ai_optimization/
const PROVIDER_CONFIGS: Record<Exclude<LLMProvider, 'chatgpt'>, Record<string, any>> = {
  claude: {
    model_name: 'claude-sonnet-4-0', // Latest Claude Sonnet model
  },
  gemini: {
    model_name: 'gemini-2.0-flash', // Latest Gemini Flash model
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
  search_results?: any[];
  sources?: Array<{
    domain: string;
    url?: string;
    title?: string;
  }>;
  brand_entities?: any[];
  items?: any[];
}

// LLM Responses specific result
interface LLMResponsesResult {
  model: string;
  input_tokens: number;
  output_tokens: number;
  money_spent: number;
  message: Array<{
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
      throw new Error(`API returned ${response.status}: ${errorText}`);
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
  locationCode?: number;
  languageCode?: string;
}): Promise<LLMCheckResult> {
  const {
    question,
    targetDomain,
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
      return createErrorResult('chatgpt', question, `Task failed: ${task.status_message}`, task.cost);
    }

    const result = task.result?.[0] as ChatGPTScraperResult | undefined;
    if (!result) {
      return createErrorResult('chatgpt', question, 'No result in task', task.cost);
    }

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

    // Extract response snippet from markdown or items
    let responseSnippet: string | null = null;
    if (result.markdown) {
      responseSnippet = result.markdown.substring(0, MAX_SNIPPET_LENGTH);
    } else if (result.items && result.items.length > 0) {
      const firstItem = result.items[0];
      if (firstItem.content) {
        responseSnippet = firstItem.content.substring(0, MAX_SNIPPET_LENGTH);
      }
    }

    console.log(
      `🤖 [DataForSEO AI] ChatGPT: ${citations.length} citations, ` +
      `domain cited: ${domainCited}${citationPosition ? ` (position ${citationPosition})` : ''}, ` +
      `cost: $${task.cost}`
    );

    return {
      success: true,
      provider: 'chatgpt',
      question,
      domainCited,
      citationPosition,
      citationUrl,
      totalCitations: citations.length,
      citations,
      responseSnippet,
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
  provider: Exclude<LLMProvider, 'chatgpt'>;
}): Promise<LLMCheckResult> {
  const { question, targetDomain, provider } = params;

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
      return createErrorResult(provider, question, `Task failed: ${task.status_message}`, task.cost);
    }

    const result = task.result?.[0] as LLMResponsesResult | undefined;
    if (!result) {
      return createErrorResult(provider, question, 'No result in task', task.cost);
    }

    // Extract citations from annotations in assistant message
    const citations: LLMCitation[] = [];
    let domainCited = false;
    let citationPosition: number | null = null;
    let citationUrl: string | null = null;
    let responseSnippet: string | null = null;

    // Find the assistant message
    const assistantMessage = result.message?.find(m => m.role === 'assistant');

    if (assistantMessage) {
      // Get response snippet from content
      if (assistantMessage.content) {
        responseSnippet = assistantMessage.content.substring(0, MAX_SNIPPET_LENGTH);
      }

      // Extract citations from annotations
      if (assistantMessage.annotations && Array.isArray(assistantMessage.annotations)) {
        for (let i = 0; i < assistantMessage.annotations.length; i++) {
          const annotation = assistantMessage.annotations[i];
          if (annotation.url) {
            const domain = extractDomain(annotation.url);
            const isOurs = isDomainMatch(domain, targetDomain);

            citations.push({
              domain,
              url: annotation.url,
              title: annotation.title || null,
              position: i + 1,
              isOurs,
            });

            if (isOurs && !domainCited) {
              domainCited = true;
              citationPosition = i + 1;
              citationUrl = annotation.url;
            }
          }
        }
      }
    }

    console.log(
      `🤖 [DataForSEO AI] ${provider}: ${citations.length} citations, ` +
      `domain cited: ${domainCited}${citationPosition ? ` (position ${citationPosition})` : ''}, ` +
      `cost: $${task.cost}`
    );

    return {
      success: true,
      provider,
      question,
      domainCited,
      citationPosition,
      citationUrl,
      totalCitations: citations.length,
      citations,
      responseSnippet,
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
  provider: LLMProvider;
}): Promise<LLMCheckResult> {
  const { provider } = params;

  if (provider === 'chatgpt') {
    return checkChatGPTVisibility(params);
  }

  return checkLLMResponseVisibility({
    ...params,
    provider: provider as Exclude<LLMProvider, 'chatgpt'>,
  });
}

/**
 * Check visibility across multiple LLM providers for a single question.
 *
 * Processes providers sequentially with delays to avoid rate limiting.
 */
export async function checkMultipleProviders(params: {
  question: string;
  targetDomain: string;
  providers: LLMProvider[];
}): Promise<LLMCheckResult[]> {
  const { question, targetDomain, providers } = params;
  const results: LLMCheckResult[] = [];

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];

    // Add delay between requests (except for first)
    if (i > 0) {
      await sleep(REQUEST_DELAY);
    }

    const result = await checkLLMVisibility({
      question,
      targetDomain,
      provider,
    });

    results.push(result);
  }

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
    citationPosition: null,
    citationUrl: null,
    totalCitations: 0,
    citations: [],
    responseSnippet: null,
    cost,
    error,
  };
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
