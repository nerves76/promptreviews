import React from 'react';
import { useRouter } from 'next/navigation';
import { getSuccessMessage } from '@/lib/billing/planMessages';

type PlanKey = 'grower' | 'builder' | 'maven';
type BillingPeriod = 'monthly' | 'annual';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'upgrade' | 'downgrade' | 'billing_period' | 'new';
  fromPlan?: PlanKey;
  toPlan?: PlanKey;
  toBilling?: BillingPeriod;
}

export default function SuccessModal({
  isOpen,
  onClose,
  action,
  fromPlan,
  toPlan,
  toBilling,
}: SuccessModalProps) {
  const router = useRouter();
  
  if (!isOpen) return null;

  const { title, message } = getSuccessMessage(action, fromPlan, toPlan, toBilling);

  const handleContinue = () => {
    onClose();
    router.push('/dashboard');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-200 z-10"
          aria-label="Close modal"
        >
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Success Icon or Crompty Image */}
        <div className="mb-6 flex justify-center">
          {action === 'new' ? (
            <img
              src="/images/small-prompty-success.png"
              alt="Crompty Success"
              className="w-24 h-24 object-contain"
            />
          ) : (
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              action === 'downgrade' ? 'bg-amber-100' : 'bg-green-100'
            }`}>
              <svg 
                className={`w-10 h-10 ${action === 'downgrade' ? 'text-amber-600' : 'text-green-600'}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                {action === 'downgrade' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {title}
        </h2>
        
        <p className="text-gray-600 mb-6">
          {message}
        </p>

        {/* Additional info based on action */}
        {action === 'upgrade' && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              💡 Pro tip: Check out your new features in the dashboard and start using them right away!
            </p>
          </div>
        )}

        {action === 'downgrade' && (
          <div className="bg-amber-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800">
              Your current features will remain available until the end of your billing period.
            </p>
          </div>
        )}

        <button
          onClick={handleContinue}
          className="bg-slate-blue text-white px-6 py-2 rounded-lg hover:bg-slate-blue/90 transition-colors"
        >
          Continue to dashboard
        </button>
      </div>
    </div>
  );
}