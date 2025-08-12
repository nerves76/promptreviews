/**
 * Account Reactivation System
 * 
 * CRITICAL: Handles returning users who previously cancelled
 * Allows users to reactivate their account and select a new plan
 * 
 * @description Improves user retention by making it easy to return
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

interface ReactivationResult {
  success: boolean;
  message: string;
  requiresPlanSelection: boolean;
  accountId?: string;
  daysInactive?: number;
  dataStatus?: 'intact' | 'partial' | 'deleted';
}

interface AccountData {
  id: string;
  email: string;
  deleted_at: string | null;
  plan: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  business_name: string | null;
}

// ============================================
// REACTIVATION CLASS
// ============================================

export class AccountReactivationSystem {
  private supabase: SupabaseClient;
  private retentionDays = 90; // Days we keep data after deletion

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Check if a returning user needs reactivation
   * Called on login for users with deleted_at
   */
  async checkReactivationNeeded(userId: string): Promise<ReactivationResult> {
    try {
      console.log('🔄 Checking reactivation status for user:', userId);

      // ============================================
      // Get account data
      // ============================================
      const { data: account, error } = await this.supabase
        .from('accounts')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !account) {
        return {
          success: false,
          message: 'Account not found',
          requiresPlanSelection: false
        };
      }

      // ============================================
      // Check if account is deleted
      // ============================================
      if (!account.deleted_at) {
        return {
          success: true,
          message: 'Account is active',
          requiresPlanSelection: false,
          accountId: account.id
        };
      }

      // ============================================
      // Calculate how long account has been deleted
      // ============================================
      const deletedAt = new Date(account.deleted_at);
      const now = new Date();
      const daysInactive = Math.floor((now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24));

      console.log(`📊 Account deleted ${daysInactive} days ago`);

      // ============================================
      // Check if data is still available
      // ============================================
      let dataStatus: 'intact' | 'partial' | 'deleted' = 'intact';
      
      if (daysInactive > this.retentionDays) {
        // Data should have been purged
        dataStatus = 'deleted';
        console.log('⚠️ Account data may have been purged (>90 days)');
      } else if (daysInactive > 60) {
        // Warning zone
        dataStatus = 'partial';
        console.log('⚠️ Account approaching data purge deadline');
      }

      return {
        success: true,
        message: `Account was cancelled ${daysInactive} days ago`,
        requiresPlanSelection: true,
        accountId: account.id,
        daysInactive,
        dataStatus
      };

    } catch (error) {
      console.error('Error checking reactivation:', error);
      return {
        success: false,
        message: 'Error checking account status',
        requiresPlanSelection: false
      };
    }
  }

  /**
   * Reactivate a cancelled account
   * Clears deleted_at and prepares for new subscription
   */
  async reactivateAccount(userId: string): Promise<ReactivationResult> {
    try {
      console.log('✨ Reactivating account for user:', userId);

      // ============================================
      // Get current account state
      // ============================================
      const { data: account, error: fetchError } = await this.supabase
        .from('accounts')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError || !account) {
        return {
          success: false,
          message: 'Account not found',
          requiresPlanSelection: false
        };
      }

      if (!account.deleted_at) {
        return {
          success: true,
          message: 'Account is already active',
          requiresPlanSelection: account.plan === 'no_plan',
          accountId: account.id
        };
      }

      // ============================================
      // Check data retention period
      // ============================================
      const deletedAt = new Date(account.deleted_at);
      const now = new Date();
      const daysInactive = Math.floor((now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24));

      if (daysInactive > this.retentionDays) {
        // Account data may have been purged
        return {
          success: false,
          message: 'Account data has been permanently deleted after 90 days. Please create a new account.',
          requiresPlanSelection: false,
          daysInactive,
          dataStatus: 'deleted'
        };
      }

      // ============================================
      // Reactivate the account
      // ============================================
      const { error: updateError } = await this.supabase
        .from('accounts')
        .update({
          deleted_at: null,
          plan: 'no_plan', // Force plan selection
          subscription_status: null,
          stripe_subscription_id: null, // Clear old subscription
          reactivated_at: new Date().toISOString(),
          reactivation_count: (account.reactivation_count || 0) + 1
        })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Failed to reactivate account:', updateError);
        return {
          success: false,
          message: 'Failed to reactivate account',
          requiresPlanSelection: false
        };
      }

      console.log('✅ Account successfully reactivated');

      // ============================================
      // Log reactivation event
      // ============================================
      await this.logReactivationEvent(userId, account.email, daysInactive);

      // ============================================
      // Check if user had prompt pages or contacts
      // ============================================
      const { data: promptPages } = await this.supabase
        .from('prompt_pages')
        .select('id')
        .eq('account_id', userId)
        .limit(1);

      const { data: contacts } = await this.supabase
        .from('contacts')
        .select('id')
        .eq('account_id', userId)
        .limit(1);

      const hasData = (promptPages && promptPages.length > 0) || (contacts && contacts.length > 0);

      return {
        success: true,
        message: hasData 
          ? `Welcome back! Your data has been preserved. Please select a plan to continue.`
          : `Welcome back! Please select a plan to get started.`,
        requiresPlanSelection: true,
        accountId: account.id,
        daysInactive,
        dataStatus: 'intact'
      };

    } catch (error) {
      console.error('💥 Error reactivating account:', error);
      return {
        success: false,
        message: 'Unexpected error during reactivation',
        requiresPlanSelection: false
      };
    }
  }

  /**
   * Log reactivation event for analytics
   */
  private async logReactivationEvent(
    userId: string, 
    email: string, 
    daysInactive: number
  ): Promise<void> {
    try {
      await this.supabase
        .from('account_events')
        .insert({
          account_id: userId,
          event_type: 'reactivation',
          event_data: {
            email,
            days_inactive: daysInactive,
            timestamp: new Date().toISOString()
          }
        });
    } catch (error) {
      console.error('Failed to log reactivation event:', error);
      // Don't fail the reactivation if logging fails
    }
  }

  /**
   * Get reactivation offer for returning user
   * Simplified: Everyone gets the same welcome back offer
   */
  async getReactivationOffer(userId: string): Promise<{
    hasOffer: boolean;
    offerType?: string;
    discount?: number;
    message?: string;
  }> {
    try {
      const { data: account } = await this.supabase
        .from('accounts')
        .select('deleted_at')
        .eq('id', userId)
        .single();

      if (!account?.deleted_at) {
        return { hasOffer: false };
      }

      // ============================================
      // Simple offer for all returning users
      // ============================================
      return {
        hasOffer: true,
        offerType: 'welcome_back',
        discount: 50, // Monthly discount
        message: 'Welcome back! Get 50% off your first month or save 20% on annual.'
      };

    } catch (error) {
      console.error('Error getting reactivation offer:', error);
      return { hasOffer: false };
    }
  }
}

/**
 * React Hook for account reactivation
 */
export function useAccountReactivation() {
  const checkAndReactivate = async (userId: string): Promise<ReactivationResult> => {
    const reactivation = new AccountReactivationSystem(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // First check if reactivation is needed
    const status = await reactivation.checkReactivationNeeded(userId);
    
    if (status.requiresPlanSelection && status.dataStatus !== 'deleted') {
      // Automatically reactivate if data is still available
      return await reactivation.reactivateAccount(userId);
    }

    return status;
  };

  const getOffer = async (userId: string) => {
    const reactivation = new AccountReactivationSystem(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    return await reactivation.getReactivationOffer(userId);
  };

  return {
    checkAndReactivate,
    getOffer
  };
}