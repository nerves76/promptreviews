import React from 'react';
import { useRouter } from 'next/navigation';
import { getSuccessMessage } from '@/lib/billing/planMessages';
import { Modal } from '@/app/(app)/components/ui/modal';
import { Button } from '@/app/(app)/components/ui/button';

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

  const { title, message } = getSuccessMessage(action, fromPlan, toPlan, toBilling);

  const handleContinue = () => {
    onClose();
    router.push('/dashboard');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" className="text-center">
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
            Pro tip: Check out your new features in the dashboard and start using them right away!
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

      <Button onClick={handleContinue} className="w-full sm:w-auto">
        Continue to dashboard
      </Button>
    </Modal>
  );
}
