/**
 * Competitor Analysis for Web Page Outlines
 *
 * Scrapes top Google results for a keyword to extract page structure,
 * then feeds that intel into the outline generation prompt.
 */

import * as cheerio from 'cheerio';
import { searchGoogleSerp } from '@/features/rank-tracking/api/dataforseo-serp-client';

// --- Types ---

export interface CompetitorPageData {
  url: string;
  title: string;
  metaDescription: string;
  h1: string[];
  h2s: string[];
  estimatedWordCount: number;
  scraped: true;
}

export interface CompetitorScrapeFailure {
  url: string;
  scraped: false;
  error: string;
}

export type CompetitorResult = CompetitorPageData | CompetitorScrapeFailure;

const SCRAPE_TIMEOUT_MS = 5_000;
const MAX_COMPETITORS = 3;
const DEFAULT_LOCATION_CODE = 2840; // USA

// --- Public Functions ---

/**
 * Fetch the top organic competitor URLs for a keyword via DataForSEO SERP.
 * Returns up to 3 URLs, skipping any that match the user's own domain.
 * Falls back gracefully if DataForSEO creds are missing or the call fails.
 */
export async function fetchTopCompetitors(
  keyword: string,
  userDomain?: string,
  locationCode: number = DEFAULT_LOCATION_CODE
): Promise<string[]> {
  // Check for DataForSEO credentials
  if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD) {
    console.log('[competitorAnalysis] DataForSEO credentials not configured, skipping');
    return [];
  }

  try {
    const result = await searchGoogleSerp({
      keyword,
      locationCode,
      depth: 10,
    });

    if (!result.success || !result.items.length) {
      console.log('[competitorAnalysis] SERP call returned no results');
      return [];
    }

    // Normalize user domain for comparison
    const normalizedUserDomain = userDomain
      ? userDomain.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '').toLowerCase()
      : null;

    const urls: string[] = [];
    for (const item of result.items) {
      if (urls.length >= MAX_COMPETITORS) break;

      // Skip the user's own domain
      if (normalizedUserDomain) {
        const itemDomain = item.domain.replace(/^www\./, '').toLowerCase();
        if (itemDomain === normalizedUserDomain) continue;
      }

      if (item.url) {
        urls.push(item.url);
      }
    }

    console.log(`[competitorAnalysis] Found ${urls.length} competitor URLs for "${keyword}"`);
    return urls;
  } catch (error) {
    console.error('[competitorAnalysis] fetchTopCompetitors failed:', error);
    return [];
  }
}

/**
 * Scrape competitor pages in parallel to extract structure data.
 * Uses Promise.allSettled so partial results are returned even if some fail.
 */
export async function scrapeCompetitorPages(
  urls: string[]
): Promise<CompetitorResult[]> {
  if (!urls.length) return [];

  const results = await Promise.allSettled(
    urls.map((url) => scrapeOneUrl(url))
  );

  return results.map((result, i) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      url: urls[i],
      scraped: false as const,
      error: result.reason?.message || 'Unknown scrape error',
    };
  });
}

/**
 * Format scraped competitor data into a concise text block for the AI prompt.
 * Returns empty string if no useful data was scraped.
 */
export function buildCompetitorContext(
  keyword: string,
  competitors: CompetitorResult[]
): string {
  const successfulScrapes = competitors.filter(
    (c): c is CompetitorPageData => c.scraped
  );

  if (!successfulScrapes.length) return '';

  const lines: string[] = [
    `Competitive landscape (top Google results for "${keyword}"):`,
    '',
  ];

  competitors.forEach((comp, i) => {
    const num = i + 1;
    if (comp.scraped) {
      const title = comp.title || '(no title)';
      const domain = extractDomain(comp.url);
      lines.push(
        `${num}. "${title}" (${domain}) — ~${comp.estimatedWordCount.toLocaleString()} words`
      );
      if (comp.h2s.length) {
        lines.push(`   H2s: ${comp.h2s.join(', ')}`);
      }
      if (comp.metaDescription) {
        const truncated =
          comp.metaDescription.length > 120
            ? comp.metaDescription.slice(0, 120) + '...'
            : comp.metaDescription;
        lines.push(`   Meta: "${truncated}"`);
      }
    } else {
      lines.push(`${num}. (${extractDomain(comp.url)} — scrape failed, skipped)`);
    }
    lines.push('');
  });

  return lines.join('\n').trim();
}

// --- Internal Helpers ---

/**
 * Scrape a single URL with a timeout. Extracts structural data using Cheerio.
 */
async function scrapeOneUrl(url: string): Promise<CompetitorPageData> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; PromptReviewsBot/1.0; +https://promptreviews.app)',
        Accept: 'text/html',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove scripts and styles before text extraction
    $('script, style, noscript, iframe').remove();

    const title = $('title').first().text().trim();
    const metaDescription =
      $('meta[name="description"]').attr('content')?.trim() || '';

    const h1: string[] = [];
    $('h1').each((_, el) => {
      const text = $(el).text().trim();
      if (text) h1.push(text);
    });

    const h2s: string[] = [];
    $('h2').each((_, el) => {
      const text = $(el).text().trim();
      if (text) h2s.push(text);
    });

    // Estimate word count from visible body text
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const estimatedWordCount = bodyText
      ? bodyText.split(/\s+/).length
      : 0;

    return {
      url,
      title,
      metaDescription,
      h1,
      h2s,
      estimatedWordCount,
      scraped: true,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
