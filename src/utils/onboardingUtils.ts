/**
 * Onboarding Flow Utilities
 * 
 * This file provides centralized logic for managing user onboarding flow.
 * It determines where users should be in the onboarding process and handles
 * transitions between different onboarding steps.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type OnboardingStep = 'incomplete' | 'needs_business' | 'needs_plan' | 'complete';

export interface OnboardingStatus {
  step: OnboardingStep;
  shouldRedirect: boolean;
  redirectPath?: string;
  shouldShowPricingModal: boolean;
  debugInfo?: {
    accountPlan: string | null;
    businessCount: number;
    hasStripeCustomer: boolean;
    isTrialExpired: boolean;
  };
}

/**
 * Get the current onboarding status for a user
 * This function determines where the user should be in the onboarding flow
 */
export async function getOnboardingStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<OnboardingStatus> {
  try {
    // Get user's account information
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (accountError || !account) {
      return {
        step: 'incomplete',
        shouldRedirect: true,
        redirectPath: '/dashboard/create-business',
        shouldShowPricingModal: false
      };
    }

    // Get user's businesses count
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('account_id', account.id);

    if (businessError) {
      console.error('🔍 OnboardingUtils: Error fetching businesses:', businessError);
    }

    const businessCount = businesses?.length || 0;
    const plan = account.plan;
    const hasStripeCustomer = !!account.stripe_customer_id;
    
    // Check if trial has expired
    const trialEnd = account.trial_end ? new Date(account.trial_end) : null;
    const isTrialExpired = trialEnd && new Date() > trialEnd;

    const debugInfo = {
      accountPlan: plan,
      businessCount,
      hasStripeCustomer,
      isTrialExpired: !!isTrialExpired
    };


    // Determine onboarding status based on current state
    
    // User has no businesses - needs to create business
    if (businessCount === 0) {
      return {
        step: 'needs_business',
        shouldRedirect: true,
        redirectPath: '/dashboard/create-business',
        shouldShowPricingModal: false,
        debugInfo
      };
    }

    // User has businesses but no plan or trial expired - needs plan selection
    // Skip plan requirement for free accounts
    if (!account.is_free_account && 
        ((!plan || plan === 'no_plan' || plan === 'NULL') || 
         (plan === 'grower' && isTrialExpired && !hasStripeCustomer))) {
      return {
        step: 'needs_plan',
        shouldRedirect: false,
        shouldShowPricingModal: true,
        debugInfo
      };
    }

    // User has businesses and valid plan - onboarding complete
    return {
      step: 'complete',
      shouldRedirect: false,
      shouldShowPricingModal: false,
      debugInfo
    };

  } catch (error) {
    console.error('🔍 OnboardingUtils: Error getting onboarding status:', error);
    return {
      step: 'incomplete',
      shouldRedirect: false,
      shouldShowPricingModal: false
    };
  }
}

/**
 * Update the onboarding step for a user's account
 * This function updates the database with the user's current onboarding progress
 */
export async function updateOnboardingStep(
  supabase: SupabaseClient,
  accountId: string,
  step: OnboardingStep
): Promise<void> {
  try {
    
    const { error } = await supabase
      .from('accounts')
      .update({ onboarding_step: step })
      .eq('id', accountId);

    if (error) {
      console.error('🔍 OnboardingUtils: Error updating onboarding step:', error);
      throw error;
    }

  } catch (error) {
    console.error('🔍 OnboardingUtils: Failed to update onboarding step:', error);
    throw error;
  }
}

/**
 * Get the next onboarding step based on current status
 * This helps determine what step should come next in the flow
 */
export function getNextOnboardingStep(
  currentStep: OnboardingStep,
  hasBusinesses: boolean,
  hasPlan: boolean
): OnboardingStep {
  switch (currentStep) {
    case 'incomplete':
      return 'needs_business';
    case 'needs_business':
      return hasBusinesses ? 'needs_plan' : 'needs_business';
    case 'needs_plan':
      return hasPlan ? 'complete' : 'needs_plan';
    case 'complete':
      return 'complete';
    default:
      return 'incomplete';
  }
}

/**
 * Check if a user needs to complete onboarding
 * This is a quick check to see if onboarding is required
 */
export function needsOnboarding(step: OnboardingStep): boolean {
  return step !== 'complete';
}

/**
 * Get user-friendly message for onboarding step
 * This provides helpful messages for debugging and user communication
 */
export function getOnboardingStepMessage(step: OnboardingStep): string {
  switch (step) {
    case 'incomplete':
      return 'User needs to start onboarding process';
    case 'needs_business':
      return 'User needs to create their first business';
    case 'needs_plan':
      return 'User needs to select a plan';
    case 'complete':
      return 'User has completed onboarding';
    default:
      return 'Unknown onboarding step';
  }
}

/**
 * Integrate with business creation to update onboarding step
 * Call this when a user successfully creates their first business
 */
export async function handleBusinessCreated(
  supabase: SupabaseClient,
  accountId: string
): Promise<void> {
  try {
    await updateOnboardingStep(supabase, accountId, 'needs_plan');
  } catch (error) {
    console.error('💥 OnboardingUtils: Error updating onboarding step after business creation:', error);
  }
}

/**
 * Integrate with plan selection to update onboarding step
 * Call this when a user successfully selects a plan
 */
export async function handlePlanSelected(
  supabase: SupabaseClient,
  accountId: string
): Promise<void> {
  try {
    await updateOnboardingStep(supabase, accountId, 'complete');
  } catch (error) {
    console.error('💥 OnboardingUtils: Error updating onboarding step after plan selection:', error);
  }
} 