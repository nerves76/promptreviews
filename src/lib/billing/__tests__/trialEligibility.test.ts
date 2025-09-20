import {
  evaluateTrialEligibility,
  deriveTrialMetadata,
  isTrialEligible,
  TrialEligibilityAccount,
} from "../trialEligibility";

describe("trial eligibility helper", () => {
  const baseAccount: TrialEligibilityAccount = {
    plan: "no_plan",
    has_had_paid_plan: false,
    is_additional_account: false,
  };

  it("marks primary accounts without history as eligible", () => {
    const result = evaluateTrialEligibility(baseAccount);
    expect(result.eligible).toBe(true);
    expect(result.reasons).toHaveLength(0);
    expect(isTrialEligible(baseAccount)).toBe(true);
  });

  it("blocks accounts that have previously paid", () => {
    const result = evaluateTrialEligibility({
      ...baseAccount,
      has_had_paid_plan: true,
    });
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("has_had_paid_plan");
    const metadata = deriveTrialMetadata(result);
    expect(metadata.hasConsumedTrial).toBe(true);
    expect(metadata.blockedByActivePlan).toBe(false);
  });

  it("blocks additional accounts from receiving trials", () => {
    const result = evaluateTrialEligibility({
      ...baseAccount,
      is_additional_account: true,
    });
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("additional_account");
    const metadata = deriveTrialMetadata(result);
    expect(metadata.hasConsumedTrial).toBe(true);
  });

  it("blocks accounts with an active plan when required", () => {
    const result = evaluateTrialEligibility({
      ...baseAccount,
      plan: "grower",
    });
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("plan_active");
    const metadata = deriveTrialMetadata(result);
    expect(metadata.blockedByActivePlan).toBe(true);
    expect(metadata.hasConsumedTrial).toBe(false);
  });

  it("allows overriding the active-plan requirement", () => {
    const result = evaluateTrialEligibility(
      {
        ...baseAccount,
        plan: "grower",
      },
      { requireNoActivePlan: false }
    );
    expect(result.eligible).toBe(true);
  });

  it("handles missing accounts defensively", () => {
    const result = evaluateTrialEligibility(null);
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("missing_account");
  });
});
