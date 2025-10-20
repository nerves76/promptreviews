/**
 * Features Comparison Widget
 *
 * Glassmorphic two-column widget showing what Prompt Reviews does and doesn't do
 * Uses app icons and glassmorphic design aesthetic with hover states
 */

'use client';

import Icon from '@/components/Icon';

interface Feature {
  text: string;
  icon?: string;
  customIcon?: React.ReactNode;
}

const featuresWeHave: Feature[] = [
  {
    text: 'Personalized landing pages & review widgets',
    customIcon: <span className="font-bold text-lg">[P]</span>
  },
  {
    text: 'QR codes to capture reviews instantly',
    icon: 'FaQrcode'
  },
  {
    text: 'Tools to make writing reviews easier (with or without AI)',
    icon: 'FaLightbulb'
  },
  {
    text: 'Google Business Profile management (multi-location)',
    icon: 'FaGoogle'
  },
  {
    text: 'Contact upload & campaign tools',
    icon: 'FaUsers'
  },
  {
    text: 'Emoji-based private feedback flow',
    icon: 'FaSmile'
  },
  {
    text: 'Built-in community for learning & sharing',
    icon: 'FaUsers'
  },
  {
    text: 'Review Sentiment Analysis for insights',
    icon: 'FaChartLine'
  }
];

const featuresWeDontHave: Feature[] = [
  {
    text: 'No AI bots responding to your reviews',
    icon: 'FaTimes'
  },
  {
    text: 'No automated reminders or insistent alerts for your customers',
    icon: 'FaTimes'
  },
  {
    text: 'No mass messaging or emailing',
    icon: 'FaTimes'
  },
  {
    text: 'No inflated pricing or hidden upgrades',
    icon: 'FaTimes'
  }
];

interface FeaturesComparisonWidgetProps {
  className?: string;
}

export default function FeaturesComparisonWidget({ className = '' }: FeaturesComparisonWidgetProps) {
  return (
    <div className={`grid md:grid-cols-2 gap-6 ${className}`}>
      {/* Features We Have - Glassmorphic Card */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 border-2 border-white">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Features we do have</h3>
          <p className="text-gray-700">
            Our human-first & AI-assisted approach means making it easier for you and your customers to connect.
          </p>
        </div>

        <ul className="space-y-3">
          {featuresWeHave.map((feature, index) => (
            <li
              key={index}
              className="flex items-center gap-4 p-3 rounded-lg transition-colors hover:bg-green-50/50"
            >
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-green-600">
                {feature.customIcon ? (
                  <span className="font-bold text-2xl">[P]</span>
                ) : (
                  <Icon
                    name={feature.icon as any}
                    size={48}
                  />
                )}
              </div>
              <span className="text-gray-800 leading-relaxed">{feature.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Features We Don't Have - Glassmorphic Card */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 border-2 border-white">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Features we don't have</h3>
          <p className="text-gray-700">
            We believe AI should support relationships, not replace them.
          </p>
        </div>

        <ul className="space-y-3">
          {featuresWeDontHave.map((feature, index) => (
            <li
              key={index}
              className="flex items-center gap-4 p-3 rounded-lg transition-colors hover:bg-red-50/50"
            >
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-red-500">
                <Icon
                  name={feature.icon as any}
                  size={48}
                />
              </div>
              <span className="text-gray-800 leading-relaxed">{feature.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
