/**
 * Extract brand/company names from LLM response text.
 *
 * LLM responses use semi-structured markdown patterns (bold, numbered lists,
 * headers) that reliably wrap entity names. This utility extracts those names
 * as a fallback when structured brand data (e.g. DataForSEO brand_entities)
 * is unavailable.
 */

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

    // Deduplicate case-insensitively, keep first occurrence's casing
    if (!seen.has(nameLower)) {
      seen.set(nameLower, name);
    }
  }

  return Array.from(seen.values()).map(title => ({ title }));
}
