export interface PricingInput {
  plan: string | null;
  businessCreationComplete: boolean | null | undefined;
  isDeleted: boolean;
  trialEnd?: string | null;
  subscriptionStatus?: string | null;
  isFreeAccount?: boolean | null;
  hasHadPaidPlan?: boolean | null;
}

export interface PricingDecision {
  requiresPayment: boolean;
  reason: string;
}

export function evaluatePricingRequirement(input: PricingInput): PricingDecision {
  const plan = input.plan ?? null;
  const businessComplete = input.businessCreationComplete === true;
  const isDeleted = input.isDeleted;
  const subscriptionStatus = input.subscriptionStatus ?? null;
  const isFreeAccount = input.isFreeAccount ?? false;
  const hasHadPaidPlan = input.hasHadPaidPlan ?? false;

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
    const trialActive = trialEnd && now <= trialEnd;

    if (trialActive && !hasHadPaidPlan) {
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
