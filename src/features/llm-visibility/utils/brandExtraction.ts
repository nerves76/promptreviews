/**
 * Extract brand/company names from LLM response text.
 *
 * LLM responses use semi-structured markdown patterns (bold, numbered lists,
 * headers) that reliably wrap entity names. This utility extracts those names
 * as a fallback when structured brand data (e.g. DataForSEO brand_entities)
 * is unavailable.
 */

// Known generic terms in the review management space — never brand names
const GENERIC_INDUSTRY_TERMS = new Set([
  // Industry categories
  'reputation management', 'review management', 'sentiment analysis',
  'customer feedback', 'online reviews', 'digital marketing', 'local seo',
  'social media marketing', 'customer experience', 'brand management',
  'online reputation', 'review marketing', 'feedback management',
  'customer engagement', 'review strategy', 'customer satisfaction',
  'business reputation', 'brand monitoring', 'review monitoring',
  'customer retention', 'review generation', 'customer loyalty',
  // Feature descriptions
  'ease of use', 'automated review requests', 'centralized review monitoring',
  'multi-platform support', 'api integration', 'review aggregation',
  'white-label solution', 'review response', 'review solicitation',
  'review collection', 'review display', 'review widget', 'review widgets',
  'custom branding', 'email templates', 'sms requests', 'drip campaigns',
  'review filtering', 'negative review alerts', 'review notifications',
  'auto-response', 'response templates', 'ai responses', 'ai-powered responses',
  'review analytics', 'sentiment tracking', 'competitor analysis',
  'competitor tracking', 'competitive analysis', 'competitive intelligence',
  // Platform features
  'google reviews', 'google my business', 'google business profile',
  'facebook reviews', 'yelp reviews', 'star ratings', 'tripadvisor reviews',
  'bbb reviews', 'trustpilot reviews', 'online listings',
  'google maps', 'apple maps', 'bing places',
  // Generic business terms
  'small business', 'enterprise solution', 'saas platform', 'saas tool',
  'customer support', 'help desk', 'knowledge base', 'user interface',
  'dashboard', 'reporting tools', 'mobile app', 'browser extension',
]);

// Suffixes that indicate a generic descriptor phrase, not a brand name
const GENERIC_SUFFIXES = [
  'management', 'analysis', 'monitoring', 'optimization', 'automation',
  'integration', 'tracking', 'analytics', 'reporting', 'generation',
  'collection', 'aggregation', 'marketing', 'software', 'platform',
  'solution', 'service', 'services', 'tools', 'system', 'systems',
];

// Adjective prefixes that signal a feature description, not a brand name
const GENERIC_PREFIXES = [
  'automated', 'centralized', 'customizable', 'advanced', 'comprehensive',
  'integrated', 'multi-platform', 'multi-channel', 'real-time', 'ai-powered',
  'cloud-based', 'enterprise-grade', 'scalable', 'robust', 'seamless',
];

/**
 * Clean markdown formatting artifacts from a brand name.
 *
 * Strips bold markers, numbered/bulleted list prefixes, and excess whitespace.
 */
export function cleanBrandName(raw: string): string {
  let name = raw;

  // Remove markdown bold markers: **text** → text
  name = name.replace(/\*\*/g, '');

  // Remove numbered list prefixes: "1. ", "2) "
  name = name.replace(/^\d+[\.\)]\s+/, '');

  // Remove bullet prefixes: "- ", "* "
  name = name.replace(/^[\-\*]\s+/, '');

  // Trim whitespace and trailing punctuation
  name = name.replace(/[\s\-–—:.,;!?]+$/, '').trim();

  return name;
}

/**
 * Determine whether a string looks like an actual brand/company name.
 *
 * Returns `false` for generic industry terms, feature descriptions, and
 * overly long phrases that are unlikely to be brand names.
 */
export function isLikelyBrandName(name: string): boolean {
  if (!name || name.trim().length < 2) return false;

  const lower = name.toLowerCase().trim();
  const words = lower.split(/\s+/);

  // 1. Exact blocklist match
  if (GENERIC_INDUSTRY_TERMS.has(lower)) return false;

  // 2. Length heuristic — 5+ words is almost never a brand name
  if (words.length >= 5) return false;

  // 3. Suffix heuristic — multi-word phrases ending in generic descriptors
  if (words.length >= 2) {
    const lastWord = words[words.length - 1];
    if (GENERIC_SUFFIXES.includes(lastWord)) return false;
  }

  // 4. Generic prefix pattern — "automated X", "comprehensive Y", etc.
  if (GENERIC_PREFIXES.includes(words[0])) return false;

  return true;
}

// Words that commonly start false-positive matches (section headers, generic phrases)
const STOPWORD_STARTS = new Set([
  'the', 'this', 'that', 'these', 'those',
  'here', 'there', 'where', 'what', 'which', 'who', 'how', 'why', 'when',
  'key', 'top', 'best', 'most', 'some', 'many', 'several', 'various',
  'other', 'more', 'less', 'each', 'every', 'both', 'all', 'any',
  'important', 'notable', 'popular', 'common', 'major', 'leading',
  'recommended', 'suggested', 'consider', 'example', 'examples',
  'overview', 'summary', 'conclusion', 'introduction', 'note', 'notes',
  'pros', 'cons', 'features', 'benefits', 'advantages', 'disadvantages',
  'step', 'steps', 'tip', 'tips', 'option', 'options', 'alternative', 'alternatives',
  'however', 'additionally', 'furthermore', 'therefore', 'also',
  'pricing', 'price', 'cost', 'free', 'paid',
  'yes', 'no', 'not', 'but', 'and', 'for', 'with', 'from',
]);

// Generic phrases that are never brand names
const GENERIC_PHRASES = new Set([
  'click here', 'learn more', 'read more', 'see more', 'find out',
  'for example', 'in addition', 'on the other hand', 'in conclusion',
  'key features', 'main features', 'top picks', 'best options',
  'final thoughts', 'bottom line', 'quick summary',
]);

/**
 * Extract brand names from LLM response text using markdown patterns.
 *
 * @param text - The full_response text from an LLM visibility check
 * @param ownBrandName - The user's own business name (excluded from results)
 * @returns Array of { title: string } matching the LLMBrandEntity shape
 */
export function extractBrandsFromText(
  text: string,
  ownBrandName?: string
): { title: string }[] {
  if (!text || text.trim().length === 0) return [];

  const candidates = new Set<string>();

  // Pattern 1: Markdown bold — **Brand Name**
  // Highest signal: LLMs consistently bold entity/brand names
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let match: RegExpExecArray | null;
  while ((match = boldRegex.exec(text)) !== null) {
    candidates.add(match[1].trim());
  }

  // Pattern 2: Numbered or bulleted list items starting with a capitalized phrase
  // Matches: "1. Brand Name - description", "- Brand Name: description", "* Brand Name (details)"
  const listRegex = /(?:^|\n)\s*(?:\d+[\.\)]\s+|\-\s+|\*\s+)([A-Z][A-Za-z0-9][\w\s&'.!-]*?)(?:\s*[\-–—:|(\n])/g;
  while ((match = listRegex.exec(text)) !== null) {
    candidates.add(match[1].trim());
  }

  // Pattern 3: Markdown headers — ### Brand Name
  const headerRegex = /(?:^|\n)\s*#{1,4}\s+(.+?)(?:\n|$)/g;
  while ((match = headerRegex.exec(text)) !== null) {
    candidates.add(match[1].trim());
  }

  // Filter and deduplicate
  const ownBrandLower = ownBrandName?.toLowerCase() || '';
  const seen = new Map<string, string>(); // lowercase -> original casing

  for (const raw of candidates) {
    // Remove trailing punctuation (colons, dashes, periods)
    const name = raw.replace(/[\s\-–—:.,;!?]+$/, '').trim();

    // Length filters
    if (name.length < 2 || name.length > 60) continue;

    // Skip pure numbers
    if (/^\d+$/.test(name)) continue;

    // Skip ALL-CAPS strings longer than 5 chars (section headers like "OVERVIEW")
    if (name.length > 5 && name === name.toUpperCase() && /^[A-Z\s]+$/.test(name)) continue;

    // Skip if first word is a stopword
    const firstWord = name.split(/\s+/)[0].toLowerCase();
    if (STOPWORD_STARTS.has(firstWord)) continue;

    // Skip generic phrases
    if (GENERIC_PHRASES.has(name.toLowerCase())) continue;

    // Skip own brand
    const nameLower = name.toLowerCase();
    if (ownBrandLower && (nameLower.includes(ownBrandLower) || ownBrandLower.includes(nameLower))) {
      continue;
    }

    // Clean markdown artifacts and filter non-brand entries
    const cleaned = cleanBrandName(name);
    if (cleaned.length < 2) continue;
    if (!isLikelyBrandName(cleaned)) continue;

    const cleanedLower = cleaned.toLowerCase();

    // Re-check own brand after cleaning
    if (ownBrandLower && (cleanedLower.includes(ownBrandLower) || ownBrandLower.includes(cleanedLower))) {
      continue;
    }

    // Deduplicate case-insensitively, keep first occurrence's casing
    if (!seen.has(cleanedLower)) {
      seen.set(cleanedLower, cleaned);
    }
  }

  return Array.from(seen.values()).map(title => ({ title }));
}
