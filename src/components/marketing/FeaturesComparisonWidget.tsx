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
    icon: 'prompty'
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
    icon: 'FaSentimentAnalyzer'
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
      <div className="bg-white/20 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/30">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-white mb-2">Features we do have</h3>
          <p className="text-white/90">
            Our human-first & AI-assisted approach means making it easier for you and your customers to connect.
          </p>
        </div>

        <ul className="space-y-3">
          {featuresWeHave.map((feature, index) => (
            <li
              key={index}
              className="group flex items-center gap-4 p-3 rounded-lg transition-all duration-300 hover:bg-white/20 hover:scale-[1.02]"
            >
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                {feature.customIcon ? feature.customIcon : (
                  <Icon
                    name={feature.icon as any}
                    size={feature.icon === 'FaQrcode' ? 36 : feature.icon === 'prompty' ? 28 : 32}
                    color="white"
                  />
                )}
              </div>
              <span className="text-white leading-relaxed">{feature.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Features We Don't Have - Glassmorphic Card */}
      <div className="bg-white/20 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/30">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-white mb-2">Features we don't have</h3>
          <p className="text-white/90">
            We believe AI should support relationships, not replace them.
          </p>
        </div>

        <ul className="space-y-3">
          {featuresWeDontHave.map((feature, index) => (
            <li
              key={index}
              className="group flex items-center gap-4 p-3 rounded-lg transition-all duration-300 hover:bg-white/20 hover:scale-[1.02]"
            >
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <Icon
                  name={feature.icon as any}
                  size={32}
                  color="white"
                />
              </div>
              <span className="text-white leading-relaxed">{feature.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
