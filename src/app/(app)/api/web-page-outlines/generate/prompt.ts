/**
 * Web Page Outlines - AI Prompt Builder
 */

import type { OutlineTone, BusinessInfoForOutline } from '@/features/web-page-outlines/types';

const TONE_INSTRUCTIONS: Record<OutlineTone, string> = {
  professional:
    'Use polished, business-appropriate language. Maintain a confident and knowledgeable tone throughout.',
  friendly:
    'Use warm, approachable, and conversational language. Write as if speaking to a friend while maintaining credibility.',
  authoritative:
    'Use expert-level language that conveys deep knowledge and credibility. Position the business as the definitive authority.',
  casual:
    'Use relaxed, informal language. Keep sentences short and punchy. Avoid corporate jargon.',
};

export function buildSystemPrompt(tone: OutlineTone): string {
  return `You are an expert SEO content strategist. You produce structured web page outlines optimized for both search engines and AI systems like Google SGE.

Tone: ${TONE_INSTRUCTIONS[tone]}

You MUST return valid JSON matching this exact structure:

{
  "outline": {
    "hero": { "h1": "string", "subCopy": "string" },
    "intro": "string (opening paragraph, 2-3 sentences)",
    "benefits": [
      { "heading": "string", "description": "string (1-2 sentences)" }
    ],
    "bodySections": [
      { "h2": "string", "paragraphs": ["string", "string"] }
    ],
    "cta": { "heading": "string", "subCopy": "string", "buttonText": "string" },
    "faq": [
      { "question": "string", "answer": "string (2-3 sentences)" }
    ],
    "footer": { "content": "string" }
  },
  "seo": {
    "pageTitle": "string",
    "metaDescription": "string",
    "localBusinessSchema": { JSON-LD object },
    "faqPageSchema": { JSON-LD object }
  }
}

Rules:
1. The H1 MUST be 8 words or fewer — short, punchy, and impactful. Include the primary keyword. Use the subCopy field for any supporting detail.
2. Page title: use dashes (–) as separators, not bars (|). Keep under 60 characters.
3. Meta description: 150-160 characters. Include the primary keyword.
4. Generate exactly 3 benefit cards.
5. Generate 2-3 body sections with H2 headings. Include keyword variations naturally in H2s.
6. Each body section should have 2-3 standalone paragraphs optimized for AI extraction.
7. FAQ: generate 4-5 questions with 2-3 sentence answers each.
8. Footer: brief business info summary (1-2 sentences).
9. LocalBusiness schema: use real business info fields provided (name, address, website).
10. FAQPage schema: generate from the FAQ section questions and answers.
11. Each paragraph should stand alone and make sense independently (AI optimization).
12. Do NOT use generic filler. Every sentence should be specific to the business.
13. If a competitive landscape with topic analysis is provided: topics marked "must-cover" are table stakes — your outline MUST include a body section or FAQ addressing each one. Topics marked "recommended" should be included when relevant. Use unique angles as inspiration for differentiation. Produce entirely original headings and content — do not copy competitor headings verbatim.

Keyword density and natural language rules (CRITICAL — violating these triggers search engine over-optimization penalties):
14. Target 1.5-2.5% exact-match keyword density (the optimal range is 1-3%). For a 400-word outline this means using the exact keyword phrase roughly 6-10 times total across all sections. Below 1% signals weak relevance; above 3% risks over-optimization. Count your keyword uses and adjust before finalizing.
15. In addition to exact-match uses, also use synonyms, semantic variations, and related terms throughout the content. For example, if the keyword is "emergency plumber," alternate with "urgent plumbing service," "24-hour plumbing help," "same-day pipe repair," etc.
16. Distribute exact keyword mentions across sections — do not cluster them. Place the exact keyword in the H1, intro, at least one H2, at least one FAQ question or answer, the meta description, and spread remaining uses across body paragraphs.
17. Write for topical depth and entity coverage rather than keyword repetition. Cover related concepts, processes, and questions that a searcher would expect to find on the page.`;
}

export function buildUserPrompt(
  keyword: string,
  businessInfo: BusinessInfoForOutline,
  competitorContext?: string
): string {
  const infoLines: string[] = [];

  if (businessInfo.name) infoLines.push(`Business name: ${businessInfo.name}`);
  if (businessInfo.aboutUs) infoLines.push(`About: ${businessInfo.aboutUs}`);
  if (businessInfo.servicesOffered)
    infoLines.push(`Services: ${businessInfo.servicesOffered}`);
  if (businessInfo.differentiators)
    infoLines.push(`Differentiators: ${businessInfo.differentiators}`);
  if (businessInfo.industriesServed)
    infoLines.push(`Industries served: ${businessInfo.industriesServed}`);
  if (businessInfo.yearsInBusiness)
    infoLines.push(`Years in business: ${businessInfo.yearsInBusiness}`);
  if (businessInfo.website) infoLines.push(`Website: ${businessInfo.website}`);
  if (businessInfo.city || businessInfo.state)
    infoLines.push(`Location: ${[businessInfo.city, businessInfo.state].filter(Boolean).join(', ')}`);
  if (businessInfo.companyValues)
    infoLines.push(`Company values: ${businessInfo.companyValues}`);
  if (businessInfo.aiDos) infoLines.push(`Content guidelines (do): ${businessInfo.aiDos}`);
  if (businessInfo.aiDonts)
    infoLines.push(`Content guidelines (don't): ${businessInfo.aiDonts}`);

  const competitorBlock = competitorContext
    ? `\n\n${competitorContext}\n\nUse the competitive landscape and topic analysis above to ensure topical completeness. Every must-cover topic should map to at least one section in your outline. Create entirely original content.`
    : '';

  return `Generate a complete web page outline for the keyword: "${keyword}"

Business information:
${infoLines.join('\n')}${competitorBlock}

Return the structured JSON outline following the exact format specified.`;
}

export function buildSectionRegenerationPrompt(
  sectionKey: string,
  keyword: string,
  tone: OutlineTone,
  businessInfo: BusinessInfoForOutline
): string {
  const sectionInstructions: Record<string, string> = {
    hero: 'Generate a new hero section. The H1 must be 8 words or fewer — short, punchy, and include the primary keyword. Use subCopy for supporting detail.',
    intro: 'Generate a new opening paragraph (2-3 sentences) that hooks readers and includes the keyword naturally.',
    benefits: 'Generate 3 new benefit cards, each with a heading and 1-2 sentence description demonstrating expertise.',
    bodySections: 'Generate 2-3 new body sections with H2 headings (include keyword variations) and 2-3 standalone paragraphs each.',
    cta: 'Generate a new CTA section with a compelling heading, supportive sub-copy, and action-oriented button text.',
    faq: 'Generate 4-5 new FAQ items with questions and 2-3 sentence answers relevant to the keyword and business.',
    footer: 'Generate new footer content (1-2 sentences) summarizing the business.',
  };

  return `Regenerate ONLY the "${sectionKey}" section for a web page targeting the keyword: "${keyword}"

Tone: ${TONE_INSTRUCTIONS[tone]}

Business: ${businessInfo.name}
${businessInfo.aboutUs ? `About: ${businessInfo.aboutUs}` : ''}
${businessInfo.servicesOffered ? `Services: ${businessInfo.servicesOffered}` : ''}

Instructions: ${sectionInstructions[sectionKey] || 'Regenerate this section.'}

Keyword density: Use the exact keyword sparingly (1-2% density). Prefer synonyms, semantic variations, and related terms over repeating the exact keyword. Write for topical depth, not keyword repetition.

Return ONLY the JSON for this section (not the full outline). Match the exact structure for the "${sectionKey}" field.`;
}
