import { evaluatePricingRequirement } from '../src/utils/pricing';

describe('evaluatePricingRequirement', () => {
  it('requires payment when business is complete and plan missing', () => {
    const result = evaluatePricingRequirement({
      plan: 'no_plan',
      businessCreationComplete: true,
      isDeleted: false,
    });
    expect(result.requiresPayment).toBe(true);
    expect(result.reason).toMatch(/No plan selected/);
  });

  it('skips payment when business not complete', () => {
    const result = evaluatePricingRequirement({
      plan: 'no_plan',
      businessCreationComplete: false,
      isDeleted: false,
    });
    expect(result.requiresPayment).toBe(false);
  });

  it('requires reactivation when deleted', () => {
    const result = evaluatePricingRequirement({
      plan: 'maven',
      businessCreationComplete: true,
      isDeleted: true,
    });
    expect(result.requiresPayment).toBe(true);
    expect(result.reason).toMatch(/reactivation/);
  });

  it('treats free plan as free', () => {
    const result = evaluatePricingRequirement({
      plan: 'free',
      businessCreationComplete: true,
      isDeleted: false,
      isFreeAccount: true,
    });
    expect(result.requiresPayment).toBe(false);
  });

  it('identifies trial active grower plan', () => {
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const result = evaluatePricingRequirement({
      plan: 'grower',
      businessCreationComplete: true,
      isDeleted: false,
      trialEnd: future,
      hasHadPaidPlan: false,
    });
    expect(result.requiresPayment).toBe(false);
  });

  it('requires payment when grower trial expired', () => {
    const past = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const result = evaluatePricingRequirement({
      plan: 'grower',
      businessCreationComplete: true,
      isDeleted: false,
      trialEnd: past,
      hasHadPaidPlan: false,
    });
    expect(result.requiresPayment).toBe(true);
    expect(result.reason).toMatch(/Trial expired/);
  });

  it('requires payment for paid plans without active subscription', () => {
    const result = evaluatePricingRequirement({
      plan: 'maven',
      businessCreationComplete: true,
      isDeleted: false,
      subscriptionStatus: 'canceled',
    });
    expect(result.requiresPayment).toBe(true);
  });
});
