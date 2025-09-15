/**
 * Payment State Management Demo Page
 * 
 * This page demonstrates the comprehensive payment state management system
 * integrated with AuthContext and Stripe.
 */

'use client';

import { useAuth } from '@/auth';
import PaymentStatus, { PaymentStateExamples } from '@/app/(app)/components/PaymentStatus';
import { useEffect } from 'react';
import { useGlobalLoader } from '@/app/(app)/components/GlobalLoaderProvider';

export default function PaymentDemoPage() {
  const authData = useAuth();
  const loader = useGlobalLoader();
  useEffect(() => {
    if (!authData || authData.isLoading) loader.show('payment-demo'); else loader.hide('payment-demo');
    return () => loader.hide('payment-demo');
  }, [authData, loader]);
  if (!authData) return null;
  
  const { 
    isAuthenticated, 
    isLoading, 
    user,
    // Payment states for quick reference
    subscriptionStatus,
    trialStatus,
    currentPlan,
    hasActivePlan,
    canAccessFeatures,
    planTier
  } = authData;

  if (isLoading) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 shadow-lg max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment State Demo</h1>
          <p className="text-gray-600 mb-6">
            This page demonstrates our comprehensive payment state management system.
            Please sign in to view your payment status.
          </p>
          <a
            href="/auth/sign-in"
            className="block w-full bg-slate-600 text-white text-center py-3 px-4 rounded-md hover:bg-slate-700 transition-colors"
          >
            Sign In to Continue
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            💳 Payment State Management Demo
          </h1>
          <p className="text-gray-600 mb-4">
            Comprehensive Stripe integration with real-time payment states, trial management, and access control.
          </p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>👤 {user?.email}</span>
            <span>•</span>
            <span>📊 Subscription: {subscriptionStatus || 'None'}</span>
            <span>•</span>
            <span>🎯 Trial: {trialStatus}</span>
            <span>•</span>
            <span>📋 Plan: {currentPlan || 'None'}</span>
          </div>
        </div>

        {/* Main Payment Status Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <PaymentStatus showDebug={true} />
          </div>
          <div>
            <PaymentStateExamples />
          </div>
        </div>

        {/* Feature Access Demo */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🔐 Feature Access Control Demo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Basic Feature */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">📝 Basic Feature</h3>
              <p className="text-sm text-gray-600 mb-3">
                Available to all users during trial and paid plans
              </p>
              <button
                disabled={!canAccessFeatures}
                className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  canAccessFeatures 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {canAccessFeatures ? 'Access Feature' : 'Restricted'}
              </button>
            </div>

            {/* Premium Feature */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">⭐ Premium Feature</h3>
              <p className="text-sm text-gray-600 mb-3">
                Requires active paid plan
              </p>
              <button
                disabled={!hasActivePlan}
                className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  hasActivePlan 
                    ? 'bg-purple-600 text-white hover:bg-purple-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {hasActivePlan ? 'Access Premium' : 'Upgrade Required'}
              </button>
            </div>

            {/* Tier-Based Feature */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">🏢 Tier 3+ Feature</h3>
              <p className="text-sm text-gray-600 mb-3">
                Available for Maven (Tier 3) and Enterprise plans
              </p>
              <button
                disabled={planTier !== 'tier3' && planTier !== 'enterprise'}
                className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  (planTier === 'tier3' || planTier === 'enterprise')
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {(planTier === 'tier3' || planTier === 'enterprise') ? 'Access Advanced Feature' : `Requires Tier 3+ (Current: ${planTier || 'none'})`}
              </button>
            </div>
          </div>
        </div>

        {/* Implementation Guide */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🛠️ Implementation Guide
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Payment State Checking</h3>
              <pre className="bg-gray-50 p-3 rounded-md text-sm overflow-x-auto">
{`const { subscriptionStatus, trialStatus, hasActivePlan } = useAuth();

// Check if user can access features
if (canAccessFeatures) {
  // Show features
} else {
  // Show upgrade prompt
}`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Feature Access Control</h3>
              <pre className="bg-gray-50 p-3 rounded-md text-sm overflow-x-auto">
{`const { requireActivePlan, requirePaymentMethod } = useAuth();

// Guard premium features
const handlePremiumFeature = () => {
  if (requireActivePlan()) {
    // User has active plan, show feature
  }
  // If false, error is automatically set in AuthContext
};`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Trial Management</h3>
              <pre className="bg-gray-50 p-3 rounded-md text-sm overflow-x-auto">
{`const { trialStatus, trialDaysRemaining, isTrialExpiringSoon } = useAuth();

// Show trial warnings
if (isTrialExpiringSoon) {
  // Show "Trial ending soon" banner
}

// Handle trial expiration
if (trialStatus === 'expired') {
  // Redirect to plan selection
}`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">4. Payment Method Validation</h3>
              <pre className="bg-gray-50 p-3 rounded-md text-sm overflow-x-auto">
{`const { paymentMethodStatus, hasPaymentMethod } = useAuth();

// Check payment method status
if (paymentMethodStatus === 'expired') {
  // Show payment method update prompt
}

// Validate before subscription changes
if (requirePaymentMethod()) {
  // Proceed with subscription action
}`}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-white/80 text-sm">
            This demo showcases comprehensive payment state management with Stripe integration.
          </p>
          <div className="mt-2 space-x-4">
            <a 
              href="/dashboard" 
              className="text-white/80 hover:text-white text-sm underline"
            >
              Back to Dashboard
            </a>
            <a 
              href="/dashboard/plan" 
              className="text-white/80 hover:text-white text-sm underline"
            >
              View Plans
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 
