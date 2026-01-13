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

  // Agency plan - agencies use their own billing system
  if (plan === 'agency') {
    const isAgency = input.isAgency ?? false;
    const agencyTrialEnd = input.agencyTrialEnd ? new Date(input.agencyTrialEnd) : null;

    if (isAgency && agencyTrialEnd) {
      const now = new Date();
      if (now <= agencyTrialEnd) {
        return {
          requiresPayment: false,
          reason: 'Agency trial active',
        };
      }
    }

    // Agency with expired trial or no trial would need to handle agency billing
    // For now, treat agencies as not requiring standard payment
    if (isAgency) {
      return {
        requiresPayment: false,
        reason: 'Agency account',
      };
    }
  }

  // Legacy check for agencies without agency plan set
  const isAgency = input.isAgency ?? false;
  const agencyTrialEnd = input.agencyTrialEnd ? new Date(input.agencyTrialEnd) : null;
  if (isAgency && agencyTrialEnd) {
    const now = new Date();
    if (now <= agencyTrialEnd) {
      return {
        requiresPayment: false,
        reason: 'Agency trial active',
      };
    }
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
