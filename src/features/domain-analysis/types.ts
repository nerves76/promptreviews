/**
 * Domain Analysis Feature Types
 *
 * Types for DataForSEO Domain Analytics API responses
 */

// ============================================
// API Response Types
// ============================================

export interface DataForSEOCredentials {
  login: string;
  password: string;
}

// Domain Technologies API Response
export interface DomainTechnologiesResponse {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: DomainTechnologiesTask[];
}

export interface DomainTechnologiesTask {
  id: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  result_count: number;
  path: string[];
  data: {
    api: string;
    function: string;
    target: string;
  };
  result: DomainTechnologiesResult[] | null;
}

export interface DomainTechnologiesResult {
  type: string;
  domain: string;
  title: string | null;
  description: string | null;
  meta_keywords: string[] | null;
  domain_rank: number | null;
  last_visited: string | null;
  country_iso_code: string | null;
  language_code: string | null;
  content_language_code: string | null;
  phone_numbers: string[] | null;
  emails: string[] | null;
  social_graph_urls: string[] | null;
  technologies: Record<string, Record<string, TechnologyItem[]>> | null;
}

export interface TechnologyItem {
  name: string;
  version?: string | null;
  icon?: string | null;
  website?: string | null;
}

// Whois API Response
export interface WhoisOverviewResponse {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: WhoisTask[];
}

export interface WhoisTask {
  id: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  result_count: number;
  path: string[];
  data: {
    api: string;
    function: string;
    target: string;
  };
  result: WhoisResult[] | null;
}

export interface WhoisResult {
  domain: string;
  created_datetime: string | null;
  changed_datetime: string | null;
  expiration_datetime: string | null;
  updated_datetime: string | null;
  first_seen: string | null;
  epp_status_codes: string[] | null;
  tld: string | null;
  registered: boolean;
  registrar: string | null;
  metrics: WhoisMetrics | null;
  backlinks_info: BacklinksInfo | null;
}

export interface WhoisMetrics {
  organic: TrafficMetrics | null;
  paid: TrafficMetrics | null;
}

export interface TrafficMetrics {
  pos_1: number;
  pos_2_3: number;
  pos_4_10: number;
  pos_11_20: number;
  pos_21_30: number;
  pos_31_40: number;
  pos_41_50: number;
  pos_51_60: number;
  pos_61_70: number;
  pos_71_80: number;
  pos_81_90: number;
  pos_91_100: number;
  etv: number;
  count: number;
  estimated_paid_traffic_cost: number;
}

export interface BacklinksInfo {
  referring_domains: number;
  referring_main_domains: number;
  referring_pages: number;
  dofollow: number;
  backlinks: number;
  time_update: string | null;
}

// ============================================
// Position Distribution
// ============================================

export interface PositionDistribution {
  pos_1: number;
  pos_2_3: number;
  pos_4_10: number;
  pos_11_20: number;
  pos_21_30: number;
  pos_31_40: number;
  pos_41_50: number;
  pos_51_60: number;
  pos_61_70: number;
  pos_71_80: number;
  pos_81_90: number;
  pos_91_100: number;
}

// ============================================
// Combined Analysis Result
// ============================================

export interface DomainAnalysisResult {
  domain: string;
  analyzedAt: string;

  // Technologies data
  title?: string;
  description?: string;
  metaKeywords?: string[];
  domainRank?: number;
  lastVisited?: string;
  countryIsoCode?: string;
  languageCode?: string;
  phoneNumbers?: string[];
  emails?: string[];
  socialGraphUrls?: string[];
  technologies?: Record<string, TechnologyCategory>;

  // Whois data
  registrar?: string;
  createdDatetime?: string;
  expirationDatetime?: string;
  changedDatetime?: string;
  eppStatusCodes?: string[];
  registered?: boolean;

  // Organic metrics
  organicEtv?: number;
  organicCount?: number;
  organicPositions?: PositionDistribution;

  // Paid metrics
  paidEtv?: number;
  paidCount?: number;
  paidPositions?: PositionDistribution;
  estimatedPaidTrafficCost?: number;

  // Backlinks
  referringDomains?: number;
  referringMainDomains?: number;
  referringPages?: number;
  dofollow?: number;
  backlinks?: number;
  backlinksUpdated?: string;

  // API costs
  techCost: number;
  whoisCost: number;
  totalCost: number;

  // AI Insights
  aiInsights?: DomainAIInsights;
}

export interface DomainAIInsights {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  techStackAnalysis: string;
  seoAssessment: string;
  competitivePosition: string;
  recommendations: string[];
}

export interface TechnologyCategory {
  [subcategory: string]: Technology[];
}

export interface Technology {
  name: string;
  version?: string;
  icon?: string;
  website?: string;
}

// ============================================
// API Client Result Types
// ============================================

export interface DomainTechResult {
  success: boolean;
  cost: number;
  data?: DomainTechnologiesResult;
  error?: string;
}

export interface WhoisResult2 {
  success: boolean;
  cost: number;
  data?: WhoisResult;
  error?: string;
}

export interface DomainAnalysisApiResult {
  success: boolean;
  result?: DomainAnalysisResult;
  error?: string;
}

// ============================================
// Credit Constants
// ============================================

export const DOMAIN_ANALYSIS_CREDIT_COST = 3;
