import React from 'react';
import { getPlanTransitionMessage } from '@/lib/billing/planMessages';

type PlanKey = 'grower' | 'builder' | 'maven';
type BillingPeriod = 'monthly' | 'annual';

interface PlanTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentPlan: PlanKey;
  currentBilling: BillingPeriod;
  targetPlan: PlanKey;
  targetBilling: BillingPeriod;
  isProcessing?: boolean;
  planDisplayName?: string;
}

export default function PlanTransitionModal({
  isOpen,
  onClose,
  onConfirm,
  currentPlan,
  currentBilling,
  targetPlan,
  targetBilling,
  isProcessing = false,
  planDisplayName,
}: PlanTransitionModalProps) {
  if (!isOpen) return null;

  const message = getPlanTransitionMessage(currentPlan, currentBilling, targetPlan, targetBilling);
  const isDowngrade = message.icon === 'downgrade';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md mx-4 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-200 z-10"
          aria-label="Close modal"
          disabled={isProcessing}
        >
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {isProcessing ? (
          // Processing state
          <div className="text-center">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDowngrade ? 'border-red-600' : 'border-slate-blue'} mx-auto mb-4`}></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isDowngrade ? 'Downgrading' : 'Upgrading'} your plan...
            </h3>
            <p className="text-gray-600 mb-4">
              We're processing your {isDowngrade ? 'downgrade' : 'upgrade'} to {planDisplayName || targetPlan}. 
              This may take a few moments.
            </p>
            
            {/* Powered by Stripe */}
            <div className="flex items-center justify-center space-x-2 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-500">Powered by</span>
              <span className="text-sm font-semibold" style={{ color: '#635BFF' }}>Stripe</span>
            </div>
          </div>
        ) : (
          // Confirmation state
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {message.title}
            </h2>
            <p className="text-gray-600 mb-4">
              {message.subtitle}
            </p>

            {/* Benefits (for upgrades and billing changes) */}
            {message.benefits && message.benefits.length > 0 && (
              <ul className="text-green-600 mb-6 space-y-1">
                {message.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2 mt-0.5">✓</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Warnings (for downgrades) */}
            {message.warnings && message.warnings.length > 0 && (
              <>
                <p className="text-gray-600 mb-3">
                  {isDowngrade ? "You'll lose access to:" : "Please note:"}
                </p>
                <ul className="text-red-600 mb-6 space-y-1">
                  {message.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-500 mr-2 mt-0.5">✗</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="flex justify-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className={`px-6 py-2 text-white font-medium rounded-lg transition-colors ${message.confirmButtonClass}`}
              >
                {message.confirmButtonText}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}