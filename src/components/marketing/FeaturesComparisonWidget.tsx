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
    text: 'AI-assisted review writing (optional)',
    icon: 'FaLightbulb'
  },
  {
    text: 'Google Business Profile management',
    icon: 'FaGoogle'
  },
  {
    text: 'AI search visibility tracking',
    icon: 'FaEye'
  },
  {
    text: 'Google Maps ranking grid',
    icon: 'FaMapMarker'
  },
  {
    text: 'Keyword research & rank tracking',
    icon: 'FaSearch'
  },
  {
    text: 'Domain analysis',
    icon: 'FaGlobe'
  },
  {
    text: 'Contact management & review campaigns',
    icon: 'FaUpload'
  },
  {
    text: 'Catch concerns privately before they go public',
    icon: 'FaSmile'
  },
  {
    text: 'Built-in community for learning & sharing',
    icon: 'FaUsers'
  },
  {
    text: 'Review sentiment analysis',
    icon: 'FaChartLine'
  }
];

const featuresWeDontHave: Feature[] = [
  {
    text: 'No AI bots responding to your reviews',
    icon: 'FaTimes'
  },
  {
    text: 'No spammy follow-ups to your customers',
    icon: 'FaTimes'
  },
  {
    text: 'No mass messaging or emailing',
    icon: 'FaTimes'
  },
  {
    text: 'No text generation without human oversight',
    icon: 'FaTimes'
  },
  {
    text: 'No holding your data hostage',
    icon: 'FaTimes'
  }
];

interface FeaturesComparisonWidgetProps {
  className?: string;
}

export default function FeaturesComparisonWidget({ className = '' }: FeaturesComparisonWidgetProps) {
  // Split features into two columns
  const midpoint = Math.ceil(featuresWeHave.length / 2);
  const leftColumn = featuresWeHave.slice(0, midpoint);
  const rightColumn = featuresWeHave.slice(midpoint);

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Features We Have - Full Width with Two Columns */}
      <div className="bg-white/20 backdrop-blur-lg rounded-2xl shadow-lg p-8 border border-white/30">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-white mb-2">Features we <em>do</em> have</h3>
          <p className="text-white/90">
            Human-first tools that make it easier for you and your customers to connect.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-x-8 gap-y-1">
          {/* Left Column */}
          <ul className="space-y-1">
            {leftColumn.map((feature, index) => (
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

          {/* Right Column */}
          <ul className="space-y-1">
            {rightColumn.map((feature, index) => (
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
      </div>

      {/* Features We Don't Have - Full Width Below */}
      <div className="bg-white/20 backdrop-blur-lg rounded-2xl shadow-lg p-8 border border-white/30">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-white mb-2">What we <em>don&apos;t</em> do</h3>
          <p className="text-white/90">
            We believe AI should support relationships, not replace them.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          {featuresWeDontHave.map((feature, index) => (
            <div
              key={index}
              className="group flex items-center gap-4 p-3 rounded-lg transition-all duration-300 hover:bg-white/20 hover:scale-[1.02]"
            >
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <Icon
                  name="FaTimes"
                  size={32}
                  color="#ffb3b3"
                />
              </div>
              <span className="text-white leading-relaxed">{feature.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
