/**
 * Features Comparison Widget
 *
 * Embeddable two-column widget showing what Prompt Reviews does and doesn't do
 * Uses app icons for visual consistency
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
    icon: 'FaGlobe'
  },
  {
    text: 'QR codes to capture reviews instantly',
    icon: 'FaMobile'
  },
  {
    text: 'Tools to make writing reviews easier (with or without AI)',
    icon: 'FaLightbulb'
  },
  {
    text: 'Google Business Profile management (multi-location)',
    icon: 'FaMapMarker'
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
    icon: 'FaHandsHelping'
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
    <div className={`grid md:grid-cols-2 gap-8 ${className}`}>
      {/* Features We Have */}
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Features we do have</h3>
          <p className="text-gray-600">
            Our human-first & AI-assisted approach means making it easier for you and your customers to connect.
          </p>
        </div>

        <ul className="space-y-4">
          {featuresWeHave.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 mt-0.5">
                <Icon
                  name={feature.icon as any}
                  className="w-6 h-6 text-green-600"
                />
              </div>
              <span className="text-gray-700 leading-relaxed">{feature.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Features We Don't Have */}
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Features we don't have</h3>
          <p className="text-gray-600">
            We believe AI should support relationships, not replace them.
          </p>
        </div>

        <ul className="space-y-4">
          {featuresWeDontHave.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 mt-0.5">
                <Icon
                  name={feature.icon as any}
                  className="w-6 h-6 text-red-500"
                />
              </div>
              <span className="text-gray-700 leading-relaxed">{feature.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
