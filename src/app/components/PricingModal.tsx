import React from 'react';

const tiers = [
  {
    key: 'grower',
    name: 'Grower',
    price: '20 / month',
    order: 1,
    bg: 'bg-blue-100', // Replace with your brand color if needed
    text: 'text-purple-700',
    button: 'bg-purple-500 hover:bg-purple-600 text-white',
    features: [
      '14-day free trial',
      'Universal Prompt Page',
      '3 custom prompt pages',
    ],
  },
  {
    key: 'builder',
    name: 'Builder',
    price: '40 / month',
    order: 2,
    bg: 'bg-purple-200', // Replace with your brand color if needed
    text: 'text-purple-700',
    button: 'bg-purple-500 hover:bg-purple-600 text-white',
    features: [
      'Universal Prompt Page',
      '100 Custom Prompt Pages',
      'Manage contacts',
      'Website widget',
    ],
  },
  {
    key: 'maven',
    name: 'Maven',
    price: '100 / month',
    order: 3,
    bg: 'bg-yellow-200', // Replace with your brand color if needed
    text: 'text-purple-700',
    button: 'bg-purple-500 hover:bg-purple-600 text-white',
    features: [
      'Universal Prompt Page',
      '500 Custom Prompt Pages',
      'Manage contacts',
      'Website widget',
    ],
  },
];

interface PricingModalProps {
  onSelectTier: (tierKey: string) => void;
  asModal?: boolean;
  currentPlan?: string;
}

function getButtonLabel(tierKey: string, currentPlan?: string) {
  if (!currentPlan) return 'Choose';
  if (tierKey === currentPlan) return 'Your Plan';
  if (currentPlan === 'free') return 'Choose';
  const current = tiers.find(t => t.key === currentPlan);
  const target = tiers.find(t => t.key === tierKey);
  if (!current || !target) return 'Choose';
  if (target.order > current.order) return 'Upgrade';
  if (target.order < current.order) return 'Downgrade';
  return 'Choose';
}

export default function PricingModal({ onSelectTier, asModal = true, currentPlan }: PricingModalProps) {
  const wrapperClass = asModal
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60'
    : 'w-full flex flex-col items-center justify-center';
  return (
    <div className={wrapperClass}>
      <div className="flex flex-col items-center w-full max-w-5xl mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {tiers.map(tier => (
            <div
              key={tier.key}
              className={`${tier.bg} rounded-2xl shadow-lg p-8 flex flex-col items-center`}
            >
              <h3 className={`text-3xl font-bold mb-2 ${tier.text}`}>{tier.name}</h3>
              <div className={`text-2xl font-semibold mb-4 ${tier.text}`}>{tier.price}</div>
              <ul className="mb-8 text-lg text-gray-800">
                {tier.features.map(f => <li key={f}>{f}</li>)}
              </ul>
              <button
                className={`w-full mt-auto py-3 rounded-lg font-semibold text-lg ${tier.button}`}
                onClick={() => onSelectTier(tier.key)}
                disabled={tier.key === currentPlan && !!currentPlan}
              >
                {getButtonLabel(tier.key, currentPlan)}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 