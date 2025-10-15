/**
 * Billing Configuration for Docs Site
 *
 * This mirrors the pricing configuration from the main app.
 * Source of truth: /src/lib/billing/config.ts
 */

export const PLAN_DISPLAY = {
  grower: {
    name: 'Grower',
    monthlyPrice: 20,
    annualPrice: 204,
    order: 1,
  },
  builder: {
    name: 'Builder',
    monthlyPrice: 40,
    annualPrice: 408,
    order: 2,
  },
  maven: {
    name: 'Maven',
    monthlyPrice: 100,
    annualPrice: 1020,
    order: 3,
  },
} as const;

export const PLAN_LIMITS = {
  grower: {
    maxUsers: 1,
    maxLocations: 1,
    promptPages: 3,
    contacts: 0,
    hasWorkflow: false,
    hasGoogleBusiness: true,
  },
  builder: {
    maxUsers: 3,
    maxLocations: 3,
    promptPages: 50,
    contacts: 1000,
    hasWorkflow: true,
    hasGoogleBusiness: true,
  },
  maven: {
    maxUsers: 5,
    maxLocations: 10,
    promptPages: 500,
    contacts: 10000,
    hasWorkflow: true,
    hasGoogleBusiness: true,
  },
} as const;

/**
 * Helper to calculate annual savings
 */
export function calculateAnnualSavings(plan: keyof typeof PLAN_DISPLAY): number {
  const planData = PLAN_DISPLAY[plan];
  const monthlyTotal = planData.monthlyPrice * 12;
  return monthlyTotal - planData.annualPrice;
}

/**
 * Helper to get monthly price from annual
 */
export function getMonthlyFromAnnual(plan: keyof typeof PLAN_DISPLAY): number {
  const planData = PLAN_DISPLAY[plan];
  return Math.round(planData.annualPrice / 12);
}

export type PlanKey = keyof typeof PLAN_DISPLAY;
