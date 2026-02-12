'use client';

import { useState } from 'react';
import { SurveyForm } from './components/SurveyForm';
import { ThankYouScreen } from './components/ThankYouScreen';
import { applyCardTransparency } from '@/utils/colorUtils';

interface StyleConfig {
  primaryFont: string;
  gradientStart: string;
  gradientMiddle: string;
  gradientEnd: string;
  cardBg: string;
  cardText: string;
  cardTransparency: number;
  inputTextColor: string;
  logoUrl: string | null;
  businessName: string | null;
}

interface SurveyPageClientProps {
  survey: any;
  questions: any[];
  styleConfig: StyleConfig;
}

export default function SurveyPageClient({ survey, questions, styleConfig }: SurveyPageClientProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Check if survey is accepting responses
  if (survey.status !== 'active') {
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
          <h1 className="text-xl font-bold mb-2">Survey closed</h1>
          <p className="opacity-80">This survey is no longer accepting responses.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <ThankYouScreen
        message={survey.thank_you_message || 'Thank you for your response!'}
        styleConfig={styleConfig}
      />
    );
  }

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{
        background: `linear-gradient(to bottom, ${styleConfig.gradientStart}, ${styleConfig.gradientMiddle}, ${styleConfig.gradientEnd})`,
        fontFamily: styleConfig.primaryFont,
      }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          {styleConfig.logoUrl && (
            <img
              src={styleConfig.logoUrl}
              alt={styleConfig.businessName ? `${styleConfig.businessName} logo` : 'Logo'}
              className="w-16 h-16 rounded-full object-cover mx-auto mb-4 border-2 border-white/30 shadow-lg"
            />
          )}
          <h1
            className="text-2xl font-bold"
            style={{ color: styleConfig.cardText }}
          >
            {survey.title}
          </h1>
          {survey.description && (
            <p className="mt-2 opacity-80" style={{ color: styleConfig.cardText }}>
              {survey.description}
            </p>
          )}
        </div>

        {/* Form card */}
        <div
          className="rounded-2xl p-6 sm:p-8 shadow-xl"
          style={{
            backgroundColor: applyCardTransparency(styleConfig.cardBg, styleConfig.cardTransparency),
          }}
        >
          {submitError && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-sm" style={{ color: styleConfig.cardText }}>
              {submitError}
            </div>
          )}
          <SurveyForm
            survey={survey}
            questions={questions}
            styleConfig={styleConfig}
            onSubmitted={() => setSubmitted(true)}
            onError={setSubmitError}
          />
        </div>
      </div>
    </div>
  );
}
