/**
 * Payment Status Component
 * 
 * Demonstrates comprehensive payment state management using the enhanced AuthContext.
 * Shows all payment states, trial management, and billing functionality.
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FiveStarSpinner } from './FiveStarSpinner';

interface PaymentStatusProps {
  showDebug?: boolean;
}

export default function PaymentStatus({ showDebug = false }: PaymentStatusProps) {
  const {
    // Payment States
    subscriptionStatus,
    paymentStatus,
    trialStatus,
    trialDaysRemaining,
    isTrialExpiringSoon,
    currentPlan,
    planTier,
    hasActivePlan,
    requiresPlanSelection,
    hasPaymentMethod,
    paymentMethodStatus,
    accountStatus,
    canAccessFeatures,
    accessLevel,
    hasHadPaidPlan,
    isReactivated,
    
    // Functions
    refreshPaymentStatus,
    requireActivePlan,
    requirePaymentMethod,
    
    // Core states
    isLoading,
    accountLoading,
    isAuthenticated,
    account,
  } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-600">Please sign in to view payment status</p>
      </div>
    );
  }

  if (isLoading || accountLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 flex items-center justify-center">
        <FiveStarSpinner />
        <span className="ml-3 text-gray-600">Loading payment status...</span>
      </div>
    );
  }

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'current':
      case 'valid':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'trialing':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'past_due':
      case 'expired':
      case 'requires_action':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'canceled':
      case 'suspended':
      case 'missing':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const StatusBadge = ({ status, label }: { status: string; label: string }) => (
    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(status)}`}>
      {label}: {status}
    </span>
  );

  // Trial expiration warning
  const TrialWarning = () => {
    if (trialStatus !== 'active') return null;

    if (isTrialExpiringSoon) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-red-800 mb-2">⚠️ Trial Expiring Soon!</h3>
          <p className="text-red-700">
            Your trial expires in {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''}. 
            Please select a plan to continue using all features.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-blue-800 mb-2">🎉 Trial Active</h3>
        <p className="text-blue-700">
          You have {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} left in your trial period.
        </p>
      </div>
    );
  };

  // Payment method warning
  const PaymentMethodWarning = () => {
    if (paymentMethodStatus === 'missing' && hasActivePlan) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-yellow-800 mb-2">💳 Payment Method Required</h3>
          <p className="text-yellow-700">
            Your subscription is active but requires a valid payment method to continue.
          </p>
        </div>
      );
    }

    if (paymentMethodStatus === 'expired') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-red-800 mb-2">💳 Payment Method Expired</h3>
          <p className="text-red-700">
            Your payment method has expired. Please update it to avoid service interruption.
          </p>
        </div>
      );
    }

    return null;
  };

  // Account status summary
  const AccountStatusSummary = () => {
    const getAccountMessage = () => {
      switch (accountStatus) {
        case 'active':
          return { 
            title: '✅ Account Active', 
            message: 'Your account is in good standing with full access to all features.',
            color: 'green'
          };
        case 'suspended':
          return { 
            title: '🚫 Account Suspended', 
            message: 'Your account has been suspended. Please contact support.',
            color: 'red'
          };
        case 'canceled':
          return { 
            title: '❌ Account Canceled', 
            message: 'Your account has been canceled. Data will be retained for 90 days.',
            color: 'red'
          };
        case 'requires_action':
          return { 
            title: '⚠️ Action Required', 
            message: 'Your account requires attention. Please review payment details.',
            color: 'yellow'
          };
        default:
          return { 
            title: '❓ Unknown Status', 
            message: 'Please contact support for assistance.',
            color: 'gray'
          };
      }
    };

    const status = getAccountMessage();
    const bgColor = status.color === 'green' ? 'bg-green-50 border-green-200' :
                   status.color === 'red' ? 'bg-red-50 border-red-200' :
                   status.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
                   'bg-gray-50 border-gray-200';
    
    const textColor = status.color === 'green' ? 'text-green-800' :
                     status.color === 'red' ? 'text-red-800' :
                     status.color === 'yellow' ? 'text-yellow-800' :
                     'text-gray-800';

    return (
      <div className={`${bgColor} border rounded-lg p-4 mb-4`}>
        <h3 className={`font-semibold ${textColor} mb-2`}>{status.title}</h3>
        <p className={textColor}>{status.message}</p>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6 text-gray-900">Payment Status</h2>
      
      {/* Account Status Summary */}
      <AccountStatusSummary />
      
      {/* Trial Warning */}
      <TrialWarning />
      
      {/* Payment Method Warning */}
      <PaymentMethodWarning />

      {/* Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Subscription</h3>
          <StatusBadge status={subscriptionStatus || 'none'} label="Status" />
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Payment</h3>
          <StatusBadge status={paymentStatus || 'none'} label="Status" />
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Trial</h3>
          <StatusBadge status={trialStatus} label="Status" />
          {trialStatus === 'active' && (
            <p className="text-sm text-gray-600 mt-1">{trialDaysRemaining} days remaining</p>
          )}
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Plan</h3>
          <StatusBadge status={currentPlan || 'none'} label="Current" />
          {planTier && (
            <p className="text-sm text-gray-600 mt-1">Tier: {planTier}</p>
          )}
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Payment Method</h3>
          <StatusBadge status={paymentMethodStatus || 'none'} label="Status" />
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Access</h3>
          <StatusBadge status={accessLevel} label="Level" />
          <p className="text-sm text-gray-600 mt-1">
            Features: {canAccessFeatures ? 'Available' : 'Restricted'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={refreshPaymentStatus}
          className="bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700 transition-colors"
        >
          Refresh Payment Status
        </button>
        
        <button
          onClick={() => requireActivePlan()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Test: Require Active Plan
        </button>
        
        <button
          onClick={() => requirePaymentMethod()}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          Test: Require Payment Method
        </button>
      </div>

      {/* Quick Status Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${hasActivePlan ? 'bg-green-500' : 'bg-gray-300'}`} />
          <p className="text-sm text-gray-600">Active Plan</p>
        </div>
        
        <div className="text-center">
          <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${hasPaymentMethod ? 'bg-green-500' : 'bg-gray-300'}`} />
          <p className="text-sm text-gray-600">Payment Method</p>
        </div>
        
        <div className="text-center">
          <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${canAccessFeatures ? 'bg-green-500' : 'bg-red-500'}`} />
          <p className="text-sm text-gray-600">Feature Access</p>
        </div>
        
        <div className="text-center">
          <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${isReactivated ? 'bg-blue-500' : 'bg-gray-300'}`} />
          <p className="text-sm text-gray-600">Reactivated</p>
        </div>
      </div>

      {/* Debug Information */}
      {showDebug && (
        <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <summary className="font-semibold cursor-pointer text-gray-900 mb-2">
            🔍 Debug Information
          </summary>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Account ID:</strong> {account?.id || 'N/A'}</p>
            <p><strong>Stripe Customer ID:</strong> {account?.stripe_customer_id || 'N/A'}</p>
            <p><strong>Stripe Subscription ID:</strong> {account?.stripe_subscription_id || 'N/A'}</p>
            <p><strong>Has Had Paid Plan:</strong> {hasHadPaidPlan ? 'Yes' : 'No'}</p>
            <p><strong>Requires Plan Selection:</strong> {requiresPlanSelection ? 'Yes' : 'No'}</p>
            <p><strong>Trial Start:</strong> {account?.trial_start ? new Date(account.trial_start).toLocaleString() : 'N/A'}</p>
            <p><strong>Trial End:</strong> {account?.trial_end ? new Date(account.trial_end).toLocaleString() : 'N/A'}</p>
            <p><strong>Is Free Account:</strong> {account?.is_free_account ? 'Yes' : 'No'}</p>
          </div>
        </details>
      )}
    </div>
  );
}

// Usage examples for different payment states
export const PaymentStateExamples = () => {
  const { 
    trialStatus, 
    hasActivePlan, 
    canAccessFeatures, 
    accessLevel,
    requireActivePlan,
    requirePaymentMethod 
  } = useAuth();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Payment State Usage Examples</h3>
      
      {/* Trial Status Display */}
      {trialStatus === 'active' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-700">Trial is active - show trial features</p>
        </div>
      )}
      
      {trialStatus === 'expired' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Trial expired - prompt for plan selection</p>
        </div>
      )}
      
      {/* Feature Access Control */}
      {canAccessFeatures ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700">✅ Full feature access available</p>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">❌ Feature access restricted</p>
        </div>
      )}
      
      {/* Access Level Display */}
      {accessLevel === 'limited' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-700">⚠️ Limited access - trial user</p>
        </div>
      )}
      
      {/* Premium Feature Guards */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Premium Feature Example</h4>
        <button
          onClick={() => {
            if (requireActivePlan()) {
              // Show premium feature
              alert('Premium feature unlocked!');
            }
          }}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
        >
          Access Premium Feature
        </button>
      </div>
    </div>
  );
}; 