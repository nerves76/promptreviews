/**
 * Web Page Outlines - Keyword Density Calculator
 */

import type { PageOutline, KeywordDensity } from '../types';

/**
 * Extract all text content from an outline
 */
function extractAllText(outline: PageOutline): string {
  const parts: string[] = [];

  parts.push(outline.hero.h1);
  parts.push(outline.hero.subCopy);
  parts.push(outline.intro);

  outline.benefits.forEach((b) => {
    parts.push(b.heading);
    parts.push(b.description);
  });

  outline.bodySections.forEach((s) => {
    parts.push(s.h2);
    s.paragraphs.forEach((p) => parts.push(p));
  });

  parts.push(outline.cta.heading);
  parts.push(outline.cta.subCopy);
  parts.push(outline.cta.buttonText);

  outline.faq.forEach((f) => {
    parts.push(f.question);
    parts.push(f.answer);
  });

  parts.push(outline.footer.content);

  return parts.join(' ');
}

/**
 * Calculate keyword density across the entire outline
 */
export function calculateKeywordDensity(
  outline: PageOutline,
  keyword: string
): KeywordDensity {
  const allText = extractAllText(outline);
  const words = allText.split(/\s+/).filter((w) => w.length > 0);
  const totalWords = words.length;

  // Count keyword phrase occurrences (case-insensitive)
  const lowerText = allText.toLowerCase();
  const lowerKeyword = keyword.toLowerCase().trim();
  let occurrences = 0;
  let searchFrom = 0;

  while (searchFrom < lowerText.length) {
    const idx = lowerText.indexOf(lowerKeyword, searchFrom);
    if (idx === -1) break;
    occurrences++;
    searchFrom = idx + lowerKeyword.length;
  }

  const keywordWordCount = lowerKeyword.split(/\s+/).length;
  const densityPercent =
    totalWords > 0 ? (occurrences * keywordWordCount * 100) / totalWords : 0;

  return {
    keyword,
    occurrences,
    totalWords,
    densityPercent: Math.round(densityPercent * 100) / 100,
  };
}

/**
 * Get a color indicator for keyword density
 * Green: 1-3% (optimal)
 * Yellow: <1% or 3-4% (suboptimal)
 * Red: >4% (keyword stuffing risk)
 */
export function getDensityColor(percent: number): 'green' | 'yellow' | 'red' {
  if (percent >= 1 && percent <= 3) return 'green';
  if (percent > 4) return 'red';
  return 'yellow';
}
