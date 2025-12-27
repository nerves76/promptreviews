/**
 * Backlinks Feature Types
 *
 * TypeScript types for the backlinks tracking feature.
 */

// ============================================
// Database Models (matching Prisma/Supabase schema)
// ============================================

export interface BacklinkDomain {
  id: string;
  accountId: string;
  domain: string;
  scheduleFrequency: 'daily' | 'weekly' | 'monthly' | null;
  scheduleDayOfWeek: number | null;
  scheduleDayOfMonth: number | null;
  scheduleHour: number;
  nextScheduledAt: Date | null;
  lastScheduledRunAt: Date | null;
  isEnabled: boolean;
  lastCheckedAt: Date | null;
  lastCreditWarningSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BacklinkCheck {
  id: string;
  accountId: string;
  domainId: string;
  backlinksTotal: number;
  referringDomainsTotal: number;
  referringDomainsNofollow: number;
  referringMainDomains: number;
  referringIps: number;
  referringSubnets: number;
  rank: number | null;
  backlinksFollow: number;
  backlinksNofollow: number;
  backlinksText: number;
  backlinksImage: number;
  backlinksRedirect: number;
  backlinksForm: number;
  backlinksFrame: number;
  referringPages: number;
  apiCostUsd: number | null;
  checkedAt: Date;
  createdAt: Date;
}

export interface BacklinkAnchor {
  id: string;
  accountId: string;
  checkId: string;
  anchorText: string;
  backlinksCount: number;
  referringDomainsCount: number;
  firstSeen: Date | null;
  lastSeen: Date | null;
  rank: number | null;
  createdAt: Date;
}

export interface BacklinkReferringDomain {
  id: string;
  accountId: string;
  checkId: string;
  referringDomain: string;
  backlinksCount: number;
  rank: number | null;
  backlinksSpamScore: number | null;
  firstSeen: Date | null;
  lastSeen: Date | null;
  isFollow: boolean;
  createdAt: Date;
}

export interface BacklinkNewLost {
  id: string;
  accountId: string;
  domainId: string;
  checkId: string;
  changeType: 'new' | 'lost';
  sourceUrl: string | null;
  sourceDomain: string | null;
  targetUrl: string | null;
  anchorText: string | null;
  linkType: string | null;
  isFollow: boolean;
  firstSeen: Date | null;
  lastSeen: Date | null;
  sourceRank: number | null;
  detectedAt: Date;
  createdAt: Date;
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreateBacklinkDomainRequest {
  domain: string;
  scheduleFrequency?: 'daily' | 'weekly' | 'monthly';
  scheduleDayOfWeek?: number;
  scheduleDayOfMonth?: number;
  scheduleHour?: number;
}

export interface UpdateBacklinkDomainRequest {
  scheduleFrequency?: 'daily' | 'weekly' | 'monthly' | null;
  scheduleDayOfWeek?: number | null;
  scheduleDayOfMonth?: number | null;
  scheduleHour?: number;
  isEnabled?: boolean;
}

export interface BacklinkDomainWithStats extends BacklinkDomain {
  lastCheck?: BacklinkCheck | null;
  changeFromPrevious?: {
    backlinksChange: number;
    referringDomainsChange: number;
  };
}

export interface BacklinkCheckWithDetails extends BacklinkCheck {
  anchors?: BacklinkAnchor[];
  referringDomains?: BacklinkReferringDomain[];
  newLost?: BacklinkNewLost[];
}

// ============================================
// UI Display Types
// ============================================

export interface BacklinkTrendPoint {
  date: string;
  backlinksTotal: number;
  referringDomainsTotal: number;
  rank: number | null;
}

export interface BacklinkSummaryMetrics {
  backlinksTotal: number;
  referringDomainsTotal: number;
  rank: number;
  backlinksFollow: number;
  backlinksNofollow: number;
  changeFromPrevious: {
    backlinks: number;
    referringDomains: number;
    rank: number;
  };
}

export interface AnchorDistribution {
  anchor: string;
  count: number;
  percentage: number;
  referringDomains: number;
}

// ============================================
// Check Types
// ============================================

export type BacklinkCheckType = 'summary' | 'full';

export interface BacklinkCheckOptions {
  checkType: BacklinkCheckType;
  includeAnchors?: boolean;
  includeReferringDomains?: boolean;
  includeNewLost?: boolean;
  anchorLimit?: number;
  referringDomainsLimit?: number;
  newLostLimit?: number;
}

export interface BacklinkCheckResult {
  success: boolean;
  checkId?: string;
  summary?: BacklinkCheck;
  anchors?: BacklinkAnchor[];
  referringDomains?: BacklinkReferringDomain[];
  newLost?: BacklinkNewLost[];
  totalCost: number;
  error?: string;
}

// ============================================
// Credit Types
// ============================================

export const BACKLINK_CREDIT_COSTS = {
  summary: 5, // Summary check only
  full: 15, // Summary + anchors + referring domains
  newLost: 3, // New/lost backlinks query
} as const;

export type BacklinkCreditCostKey = keyof typeof BACKLINK_CREDIT_COSTS;
