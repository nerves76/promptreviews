/**
 * Features Comparison Widget
 *
 * Glassmorphic two-column widget showing what Prompt Reviews does and doesn't do
 * Uses app icons and glassmorphic design aesthetic
 */

'use client';

import Icon from '@/components/Icon';

interface Feature {
  text: string;
  icon: string;
}

const featuresWeHave: Feature[] = [
  {
    text: 'Personalized landing pages & review widgets',
    icon: 'prompty' // [P] icon for Prompt Pages
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
    icon: 'FaGoogle' // Google "G" icon
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
    icon: 'FaUsers' // Community uses FaUsers
  },
  {
    text: 'Review Sentiment Analysis for insights',
    icon: 'FaSmile' // Using emoji/sentiment icon
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

        <ul className="space-y-4">
          {featuresWeHave.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-7 h-7 mt-0.5 bg-white/60 backdrop-blur-xl rounded-full shadow-md flex items-center justify-center">
                <Icon
                  name={feature.icon as any}
                  className="w-4 h-4 text-green-600"
                />
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

        <ul className="space-y-4">
          {featuresWeDontHave.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-7 h-7 mt-0.5 bg-white/60 backdrop-blur-xl rounded-full shadow-md flex items-center justify-center">
                <Icon
                  name={feature.icon as any}
                  className="w-4 h-4 text-red-500"
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
