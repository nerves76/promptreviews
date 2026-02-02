/**
 * Web Page Outlines - TypeScript Types
 */

// --- Tone ---

export type OutlineTone = 'professional' | 'friendly' | 'authoritative' | 'casual';

export const TONE_OPTIONS: { value: OutlineTone; label: string; description: string }[] = [
  { value: 'professional', label: 'Professional', description: 'Polished and business-appropriate language' },
  { value: 'friendly', label: 'Friendly', description: 'Warm, approachable, and conversational' },
  { value: 'authoritative', label: 'Authoritative', description: 'Expert-level confidence and credibility' },
  { value: 'casual', label: 'Casual', description: 'Relaxed, informal, and easy-going' },
];

// --- Outline Section Types ---

export interface HeroSection {
  h1: string;
  subCopy: string;
}

export interface BenefitCard {
  heading: string;
  description: string;
}

export interface BodySection {
  h2: string;
  paragraphs: string[];
}

export interface CTASection {
  heading: string;
  subCopy: string;
  buttonText: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FooterSection {
  content: string;
}

// --- Full Outline ---

export interface PageOutline {
  hero: HeroSection;
  intro: string;
  benefits: BenefitCard[];
  bodySections: BodySection[];
  cta: CTASection;
  faq: FAQItem[];
  footer: FooterSection;
}

// --- SEO Metadata ---

export interface SEOMetadata {
  pageTitle: string;
  metaDescription: string;
  localBusinessSchema: Record<string, unknown>;
  faqPageSchema: Record<string, unknown>;
}

// --- Keyword Density ---

export interface KeywordDensity {
  keyword: string;
  occurrences: number;
  totalWords: number;
  densityPercent: number;
}

// --- Generation Result ---

export interface OutlineGenerationResult {
  outline: PageOutline;
  seo: SEOMetadata;
  keywordDensity: KeywordDensity;
}

// --- Business Info ---

export interface BusinessInfoForOutline {
  name: string;
  aboutUs: string;
  servicesOffered: string;
  differentiators: string;
  industriesServed: string;
  yearsInBusiness: string;
  phone: string;
  website: string;
  city: string;
  state: string;
  companyValues: string;
  aiDos: string;
  aiDonts: string;
}

// --- Database Record ---

export interface WebPageOutlineRecord {
  id: string;
  account_id: string;
  user_id: string;
  keyword_id: string | null;
  keyword_phrase: string;
  tone: OutlineTone;
  business_name: string;
  business_info: BusinessInfoForOutline;
  outline_json: PageOutline;
  schema_markup: SEOMetadata;
  page_title: string | null;
  meta_description: string | null;
  credit_cost: number;
  created_at: string;
  updated_at: string;
}

// --- Competitor Data ---

export interface CompetitorUrl {
  url: string;
  title: string;
  wordCount: number;
}

// --- API Request/Response ---

export interface GenerateOutlineRequest {
  keywordId: string | null;
  keywordPhrase: string;
  tone: OutlineTone;
  businessInfo: BusinessInfoForOutline;
}

export interface GenerateOutlineResponse {
  success: boolean;
  outline: WebPageOutlineRecord;
  creditsDebited: number;
  creditsRemaining: number;
  competitorUrls?: CompetitorUrl[];
}

export interface RegenerateSectionRequest {
  outlineId: string;
  sectionKey: SectionKey;
}

export type SectionKey =
  | 'hero'
  | 'intro'
  | 'benefits'
  | 'bodySections'
  | 'cta'
  | 'faq'
  | 'footer';

export interface RegenerateSectionResponse {
  success: boolean;
  sectionKey: SectionKey;
  sectionData: unknown;
  creditsDebited: number;
  creditsRemaining: number;
}

export interface OutlineListResponse {
  outlines: WebPageOutlineRecord[];
  total: number;
}
