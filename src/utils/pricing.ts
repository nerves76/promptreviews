export interface PricingInput {
  plan: string | null;
  businessCreationComplete: boolean | null | undefined;
  isDeleted: boolean;
  trialEnd?: string | null;
  subscriptionStatus?: string | null;
  isFreeAccount?: boolean | null;
  hasHadPaidPlan?: boolean | null;
  isAdditionalAccount?: boolean | null;
  // Agency-specific fields
  isAgency?: boolean | null;
  agencyTrialEnd?: string | null;
  agencyHasPayingClient?: boolean | null;
}

export interface PricingDecision {
  requiresPayment: boolean;
  reason: string;
}

import { evaluateTrialEligibility } from "@/lib/billing/trialEligibility";

export function evaluatePricingRequirement(input: PricingInput): PricingDecision {
  const plan = input.plan ?? null;
  const businessComplete = input.businessCreationComplete === true;
  const isDeleted = input.isDeleted;
  const subscriptionStatus = input.subscriptionStatus ?? null;
  const isFreeAccount = input.isFreeAccount ?? false;
  const hasHadPaidPlan = input.hasHadPaidPlan ?? false;
  const isAdditionalAccount = input.isAdditionalAccount ?? false;

  if (!businessComplete) {
    return {
      requiresPayment: false,
      reason: 'Business creation not complete',
    };
  }

  if (isDeleted) {
    return {
      requiresPayment: true,
      reason: 'Account is deleted and needs reactivation',
    };
  }

  if (isFreeAccount || plan === 'free') {
    return {
      requiresPayment: false,
      reason: 'Free account',
    };
  }

  // Agency account handling
  const isAgency = input.isAgency ?? false;
  const agencyTrialEnd = input.agencyTrialEnd ? new Date(input.agencyTrialEnd) : null;
  const agencyHasPayingClient = input.agencyHasPayingClient ?? false;

  if (isAgency) {
    const now = new Date();
    const agencyTrialActive = agencyTrialEnd && now <= agencyTrialEnd;

    // Agency trial is active - no payment required
    if (agencyTrialActive) {
      return {
        requiresPayment: false,
        reason: 'Agency trial active',
      };
    }

    // Agency trial expired but has paying clients - free workspace incentive
    if (agencyHasPayingClient) {
      return {
        requiresPayment: false,
        reason: 'Agency has paying clients',
      };
    }

    // Agency trial expired and no paying clients - require payment
    return {
      requiresPayment: true,
      reason: 'Agency trial expired',
    };
  }

  // CRITICAL FIX: Additional accounts MUST have their own plan
  // Each account needs its own subscription - this prevents unlimited free accounts
  // Removed the check that was allowing additional accounts to bypass payment

  if (subscriptionStatus === 'active') {
    return {
      requiresPayment: false,
      reason: 'Active subscription',
    };
  }

  if (!plan || plan === 'no_plan' || plan === 'NULL') {
    return {
      requiresPayment: true,
      reason: 'No plan selected',
    };
  }

  if (plan === 'grower') {
    const trialEnd = input.trialEnd ? new Date(input.trialEnd) : null;
    const now = new Date();
    const trialActive = Boolean(trialEnd && now <= trialEnd);
    const trialEligibility = evaluateTrialEligibility(
      {
        plan,
        has_had_paid_plan: hasHadPaidPlan,
        is_additional_account: isAdditionalAccount,
      },
      {
        targetPlan: 'grower',
        requireNoActivePlan: false,
      }
    );

    if (trialActive && trialEligibility.eligible) {
      return {
        requiresPayment: false,
        reason: 'Trial active',
      };
    }

    return {
      requiresPayment: true,
      reason: trialEnd ? 'Trial expired' : 'Grower plan requires activation',
    };
  }

  if ((plan === 'builder' || plan === 'maven') && subscriptionStatus !== 'active') {
    return {
      requiresPayment: true,
      reason: 'Paid plan requires active subscription',
    };
  }

  return {
    requiresPayment: false,
    reason: 'No payment required',
  };
}
