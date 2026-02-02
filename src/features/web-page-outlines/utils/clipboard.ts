/**
 * Web Page Outlines - Clipboard Utilities
 */

import type { PageOutline, SectionKey, SEOMetadata } from '../types';

/**
 * Copy a single section's text to clipboard
 */
export function copySectionText(sectionKey: SectionKey, outline: PageOutline): string {
  switch (sectionKey) {
    case 'hero':
      return `# ${outline.hero.h1}\n${outline.hero.subCopy}`;
    case 'intro':
      return outline.intro;
    case 'benefits':
      return outline.benefits
        .map((b) => `**${b.heading}**\n${b.description}`)
        .join('\n\n');
    case 'bodySections':
      return outline.bodySections
        .map((s) => `## ${s.h2}\n\n${s.paragraphs.join('\n\n')}`)
        .join('\n\n');
    case 'cta':
      return `## ${outline.cta.heading}\n${outline.cta.subCopy}\n\n[${outline.cta.buttonText}]`;
    case 'faq':
      return outline.faq
        .map((f) => `**Q: ${f.question}**\nA: ${f.answer}`)
        .join('\n\n');
    case 'footer':
      return outline.footer.content;
    default:
      return '';
  }
}

/**
 * Copy the entire outline as markdown
 */
export function copyFullOutline(outline: PageOutline): string {
  const parts: string[] = [];

  // Hero
  parts.push(`# ${outline.hero.h1}`);
  parts.push(outline.hero.subCopy);
  parts.push('');

  // Intro
  parts.push(outline.intro);
  parts.push('');

  // Benefits
  parts.push('## Key benefits');
  outline.benefits.forEach((b) => {
    parts.push(`### ${b.heading}`);
    parts.push(b.description);
    parts.push('');
  });

  // Body sections
  outline.bodySections.forEach((s) => {
    parts.push(`## ${s.h2}`);
    parts.push('');
    s.paragraphs.forEach((p) => {
      parts.push(p);
      parts.push('');
    });
  });

  // CTA
  parts.push(`## ${outline.cta.heading}`);
  parts.push(outline.cta.subCopy);
  parts.push(`[${outline.cta.buttonText}]`);
  parts.push('');

  // FAQ
  parts.push('## Frequently asked questions');
  outline.faq.forEach((f) => {
    parts.push(`**Q: ${f.question}**`);
    parts.push(`A: ${f.answer}`);
    parts.push('');
  });

  // Footer
  if (outline.footer.content) {
    parts.push('---');
    parts.push(outline.footer.content);
  }

  return parts.join('\n');
}

/**
 * Copy JSON-LD schema markup
 */
export function copySchemaMarkup(schema: SEOMetadata): string {
  const combined = {
    localBusiness: schema.localBusinessSchema,
    faqPage: schema.faqPageSchema,
  };
  return JSON.stringify(combined, null, 2);
}
