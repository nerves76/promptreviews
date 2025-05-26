import React, { useState } from 'react';

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
      '**14-day free trial*',
      'Universal prompt page',
      '3 custom prompt pages',
      'Review widget',
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
      'Workflow management',
      'Universal prompt page',
      '1000 contacts / prompt pages',
      'Review widget',
      'Analytics',
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
      'Up to 10 Business Locations',
      'Workflow management',
      '1 Universal prompt page per business',
      '10,000 contacts / prompt pages',
      'Review widget',
      'Analytics',
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

const featureTooltips: Record<string, string> = {
  'Workflow management': 'Automate and organize your review collection process.',
  'Review widget': 'Embed a review collection widget on your website.',
  'Analytics': 'Track review performance and engagement.',
  'Universal prompt page': 'A single page to collect reviews from any platform, including a QR code for easy sharing.',
  'custom prompt pages': 'Custom prompt pages are designed for sending a personalized review request to an individual customer or client.',
  'prompt pages': 'Prompt pages are designed for sending a personalized review request to an individual customer or client.',
};

export default function PricingModal({ onSelectTier, asModal = true, currentPlan }: PricingModalProps) {
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{x: number, y: number} | null>(null);
  const wrapperClass = asModal
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 overflow-y-auto'
    : 'w-full flex flex-col items-center justify-center';
  return (
    <div className={wrapperClass}>
      <div className="flex flex-col items-center w-full max-w-7xl mx-auto p-8 px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center w-full">Choose your plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {tiers.map(tier => {
            const isGrower = tier.key === 'grower';
            return (
              <div
                key={tier.key}
                className={
                  `${tier.bg} rounded-2xl shadow-lg p-8 md:p-10 flex flex-col items-center w-full max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg relative ` +
                  (isGrower ? ' border-4 border-slate-blue ring-2 ring-yellow-400' : '')
                }
                style={{ minHeight: 420, marginBottom: '2rem' }}
              >
                {isGrower && (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 font-bold px-4 py-1 rounded-full text-xs shadow-lg z-10 border border-yellow-300">14-day Free Trial</span>
                )}
                <h3 className={`text-3xl font-bold mb-2 ${tier.text}`}>{tier.name}</h3>
                <div className={`text-2xl font-semibold mb-4 ${tier.text}`}>{tier.price}</div>
                <ul className="mb-8 text-lg text-gray-800 space-y-2">
                  {tier.features.map(f => {
                    const isBold = f.startsWith('**');
                    const cleanFeature = f.replace('**', '');
                    let tooltipText = featureTooltips[cleanFeature.replace('*', '').trim()];
                    if (!tooltipText && cleanFeature.toLowerCase().includes('prompt pages')) {
                      tooltipText = featureTooltips['prompt pages'];
                    }
                    return (
                      <li
                        key={f}
                        className={isBold ? 'font-bold flex items-center' : 'flex items-center'}
                        style={{ position: 'relative' }}
                        onMouseEnter={e => {
                          if (tooltipText) {
                            setTooltip(tooltipText);
                            const rect = (e.target as HTMLElement).getBoundingClientRect();
                            setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
                          }
                        }}
                        onMouseLeave={() => { setTooltip(null); setTooltipPos(null); }}
                      >
                        {cleanFeature}
                        {tooltipText && (
                          <span className="ml-2 text-gray-400 cursor-pointer" tabIndex={0} aria-label="More info">&#9432;</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <button
                  className={`w-full mt-auto py-3 rounded-lg font-semibold text-lg ${tier.button}`}
                  onClick={() => onSelectTier(tier.key)}
                  disabled={tier.key === currentPlan && !!currentPlan}
                >
                  {getButtonLabel(tier.key, currentPlan)}
                </button>
                {tier.key === 'grower' && (
                  <div className="mt-2 text-xs text-gray-500 text-center w-full">*No credit card necessary</div>
                )}
              </div>
            );
          })}
        </div>
        {tooltip && tooltipPos && (
          <div
            className="fixed z-50 px-4 py-2 bg-white text-gray-900 text-sm rounded shadow-lg border border-gray-200"
            style={{ left: tooltipPos.x, top: tooltipPos.y - 40, transform: 'translate(-50%, -100%)', pointerEvents: 'none' }}
          >
            {tooltip}
          </div>
        )}
        <div className="mt-8 text-xs text-gray-300 text-center w-full">
          By continuing, you agree to our{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline text-gray-100 hover:text-yellow-200">Terms & Conditions</a>{' '}and{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline text-gray-100 hover:text-yellow-200">Privacy Policy</a>.
        </div>
      </div>
    </div>
  );
} 