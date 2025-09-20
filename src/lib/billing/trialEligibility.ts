export type TrialIneligibilityReason =
  | 'missing_account'
  | 'additional_account'
  | 'plan_active';

export interface TrialEligibilityAccount {
  plan?: string | null;
  has_had_paid_plan?: boolean | null;
  is_additional_account?: boolean | null;
}

export interface TrialEligibilityOptions {
  /**
   * Explicit plan we want to evaluate a trial for. Defaults to `grower`.
   * Included for future flexibility even though the current logic is plan-agnostic.
   */
  targetPlan?: string;
  /**
   * When false we will not block eligibility if the account already has a non `no_plan` value.
   */
  requireNoActivePlan?: boolean;
}

export interface TrialEligibilityResult {
  eligible: boolean;
  reasons: TrialIneligibilityReason[];
  targetPlan: string;
}

const DEFAULT_OPTIONS: Required<TrialEligibilityOptions> = {
  targetPlan: 'grower',
  requireNoActivePlan: true,
};

/**
 * Compute whether an account should receive a new free trial for the requested plan.
 *
 * The rules centralise the ad-hoc checks scattered across the dashboard, pricing modal
 * and Stripe checkout handlers:
 * - Primary accounts (not flagged as additional) only
 * - Accounts without another active plan when `requireNoActivePlan` is true
 */
export function evaluateTrialEligibility(
  account: TrialEligibilityAccount | null | undefined,
  options: TrialEligibilityOptions = {}
): TrialEligibilityResult {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const reasons: TrialIneligibilityReason[] = [];

  if (!account) {
    reasons.push('missing_account');
    return {
      eligible: false,
      reasons,
      targetPlan: mergedOptions.targetPlan,
    };
  }

  // Additional accounts never get trials
  if (account.is_additional_account) {
    reasons.push('additional_account');
  }

  if (mergedOptions.requireNoActivePlan) {
    const plan = account.plan ?? null;
    if (plan && plan !== 'no_plan') {
      reasons.push('plan_active');
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    targetPlan: mergedOptions.targetPlan,
  };
}

export function isTrialEligible(
  account: TrialEligibilityAccount | null | undefined,
  options?: TrialEligibilityOptions
): boolean {
  return evaluateTrialEligibility(account, options).eligible;
}

export interface TrialMetadata {
  /** True when we detected any signal that a free trial was already consumed. */
  hasConsumedTrial: boolean;
  /** True when eligibility is blocked purely because another plan is active. */
  blockedByActivePlan: boolean;
}

export function deriveTrialMetadata(result: TrialEligibilityResult): TrialMetadata {
  const blockedByActivePlan = result.reasons.includes('plan_active');
  // Additional accounts count as having consumed their trial
  const hasConsumedTrial = result.reasons.includes('additional_account');

  return { hasConsumedTrial, blockedByActivePlan };
}
