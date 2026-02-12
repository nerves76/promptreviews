'use client';

import { applyCardTransparency } from '@/utils/colorUtils';

interface StyleConfig {
  gradientStart: string;
  gradientMiddle: string;
  gradientEnd: string;
  cardBg: string;
  cardText: string;
  cardTransparency: number;
  primaryFont: string;
  [key: string]: any;
}

interface ThankYouScreenProps {
  message: string;
  styleConfig: StyleConfig;
}

export function ThankYouScreen({ message, styleConfig }: ThankYouScreenProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: `linear-gradient(to bottom, ${styleConfig.gradientStart}, ${styleConfig.gradientMiddle}, ${styleConfig.gradientEnd})`,
        fontFamily: styleConfig.primaryFont,
      }}
    >
      <div
        className="max-w-md w-full rounded-2xl p-8 text-center shadow-xl"
        style={{
          backgroundColor: applyCardTransparency(styleConfig.cardBg, styleConfig.cardTransparency),
          color: styleConfig.cardText,
        }}
      >
        <div className="text-5xl mb-4">✓</div>
        <h1 className="text-2xl font-bold mb-3">Thank you!</h1>
        <p className="opacity-80">{message}</p>
      </div>
    </div>
  );
}
