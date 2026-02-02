/**
 * Web Page Outlines - CSV Export Utility
 */

import type { PageOutline, SEOMetadata } from '../types';

/** Escape a value for safe CSV embedding */
function escapeCsv(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Build headers and values arrays from an outline + SEO metadata.
 * Returns a single-row CSV (header row + data row).
 */
function buildCsvData(outline: PageOutline, seo: SEOMetadata) {
  const headers: string[] = [];
  const values: string[] = [];

  // Hero
  headers.push('H1');
  values.push(outline.hero.h1);
  headers.push('Hero subtitle');
  values.push(outline.hero.subCopy);

  // Intro
  headers.push('Introduction');
  values.push(outline.intro);

  // Benefits (dynamic)
  outline.benefits.forEach((b, i) => {
    const n = i + 1;
    headers.push(`Benefit ${n} heading`);
    values.push(b.heading);
    headers.push(`Benefit ${n} description`);
    values.push(b.description);
  });

  // Body sections (dynamic)
  outline.bodySections.forEach((s, i) => {
    const n = i + 1;
    headers.push(`Section ${n} H2`);
    values.push(s.h2);
    headers.push(`Section ${n} content`);
    values.push(s.paragraphs.join('\n\n'));
  });

  // CTA
  headers.push('CTA heading');
  values.push(outline.cta.heading);
  headers.push('CTA subtitle');
  values.push(outline.cta.subCopy);
  headers.push('CTA button text');
  values.push(outline.cta.buttonText);

  // FAQ (dynamic)
  outline.faq.forEach((f, i) => {
    const n = i + 1;
    headers.push(`FAQ ${n} question`);
    values.push(f.question);
    headers.push(`FAQ ${n} answer`);
    values.push(f.answer);
  });

  // Footer
  headers.push('Footer');
  values.push(outline.footer.content);

  // SEO
  headers.push('Page title');
  values.push(seo.pageTitle);
  headers.push('Meta description');
  values.push(seo.metaDescription);
  headers.push('Schema markup');
  values.push(JSON.stringify(seo.localBusinessSchema));

  return { headers, values };
}

/**
 * Export the outline as a CSV file and trigger a browser download.
 */
export function exportOutlineAsCsv(
  outline: PageOutline,
  seo: SEOMetadata,
  keyword: string,
): void {
  const { headers, values } = buildCsvData(outline, seo);

  const headerRow = headers.map(escapeCsv).join(',');
  const dataRow = values.map(escapeCsv).join(',');
  const csv = `${headerRow}\n${dataRow}`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const slug = keyword
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug}-outline.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
