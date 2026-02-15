/**
 * Competitor Analysis for Web Page Outlines
 *
 * Scrapes top Google results for a keyword to extract page structure,
 * then feeds that intel into the outline generation prompt.
 */

import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import { searchGoogleSerp } from '@/features/rank-tracking/api/dataforseo-serp-client';

// --- Types ---

export interface H2Section {
  heading: string;
  snippet: string;
}

export interface CompetitorPageData {
  url: string;
  title: string;
  metaDescription: string;
  h1: string[];
  h2s: string[];
  h2Sections: H2Section[];
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
const MAX_H2_SECTIONS = 10;
const SNIPPET_WORD_LIMIT = 80;

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
 * Accepts optional pre-computed topics (e.g. AI-refined) to avoid re-analyzing.
 */
export function buildCompetitorContext(
  keyword: string,
  competitors: CompetitorResult[],
  precomputedTopics?: TopicCluster[]
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
      if (comp.metaDescription) {
        const truncated =
          comp.metaDescription.length > 120
            ? comp.metaDescription.slice(0, 120) + '...'
            : comp.metaDescription;
        lines.push(`   Meta: "${truncated}"`);
      }
      // Include H2 sections with content snippets
      if (comp.h2Sections.length) {
        lines.push('');
        for (const section of comp.h2Sections) {
          lines.push(`   H2: "${section.heading}"`);
          if (section.snippet) {
            lines.push(`     > ${section.snippet}`);
          }
        }
      } else if (comp.h2s.length) {
        // Fallback to flat H2 list if no sections extracted
        lines.push(`   H2s: ${comp.h2s.join(', ')}`);
      }
    } else {
      lines.push(`${num}. (${extractDomain(comp.url)} — scrape failed, skipped)`);
    }
    lines.push('');
  });

  // Append word count target
  const wordCountTarget = calculateWordCountTarget(competitors);
  if (wordCountTarget) {
    lines.push(
      `Recommended content length: aim for ${wordCountTarget.min.toLocaleString()}-${wordCountTarget.max.toLocaleString()} words (competitor median: ~${wordCountTarget.median.toLocaleString()} words).`
    );
    lines.push('');
  }

  // Append topic analysis when 2+ pages were successfully scraped
  if (successfulScrapes.length >= 2) {
    const clusters = precomputedTopics ?? analyzeCommonTopics(successfulScrapes);
    const topicSection = formatTopicAnalysis(clusters, successfulScrapes.length);
    if (topicSection) {
      lines.push(topicSection);
    }
  }

  return lines.join('\n').trim();
}

/**
 * Build a persistable CompetitorData object from scraped results.
 * Includes topic clusters, competitor URLs, and word count target.
 * Accepts optional pre-computed topics (e.g. AI-refined) to avoid re-analyzing.
 * Returns null if no successful scrapes.
 */
export function buildCompetitorData(
  competitors: CompetitorResult[],
  precomputedTopics?: TopicCluster[]
): {
  urls: { url: string; title: string; wordCount: number }[];
  topics: {
    topic: string;
    frequency: number;
    examples: { heading: string; domain: string }[];
    sampleSnippet?: string;
  }[];
  wordCountTarget: { min: number; max: number; median: number } | null;
} | null {
  const successfulScrapes = competitors.filter(
    (c): c is CompetitorPageData => c.scraped
  );

  if (!successfulScrapes.length) return null;

  const urls = successfulScrapes.map((c) => ({
    url: c.url,
    title: c.title,
    wordCount: c.estimatedWordCount,
  }));

  const clusters = precomputedTopics ??
    (successfulScrapes.length >= 2 ? analyzeCommonTopics(successfulScrapes) : []);

  const topics = clusters.map((c) => ({
    topic: c.topic,
    frequency: c.frequency,
    examples: c.examples,
    ...(c.sampleSnippet ? { sampleSnippet: c.sampleSnippet } : {}),
  }));

  const wordCountTarget = calculateWordCountTarget(competitors);

  return { urls, topics, wordCountTarget };
}

/**
 * Calculate a recommended word count target range based on competitor data.
 * Uses median word count with a -15% to +20% range, clamped between 500 and 5000.
 * Returns null if no successful scrapes.
 */
export function calculateWordCountTarget(
  competitors: CompetitorResult[]
): { min: number; max: number; median: number } | null {
  const wordCounts = competitors
    .filter((c): c is CompetitorPageData => c.scraped)
    .map((c) => c.estimatedWordCount)
    .filter((wc) => wc > 0);

  if (wordCounts.length === 0) return null;

  wordCounts.sort((a, b) => a - b);
  const mid = Math.floor(wordCounts.length / 2);
  const median =
    wordCounts.length % 2 === 0
      ? Math.round((wordCounts[mid - 1] + wordCounts[mid]) / 2)
      : wordCounts[mid];

  const roundTo50 = (n: number) => Math.round(n / 50) * 50;
  const min = Math.max(500, roundTo50(median * 0.85));
  const max = Math.min(5000, roundTo50(median * 1.2));

  return { min, max, median };
}

// --- Topic Analysis ---

/**
 * Common non-content headings found in navigation, footers, and sidebars.
 * Matched case-insensitively against H2 text to filter before clustering.
 */
const BOILERPLATE_HEADINGS = new Set([
  'quick links',
  'useful links',
  'helpful links',
  'related links',
  'important links',
  'follow us',
  'connect with us',
  'stay connected',
  'social media',
  'my account',
  'user account',
  'account',
  'sign in',
  'log in',
  'login',
  'register',
  'contact us',
  'contact information',
  'get in touch',
  'reach us',
  'newsletter',
  'subscribe',
  'sign up for updates',
  'about us',
  'about the author',
  'share this',
  'share this page',
  'recent posts',
  'recent articles',
  'popular posts',
  'related articles',
  'related posts',
  'categories',
  'tags',
  'archives',
  'comments',
  'leave a comment',
  'leave a reply',
  'site map',
  'sitemap',
  'privacy policy',
  'terms of service',
  'terms and conditions',
  'cookie policy',
  'disclaimer',
  'legal',
  'copyright',
  'all rights reserved',
  'breadcrumb',
  'navigation',
  'menu',
  'search',
  'search results',
  'advertisement',
  'sponsored',
  'table of contents',
]);

/** Returns true if the heading looks like navigation/footer chrome rather than content. */
function isBoilerplateHeading(heading: string): boolean {
  const normalized = heading.toLowerCase().trim();
  if (BOILERPLATE_HEADINGS.has(normalized)) return true;
  // Also catch very short generic headings (1 word, common UI labels)
  if (/^(menu|login|signup|search|share|home|back|next|previous|more)$/i.test(normalized)) return true;
  return false;
}

interface TopicCluster {
  topic: string;
  frequency: number;
  examples: { heading: string; domain: string }[];
  sampleSnippet?: string;
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'our', 'your', 'my', 'his', 'her', 'its', 'their',
  'we', 'you', 'it', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'into', 'about', 'not', 'no', 'do', 'does',
  'did', 'will', 'would', 'can', 'could', 'should', 'may', 'might',
  'shall', 'has', 'have', 'had', 'that', 'this', 'these', 'those',
  'what', 'which', 'who', 'whom', 'how', 'why', 'when', 'where',
  'all', 'each', 'every', 'both', 'more', 'most', 'other', 'some',
  'such', 'than', 'too', 'very', 'just', 'also', 'so', 'get', 'got',
]);

/**
 * Normalize an H2: lowercase, strip punctuation, remove stop words.
 * Returns significant words (2+ chars, not a stop word).
 */
function extractSignificantWords(heading: string): string[] {
  return heading
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
}

/**
 * Analyze H2s across competitor pages to identify common topic clusters.
 * Uses simple keyword overlap: two headings belong to the same topic
 * if they share at least one significant word.
 *
 * Returns clusters sorted by frequency (descending), then alphabetically.
 */
export function analyzeCommonTopics(
  competitors: CompetitorPageData[]
): TopicCluster[] {
  if (competitors.length < 2) return [];

  // Collect all H2s with their source domain and snippet
  const entries: { heading: string; domain: string; words: string[]; snippet: string }[] = [];
  for (const comp of competitors) {
    const domain = extractDomain(comp.url);
    // Build a snippet lookup from h2Sections
    const snippetMap = new Map<string, string>();
    for (const sec of comp.h2Sections) {
      snippetMap.set(sec.heading, sec.snippet);
    }
    for (const h2 of comp.h2s) {
      if (isBoilerplateHeading(h2)) continue;
      const words = extractSignificantWords(h2);
      if (words.length > 0) {
        entries.push({ heading: h2, domain, words, snippet: snippetMap.get(h2) || '' });
      }
    }
  }

  if (entries.length === 0) return [];

  // Union-find for grouping entries
  const parent: number[] = entries.map((_, i) => i);
  function find(x: number): number {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  }
  function union(a: number, b: number): void {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  }

  // Group entries that share a significant word AND come from different domains
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      if (entries[i].domain === entries[j].domain) continue;
      const shared = entries[i].words.some((w) => entries[j].words.includes(w));
      if (shared) union(i, j);
    }
  }

  // Build clusters
  const clusterMap = new Map<number, number[]>();
  for (let i = 0; i < entries.length; i++) {
    const root = find(i);
    if (!clusterMap.has(root)) clusterMap.set(root, []);
    clusterMap.get(root)!.push(i);
  }

  const clusters: TopicCluster[] = [];
  for (const indices of clusterMap.values()) {
    // Count distinct competitor domains in this cluster
    const domains = new Set(indices.map((i) => entries[i].domain));
    const frequency = domains.size;

    // Pick the most common significant words as the topic label
    const wordCounts = new Map<string, number>();
    for (const i of indices) {
      for (const w of entries[i].words) {
        wordCounts.set(w, (wordCounts.get(w) || 0) + 1);
      }
    }
    const sortedWords = [...wordCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([w]) => w);
    // Use the top 1-2 words as the topic label
    const topic = sortedWords.slice(0, 2).join(' / ') || 'misc';
    // Capitalize first letter
    const topicLabel = topic.charAt(0).toUpperCase() + topic.slice(1);

    const examples = indices.map((i) => ({
      heading: entries[i].heading,
      domain: entries[i].domain,
    }));

    // Pick the longest snippet from the cluster as a representative sample
    const longestSnippet = indices
      .map((i) => entries[i].snippet)
      .filter(Boolean)
      .sort((a, b) => b.length - a.length)[0] || '';
    // Truncate to ~40 words for the topic analysis
    const sampleSnippet = longestSnippet
      ? truncateToWords(longestSnippet, 40)
      : undefined;

    clusters.push({ topic: topicLabel, frequency, examples, sampleSnippet });
  }

  // Sort: highest frequency first, then alphabetically
  clusters.sort((a, b) => b.frequency - a.frequency || a.topic.localeCompare(b.topic));
  return clusters;
}

/**
 * Format topic clusters into a readable text section for the AI prompt.
 */
function formatTopicAnalysis(
  clusters: TopicCluster[],
  totalCompetitors: number
): string {
  if (clusters.length === 0) return '';

  const lines: string[] = ['Topic analysis:', ''];

  const mustCover = clusters.filter((c) => c.frequency === totalCompetitors);
  const recommended = clusters.filter(
    (c) => c.frequency > 1 && c.frequency < totalCompetitors
  );
  const unique = clusters.filter((c) => c.frequency === 1);

  if (mustCover.length > 0) {
    lines.push(
      `Must-cover topics (appeared in all ${totalCompetitors} pages):`
    );
    for (const c of mustCover) {
      const seen = c.examples.map((e) => `"${e.heading}"`).join(', ');
      lines.push(`  • ${c.topic} — seen as: ${seen}`);
      if (c.sampleSnippet) {
        lines.push(`    Context: ${c.sampleSnippet}`);
      }
    }
    lines.push('');
  }

  if (recommended.length > 0) {
    lines.push(
      `Recommended topics (appeared in ${recommended[0].frequency} of ${totalCompetitors} pages):`
    );
    for (const c of recommended) {
      const seen = c.examples.map((e) => `"${e.heading}"`).join(', ');
      lines.push(`  • ${c.topic} — seen as: ${seen}`);
      if (c.sampleSnippet) {
        lines.push(`    Context: ${c.sampleSnippet}`);
      }
    }
    lines.push('');
  }

  if (unique.length > 0) {
    lines.push('Unique angles (appeared in only 1 page):');
    for (const c of unique) {
      const ex = c.examples[0];
      lines.push(`  • "${ex.heading}" (${ex.domain})`);
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}

// --- AI Topic Refinement ---

/**
 * Use a lightweight AI model to filter out remaining non-content topics
 * and produce clearer, more descriptive topic labels.
 * Falls back to the original topics if the AI call fails.
 */
export async function refineTopicsWithAI(
  keyword: string,
  topics: TopicCluster[]
): Promise<TopicCluster[]> {
  if (topics.length === 0) return topics;

  if (!process.env.OPENAI_API_KEY) {
    console.log('[competitorAnalysis] No OpenAI key, skipping topic refinement');
    return topics;
  }

  try {
    const topicList = topics.map((t, i) => ({
      index: i,
      label: t.topic,
      frequency: t.frequency,
      headings: t.examples.map((e) => e.heading),
      snippet: t.sampleSnippet || '',
    }));

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You clean up topic clusters extracted from competitor web pages for the keyword provided.

Your job:
1. REMOVE topics that are NOT actual content topics — navigation menus, footer links, user account sections, social media buttons, contact info blocks, cookie notices, legal pages, sidebar widgets, breadcrumbs, etc.
2. IMPROVE topic labels to be clear and descriptive (e.g. "Certification requirements" instead of "certification / requirements", or "Athletic trainer vs personal trainer" instead of "additional / common").

Return JSON: { "topics": [{ "index": <original index>, "label": "<improved label>" }] }

Only include genuine content topics relevant to the keyword. Omit anything that is clearly site navigation or page chrome. Keep labels concise (2-5 words). Use sentence case.`,
        },
        {
          role: 'user',
          content: `Keyword: "${keyword}"\n\nTopic clusters:\n${JSON.stringify(topicList, null, 2)}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return topics;

    const parsed: { topics: { index: number; label: string }[] } = JSON.parse(content);
    if (!Array.isArray(parsed.topics)) return topics;

    const refined: TopicCluster[] = [];
    for (const item of parsed.topics) {
      const original = topics[item.index];
      if (original && item.label) {
        refined.push({ ...original, topic: item.label });
      }
    }

    if (refined.length === 0) return topics;

    // Preserve original sort: frequency desc, then alphabetically
    refined.sort((a, b) => b.frequency - a.frequency || a.topic.localeCompare(b.topic));

    console.log(
      `[competitorAnalysis] AI refined topics: ${topics.length} → ${refined.length} (removed ${topics.length - refined.length} non-content)`
    );
    return refined;
  } catch (error) {
    console.warn('[competitorAnalysis] AI topic refinement failed, using raw topics:', error);
    return topics;
  }
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

    // Remove scripts, styles, and non-content page chrome before text extraction
    $('script, style, noscript, iframe').remove();
    $('nav, footer, header, aside').remove();
    $('[role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"]').remove();

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

    // Extract H2 sections with content snippets (capped at MAX_H2_SECTIONS)
    const h2Sections: H2Section[] = [];
    $('h2').each((_, el) => {
      if (h2Sections.length >= MAX_H2_SECTIONS) return false; // break
      const heading = $(el).text().trim();
      if (!heading) return; // continue

      const siblings = $(el).nextUntil('h1, h2, h3, h4, h5, h6');
      const rawText = siblings.map((__, sib) => $(sib).text().trim()).get().join(' ');
      const words = rawText.split(/\s+/).filter(Boolean);
      const snippet = words.slice(0, SNIPPET_WORD_LIMIT).join(' ') +
        (words.length > SNIPPET_WORD_LIMIT ? '...' : '');

      h2Sections.push({ heading, snippet });
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
      h2Sections,
      estimatedWordCount,
      scraped: true,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function truncateToWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '...';
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
