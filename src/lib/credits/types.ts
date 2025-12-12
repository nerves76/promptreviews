/**
 * Credit System Types
 */

export type CreditType = 'included' | 'purchased';

export type TransactionType =
  | 'monthly_grant'
  | 'monthly_expire'
  | 'purchase'
  | 'refund'
  | 'feature_debit'
  | 'feature_refund'
  | 'manual_adjust'
  | 'promo_grant';

export type FeatureType =
  | 'geo_grid'
  | 'keyword_tracking'
  | 'keyword_finder'
  | 'ai_review_gen'
  | 'rank_tracking';

export interface CreditBalance {
  accountId: string;
  includedCredits: number;
  purchasedCredits: number;
  totalCredits: number;
  includedCreditsExpireAt: Date | null;
  lastMonthlyGrantAt: Date | null;
}

export interface CreditLedgerEntry {
  id: string;
  accountId: string;
  amount: number;
  balanceAfter: number;
  creditType: CreditType;
  transactionType: TransactionType;
  featureType?: FeatureType;
  featureMetadata?: Record<string, unknown>;
  idempotencyKey?: string;
  stripeSessionId?: string;
  stripeInvoiceId?: string;
  stripeChargeId?: string;
  description?: string;
  createdAt: Date;
  createdBy?: string;
}

export interface DebitOptions {
  featureType: FeatureType;
  featureMetadata?: Record<string, unknown>;
  idempotencyKey: string;
  description?: string;
  createdBy?: string;
}

export interface CreditOptions {
  creditType: CreditType;
  transactionType: TransactionType;
  idempotencyKey?: string;
  stripeSessionId?: string;
  stripeInvoiceId?: string;
  description?: string;
  createdBy?: string;
}

export interface PricingRule {
  featureType: FeatureType;
  ruleKey: string;
  creditCost: number;
  description?: string;
}

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  priceCents: number;
  stripePriceId?: string;
  stripePriceIdRecurring?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface TierCredits {
  tier: string;
  monthlyCredits: number;
}

export class InsufficientCreditsError extends Error {
  public readonly required: number;
  public readonly available: number;

  constructor(required: number, available: number) {
    super(`Insufficient credits: required ${required}, available ${available}`);
    this.name = 'InsufficientCreditsError';
    this.required = required;
    this.available = available;
  }
}

export class IdempotencyError extends Error {
  constructor(key: string) {
    super(`Transaction with idempotency key already exists: ${key}`);
    this.name = 'IdempotencyError';
  }
}
