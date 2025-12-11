/**
 * Credit Service
 *
 * Core service for managing account credits.
 * All credit operations go through this service to ensure consistency.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  CreditBalance,
  CreditLedgerEntry,
  DebitOptions,
  CreditOptions,
  PricingRule,
  CreditPack,
  TierCredits,
  InsufficientCreditsError,
  IdempotencyError,
  CreditType,
} from './types';

/**
 * Get the current credit balance for an account
 */
export async function getBalance(
  supabase: SupabaseClient,
  accountId: string
): Promise<CreditBalance> {
  const { data, error } = await supabase
    .from('credit_balances')
    .select('*')
    .eq('account_id', accountId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get credit balance: ${error.message}`);
  }

  // If no balance record exists, return zeros
  if (!data) {
    return {
      accountId,
      includedCredits: 0,
      purchasedCredits: 0,
      totalCredits: 0,
      includedCreditsExpireAt: null,
      lastMonthlyGrantAt: null,
    };
  }

  return {
    accountId: data.account_id,
    includedCredits: data.included_credits,
    purchasedCredits: data.purchased_credits,
    totalCredits: data.included_credits + data.purchased_credits,
    includedCreditsExpireAt: data.included_credits_expire_at
      ? new Date(data.included_credits_expire_at)
      : null,
    lastMonthlyGrantAt: data.last_monthly_grant_at
      ? new Date(data.last_monthly_grant_at)
      : null,
  };
}

/**
 * Debit credits from an account for a feature usage
 *
 * Uses included credits first, then purchased credits.
 * Returns the ledger entries created.
 *
 * @throws InsufficientCreditsError if not enough credits
 * @throws IdempotencyError if idempotency key already exists
 */
export async function debit(
  supabase: SupabaseClient,
  accountId: string,
  amount: number,
  options: DebitOptions
): Promise<CreditLedgerEntry[]> {
  if (amount <= 0) {
    throw new Error('Debit amount must be positive');
  }

  // Check idempotency first
  const { data: existingEntry } = await supabase
    .from('credit_ledger')
    .select('id')
    .eq('idempotency_key', options.idempotencyKey)
    .single();

  if (existingEntry) {
    throw new IdempotencyError(options.idempotencyKey);
  }

  // Get current balance
  const balance = await getBalance(supabase, accountId);

  if (balance.totalCredits < amount) {
    throw new InsufficientCreditsError(amount, balance.totalCredits);
  }

  // Calculate how much to debit from each credit type
  // Use included credits first (they expire), then purchased (never expire)
  let includedDebit = Math.min(balance.includedCredits, amount);
  let purchasedDebit = amount - includedDebit;

  const ledgerEntries: CreditLedgerEntry[] = [];
  let newIncludedBalance = balance.includedCredits;
  let newPurchasedBalance = balance.purchasedCredits;

  // Create ledger entries for each credit type debited
  if (includedDebit > 0) {
    newIncludedBalance -= includedDebit;
    const totalAfter = newIncludedBalance + newPurchasedBalance;

    const { data: entry, error: entryError } = await supabase
      .from('credit_ledger')
      .insert({
        account_id: accountId,
        amount: -includedDebit,
        balance_after: totalAfter,
        credit_type: 'included',
        transaction_type: 'feature_debit',
        feature_type: options.featureType,
        feature_metadata: options.featureMetadata || {},
        idempotency_key: purchasedDebit > 0
          ? `${options.idempotencyKey}:included`
          : options.idempotencyKey,
        description: options.description,
        created_by: options.createdBy,
      })
      .select()
      .single();

    if (entryError) {
      if (entryError.code === '23505') {
        throw new IdempotencyError(options.idempotencyKey);
      }
      throw new Error(`Failed to create debit ledger entry: ${entryError.message}`);
    }

    ledgerEntries.push(transformLedgerEntry(entry));
  }

  if (purchasedDebit > 0) {
    newPurchasedBalance -= purchasedDebit;
    const totalAfter = newIncludedBalance + newPurchasedBalance;

    const { data: entry, error: entryError } = await supabase
      .from('credit_ledger')
      .insert({
        account_id: accountId,
        amount: -purchasedDebit,
        balance_after: totalAfter,
        credit_type: 'purchased',
        transaction_type: 'feature_debit',
        feature_type: options.featureType,
        feature_metadata: options.featureMetadata || {},
        idempotency_key: includedDebit > 0
          ? `${options.idempotencyKey}:purchased`
          : options.idempotencyKey,
        description: options.description,
        created_by: options.createdBy,
      })
      .select()
      .single();

    if (entryError) {
      if (entryError.code === '23505') {
        throw new IdempotencyError(options.idempotencyKey);
      }
      throw new Error(`Failed to create debit ledger entry: ${entryError.message}`);
    }

    ledgerEntries.push(transformLedgerEntry(entry));
  }

  // Update balance record
  const { error: updateError } = await supabase
    .from('credit_balances')
    .upsert({
      account_id: accountId,
      included_credits: newIncludedBalance,
      purchased_credits: newPurchasedBalance,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'account_id',
    });

  if (updateError) {
    throw new Error(`Failed to update credit balance: ${updateError.message}`);
  }

  return ledgerEntries;
}

/**
 * Credit (add) credits to an account
 *
 * Used for purchases, monthly grants, refunds, etc.
 */
export async function credit(
  supabase: SupabaseClient,
  accountId: string,
  amount: number,
  options: CreditOptions
): Promise<CreditLedgerEntry> {
  if (amount <= 0) {
    throw new Error('Credit amount must be positive');
  }

  // Check idempotency if key provided
  if (options.idempotencyKey) {
    const { data: existingEntry } = await supabase
      .from('credit_ledger')
      .select('id')
      .eq('idempotency_key', options.idempotencyKey)
      .single();

    if (existingEntry) {
      throw new IdempotencyError(options.idempotencyKey);
    }
  }

  // Get current balance
  const balance = await getBalance(supabase, accountId);

  // Calculate new balances
  const newIncludedBalance = options.creditType === 'included'
    ? balance.includedCredits + amount
    : balance.includedCredits;
  const newPurchasedBalance = options.creditType === 'purchased'
    ? balance.purchasedCredits + amount
    : balance.purchasedCredits;
  const totalAfter = newIncludedBalance + newPurchasedBalance;

  // Create ledger entry
  const { data: entry, error: entryError } = await supabase
    .from('credit_ledger')
    .insert({
      account_id: accountId,
      amount: amount,
      balance_after: totalAfter,
      credit_type: options.creditType,
      transaction_type: options.transactionType,
      idempotency_key: options.idempotencyKey,
      stripe_session_id: options.stripeSessionId,
      stripe_invoice_id: options.stripeInvoiceId,
      description: options.description,
      created_by: options.createdBy,
    })
    .select()
    .single();

  if (entryError) {
    if (entryError.code === '23505' && options.idempotencyKey) {
      throw new IdempotencyError(options.idempotencyKey);
    }
    throw new Error(`Failed to create credit ledger entry: ${entryError.message}`);
  }

  // Calculate expiration date for included credits (end of current month)
  let expireAt: string | undefined;
  if (options.creditType === 'included' && options.transactionType === 'monthly_grant') {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    expireAt = endOfMonth.toISOString();
  }

  // Update balance record
  const updateData: Record<string, unknown> = {
    account_id: accountId,
    included_credits: newIncludedBalance,
    purchased_credits: newPurchasedBalance,
    updated_at: new Date().toISOString(),
  };

  if (expireAt) {
    updateData.included_credits_expire_at = expireAt;
  }

  if (options.transactionType === 'monthly_grant') {
    updateData.last_monthly_grant_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from('credit_balances')
    .upsert(updateData, {
      onConflict: 'account_id',
    });

  if (updateError) {
    throw new Error(`Failed to update credit balance: ${updateError.message}`);
  }

  return transformLedgerEntry(entry);
}

/**
 * Refund credits for a failed feature operation
 *
 * Uses the same idempotency key pattern to create a compensating entry
 */
export async function refundFeature(
  supabase: SupabaseClient,
  accountId: string,
  amount: number,
  originalIdempotencyKey: string,
  options: {
    featureType: string;
    featureMetadata?: Record<string, unknown>;
    description?: string;
    createdBy?: string;
  }
): Promise<CreditLedgerEntry> {
  // For refunds, we credit back to purchased credits (simplest approach)
  // This is a compensating transaction, not a true reversal
  const refundIdempotencyKey = `${originalIdempotencyKey}:refund`;

  return credit(supabase, accountId, amount, {
    creditType: 'purchased', // Refund as purchased so they don't expire
    transactionType: 'feature_refund',
    idempotencyKey: refundIdempotencyKey,
    description: options.description || `Refund for failed ${options.featureType} operation`,
    createdBy: options.createdBy,
  });
}

/**
 * Get ledger entries for an account
 */
export async function getLedger(
  supabase: SupabaseClient,
  accountId: string,
  options?: {
    limit?: number;
    offset?: number;
    featureType?: string;
    transactionType?: string;
  }
): Promise<{ entries: CreditLedgerEntry[]; total: number }> {
  let query = supabase
    .from('credit_ledger')
    .select('*', { count: 'exact' })
    .eq('account_id', accountId)
    .order('created_at', { ascending: false });

  if (options?.featureType) {
    query = query.eq('feature_type', options.featureType);
  }

  if (options?.transactionType) {
    query = query.eq('transaction_type', options.transactionType);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to get ledger entries: ${error.message}`);
  }

  return {
    entries: (data || []).map(transformLedgerEntry),
    total: count || 0,
  };
}

/**
 * Get pricing rules for a feature type
 */
export async function getPricingRules(
  supabase: SupabaseClient,
  featureType: string
): Promise<PricingRule[]> {
  const { data, error } = await supabase
    .from('credit_pricing_rules')
    .select('*')
    .eq('feature_type', featureType)
    .eq('is_active', true)
    .order('rule_key');

  if (error) {
    throw new Error(`Failed to get pricing rules: ${error.message}`);
  }

  return (data || []).map((rule) => ({
    featureType: rule.feature_type,
    ruleKey: rule.rule_key,
    creditCost: rule.credit_cost,
    description: rule.description,
  }));
}

/**
 * Get available credit packs
 */
export async function getCreditPacks(
  supabase: SupabaseClient
): Promise<CreditPack[]> {
  const { data, error } = await supabase
    .from('credit_packs')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  if (error) {
    throw new Error(`Failed to get credit packs: ${error.message}`);
  }

  return (data || []).map((pack) => ({
    id: pack.id,
    name: pack.name,
    credits: pack.credits,
    priceCents: pack.price_cents,
    stripePriceId: pack.stripe_price_id,
    stripePriceIdRecurring: pack.stripe_price_id_recurring,
    isActive: pack.is_active,
    displayOrder: pack.display_order,
  }));
}

/**
 * Get monthly credits for a tier
 */
export async function getTierCredits(
  supabase: SupabaseClient,
  tier: string
): Promise<number> {
  const { data, error } = await supabase
    .from('credit_included_by_tier')
    .select('monthly_credits')
    .eq('tier', tier)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get tier credits: ${error.message}`);
  }

  return data?.monthly_credits ?? 0;
}

/**
 * Get all tier credit configurations
 */
export async function getAllTierCredits(
  supabase: SupabaseClient
): Promise<TierCredits[]> {
  const { data, error } = await supabase
    .from('credit_included_by_tier')
    .select('*')
    .order('monthly_credits');

  if (error) {
    throw new Error(`Failed to get tier credits: ${error.message}`);
  }

  return (data || []).map((tier) => ({
    tier: tier.tier,
    monthlyCredits: tier.monthly_credits,
  }));
}

/**
 * Calculate geo grid cost based on grid size and keyword count
 *
 * Formula: 10 base + 1 per cell + 2 per keyword
 *
 * Examples (with 5 keywords):
 * - 3x3 = 10 + 9 + 10 = 29
 * - 5x5 = 10 + 25 + 10 = 45
 * - 7x7 = 10 + 49 + 10 = 69
 * - 9x9 = 10 + 81 + 10 = 101
 */
export function calculateGeogridCost(gridSize: number, keywordCount: number = 1): number {
  const baseCost = 10;
  const cellCount = gridSize * gridSize;
  const keywordCost = keywordCount * 2;
  return baseCost + cellCount + keywordCost;
}

/**
 * Check if an account has sufficient credits for a geo grid run
 */
export async function checkGeogridCredits(
  supabase: SupabaseClient,
  accountId: string,
  gridSize: number,
  keywordCount: number = 1
): Promise<{
  hasCredits: boolean;
  required: number;
  available: number;
  balance: CreditBalance;
}> {
  const required = calculateGeogridCost(gridSize, keywordCount);
  const balance = await getBalance(supabase, accountId);

  return {
    hasCredits: balance.totalCredits >= required,
    required,
    available: balance.totalCredits,
    balance,
  };
}

/**
 * Ensure a balance record exists for an account
 */
export async function ensureBalanceExists(
  supabase: SupabaseClient,
  accountId: string
): Promise<void> {
  const { error } = await supabase
    .from('credit_balances')
    .upsert(
      {
        account_id: accountId,
        included_credits: 0,
        purchased_credits: 0,
      },
      {
        onConflict: 'account_id',
        ignoreDuplicates: true,
      }
    );

  if (error) {
    throw new Error(`Failed to ensure balance exists: ${error.message}`);
  }
}

// Helper function to transform database row to typed object
function transformLedgerEntry(row: Record<string, unknown>): CreditLedgerEntry {
  return {
    id: row.id as string,
    accountId: row.account_id as string,
    amount: row.amount as number,
    balanceAfter: row.balance_after as number,
    creditType: row.credit_type as CreditType,
    transactionType: row.transaction_type as CreditLedgerEntry['transactionType'],
    featureType: row.feature_type as CreditLedgerEntry['featureType'],
    featureMetadata: row.feature_metadata as Record<string, unknown>,
    idempotencyKey: row.idempotency_key as string | undefined,
    stripeSessionId: row.stripe_session_id as string | undefined,
    stripeInvoiceId: row.stripe_invoice_id as string | undefined,
    stripeChargeId: row.stripe_charge_id as string | undefined,
    description: row.description as string | undefined,
    createdAt: new Date(row.created_at as string),
    createdBy: row.created_by as string | undefined,
  };
}
