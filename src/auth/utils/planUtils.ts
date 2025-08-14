/**
 * Plan Utility Functions
 * 
 * Helper functions for plan management and limits
 */

export function getPlanDisplayName(plan: string | null): string | null {
  if (!plan) return null;
  
  const planNames: Record<string, string> = {
    'no_plan': 'No Plan',
    'grower': 'Grower',
    'accelerator': 'Accelerator',
    'maven': 'Maven',
    'enterprise': 'Enterprise',
    'free': 'Free',
  };
  
  return planNames[plan] || plan;
}

export function getMaxContactsForPlan(plan: string | null): number {
  if (!plan) return 0;
  
  const contactLimits: Record<string, number> = {
    'no_plan': 0,
    'grower': 100,
    'accelerator': 500,
    'maven': 2000,
    'enterprise': 10000,
    'free': 10,
  };
  
  return contactLimits[plan] || 100;
}

export function getMaxLocationsForPlan(plan: string | null): number {
  if (!plan) return 0;
  
  const locationLimits: Record<string, number> = {
    'no_plan': 0,
    'grower': 1,
    'accelerator': 3,
    'maven': 10,
    'enterprise': 100,
    'free': 1,
  };
  
  return locationLimits[plan] || 1;
}

export function getMaxUsersForPlan(plan: string | null): number {
  if (!plan) return 1;
  
  const userLimits: Record<string, number> = {
    'no_plan': 1,
    'grower': 1,
    'accelerator': 3,
    'maven': 10,
    'enterprise': 100,
    'free': 1,
  };
  
  return userLimits[plan] || 1;
}

export function getMaxPromptPagesForPlan(plan: string | null): number {
  if (!plan) return 0;
  
  const promptPageLimits: Record<string, number> = {
    'no_plan': 0,
    'grower': 10,
    'accelerator': 25,
    'maven': 100,
    'enterprise': 1000,
    'free': 1,
  };
  
  return promptPageLimits[plan] || 10;
}

export function isPlanUpgrade(currentPlan: string | null, newPlan: string): boolean {
  const planHierarchy: Record<string, number> = {
    'no_plan': 0,
    'free': 1,
    'grower': 2,
    'accelerator': 3,
    'maven': 4,
    'enterprise': 5,
  };
  
  const currentLevel = planHierarchy[currentPlan || 'no_plan'] || 0;
  const newLevel = planHierarchy[newPlan] || 0;
  
  return newLevel > currentLevel;
}

export function canAccessFeature(plan: string | null, feature: string): boolean {
  if (!plan || plan === 'no_plan') return false;
  
  const featureAccess: Record<string, string[]> = {
    'free': ['basic_reviews', 'single_location'],
    'grower': ['basic_reviews', 'single_location', 'email_campaigns', 'analytics'],
    'accelerator': ['basic_reviews', 'multi_location', 'email_campaigns', 'analytics', 'team_members', 'api_access'],
    'maven': ['basic_reviews', 'multi_location', 'email_campaigns', 'analytics', 'team_members', 'api_access', 'white_label', 'priority_support'],
    'enterprise': ['all_features'],
  };
  
  const planFeatures = featureAccess[plan] || [];
  return planFeatures.includes('all_features') || planFeatures.includes(feature);
}