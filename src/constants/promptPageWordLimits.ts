export const PROMPT_PAGE_WORD_LIMITS = {
  DEFAULT: 200,
  MIN: 20,
  MAX: 1000,
  MIN_REVIEW_WORDS: 1,
  WARNING_THRESHOLD: 0.9,
} as const;

export function clampWordLimit(rawValue: unknown): number {
  const numeric = typeof rawValue === "number" ? rawValue : Number(rawValue);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return PROMPT_PAGE_WORD_LIMITS.DEFAULT;
  }
  const clampedMin = Math.max(numeric, PROMPT_PAGE_WORD_LIMITS.MIN);
  return Math.min(clampedMin, PROMPT_PAGE_WORD_LIMITS.MAX);
}

export function getWordLimitOrDefault(rawValue: unknown): number {
  if (rawValue === undefined || rawValue === null) {
    return PROMPT_PAGE_WORD_LIMITS.DEFAULT;
  }
  return clampWordLimit(rawValue);
}

export function isNearWordLimit(wordCount: number, limit: number): boolean {
  if (limit <= 0) return false;
  return wordCount / limit >= PROMPT_PAGE_WORD_LIMITS.WARNING_THRESHOLD;
}

export function isWordCountValid(wordCount: number, limit: number): boolean {
  if (wordCount < PROMPT_PAGE_WORD_LIMITS.MIN_REVIEW_WORDS) {
    return false;
  }
  return wordCount <= limit;
}

export function countWords(input: string): number {
  if (!input) return 0;
  return input
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length;
}
