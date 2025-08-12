/**
 * Account Reactivation Component
 * 
 * CRITICAL: Displays when cancelled users return
 * Guides them through reactivation and plan selection
 * 
 * @description Makes it easy for users to come back
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAccountReactivation } from '@/lib/account-reactivation';
import { createClient } from '@/utils/supabaseClient';

// ============================================
// TYPES
// ============================================

interface ReactivationOffer {
  hasOffer: boolean;
  offerType?: string;
  discount?: number;
  message?: string;
}

interface ReactivationProps {
  onReactivated?: () => void;
  onSkip?: () => void;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AccountReactivation({ onReactivated, onSkip }: ReactivationProps) {
  const router = useRouter();
  const { account, refreshAccount } = useAuth();
  const { checkAndReactivate, getOffer } = useAccountReactivation();
  
  const [loading, setLoading] = useState(true);
  const [reactivating, setReactivating] = useState(false);
  const [offer, setOffer] = useState<ReactivationOffer | null>(null);
  const [daysInactive, setDaysInactive] = useState<number>(0);
  const [dataStatus, setDataStatus] = useState<'intact' | 'partial' | 'deleted'>('intact');
  const [showDetails, setShowDetails] = useState(false);
  
  const supabase = createClient();

  // ============================================
  // CHECK REACTIVATION STATUS
  // ============================================
  useEffect(() => {
    checkStatus();
  }, [account]);

  const checkStatus = async () => {
    if (!account?.id) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Checking reactivation status for account:', account.id);
      
      // Check if account needs reactivation
      const status = await checkAndReactivate(account.id);
      
      if (status.requiresPlanSelection) {
        setDaysInactive(status.daysInactive || 0);
        setDataStatus(status.dataStatus || 'intact');
        
        // Get any available offers
        const availableOffer = await getOffer(account.id);
        setOffer(availableOffer);
        
        console.log('💡 Reactivation needed. Days inactive:', status.daysInactive);
        console.log('🎁 Offer available:', availableOffer);
      } else {
        // Account is active, no reactivation needed
        console.log('✅ Account is active, no reactivation needed');
        if (onSkip) onSkip();
      }
    } catch (error) {
      console.error('Error checking reactivation status:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // HANDLE REACTIVATION
  // ============================================
  const handleReactivate = async () => {
    setReactivating(true);
    
    try {
      console.log('🚀 Starting reactivation process...');
      
      // Reactivate the account
      const result = await checkAndReactivate(account!.id);
      
      if (result.success) {
        console.log('✅ Account reactivated successfully');
        
        // Refresh account data
        await refreshAccount();
        
        // Store offer if available (for checkout)
        if (offer?.hasOffer) {
          sessionStorage.setItem('reactivation_offer', JSON.stringify(offer));
        }
        
        // Redirect to plan selection
        router.push('/pricing?reactivation=true');
        
        if (onReactivated) onReactivated();
      } else {
        console.error('❌ Reactivation failed:', result.message);
        alert(result.message);
      }
    } catch (error) {
      console.error('Error during reactivation:', error);
      alert('Failed to reactivate account. Please try again.');
    } finally {
      setReactivating(false);
    }
  };

  // ============================================
  // HANDLE CREATE NEW ACCOUNT
  // ============================================
  const handleCreateNew = () => {
    // Sign out current session
    supabase.auth.signOut();
    
    // Redirect to sign up
    router.push('/sign-up?previous_account=true');
  };

  // ============================================
  // RENDER LOADING
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking account status...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER REACTIVATION UI
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Welcome Back Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">👋</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back!
            </h1>
            <p className="text-gray-600">
              We're happy to see you again
            </p>
          </div>

          {/* Status Message */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900 mb-2">
              Your account was cancelled <strong>{daysInactive} days ago</strong>.
            </p>
            
            {dataStatus === 'intact' && (
              <p className="text-sm text-green-700">
                ✅ All your data has been preserved and is ready for you.
              </p>
            )}
            
            {dataStatus === 'partial' && (
              <p className="text-sm text-yellow-700">
                ⚠️ Your data is still available but will be deleted in {90 - daysInactive} days.
              </p>
            )}
            
            {dataStatus === 'deleted' && (
              <p className="text-sm text-red-700">
                ❌ Your data has been permanently deleted after 90 days of inactivity.
              </p>
            )}
          </div>

          {/* Special Offer */}
          {offer?.hasOffer && (
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 mb-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wide opacity-90">
                  Special Offer
                </span>
                <span className="text-2xl font-bold">
                  {offer.discount}% OFF
                </span>
              </div>
              <p className="text-sm opacity-95">
                {offer.message}
              </p>
            </div>
          )}

          {/* Data Summary */}
          {dataStatus === 'intact' && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full text-left mb-6"
            >
              <div className="flex items-center justify-between text-sm text-gray-600 hover:text-gray-900">
                <span>View your preserved data</span>
                <span>{showDetails ? '▼' : '▶'}</span>
              </div>
              
              {showDetails && (
                <div className="mt-3 p-4 bg-gray-50 rounded-lg text-sm">
                  <p className="text-gray-700 mb-2">Your account includes:</p>
                  <ul className="space-y-1 text-gray-600">
                    <li>• All prompt pages</li>
                    <li>• Contact lists</li>
                    <li>• Communication history</li>
                    <li>• Analytics data</li>
                    <li>• Custom settings</li>
                  </ul>
                </div>
              )}
            </button>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {dataStatus !== 'deleted' ? (
              <>
                <button
                  onClick={handleReactivate}
                  disabled={reactivating}
                  className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {reactivating ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                      Reactivating...
                    </span>
                  ) : (
                    <>Reactivate Account & Choose Plan</>
                  )}
                </button>
                
                <button
                  onClick={handleCreateNew}
                  className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Start Fresh with New Account
                </button>
              </>
            ) : (
              <button
                onClick={handleCreateNew}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Create New Account
              </button>
            )}
            
            <button
              onClick={onSkip}
              className="w-full py-3 px-4 text-gray-500 hover:text-gray-700 text-sm transition-colors"
            >
              Skip for now
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Need help? Contact support at support@promptreviews.com
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            By reactivating, you agree to our{' '}
            <a href="/terms" className="text-blue-600 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}