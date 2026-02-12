'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { SurveyForm } from './components/SurveyForm';
import { ThankYouScreen } from './components/ThankYouScreen';
import { applyCardTransparency } from '@/utils/colorUtils';
import { createClient, getUserOrMock } from '@/auth/providers/supabase';

interface StyleConfig {
  primaryFont: string;
  primaryColor: string;
  secondaryColor: string;
  gradientStart: string;
  gradientMiddle: string;
  gradientEnd: string;
  cardBg: string;
  cardText: string;
  cardTransparency: number;
  cardBorderWidth: number;
  cardBorderColor: string;
  cardBorderTransparency: number;
  cardPlaceholderColor: string;
  cardInnerShadow: boolean;
  inputTextColor: string;
  logoUrl: string | null;
  businessName: string | null;
}

interface SurveyPageClientProps {
  survey: any;
  questions: any[];
  styleConfig: StyleConfig;
}

function getCardBorderStyle(config: StyleConfig) {
  const width = config.cardBorderWidth ?? 1;
  if (width <= 0) return 'none';
  const hex = (config.cardBorderColor || '#FFFFFF').replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return `${width}px solid rgba(${r}, ${g}, ${b}, ${config.cardBorderTransparency ?? 0.5})`;
}

export default function SurveyPageClient({ survey, questions, styleConfig }: SurveyPageClientProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);

  // Check if user is logged in (for back button)
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      try {
        const { data: { user } } = await getUserOrMock(supabase);
        setCurrentUser(user);
      } catch {
        setCurrentUser(null);
      } finally {
        setUserLoading(false);
      }
    })();
  }, []);

  const cardBg = applyCardTransparency(styleConfig.cardBg, styleConfig.cardTransparency);
  const cardBorder = getCardBorderStyle(styleConfig);
  const blurEnabled = styleConfig.cardTransparency < 1;

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
            backgroundColor: cardBg,
            color: styleConfig.cardText,
            border: cardBorder,
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
      className="min-h-screen px-4"
      style={{
        background: `linear-gradient(to bottom, ${styleConfig.gradientStart}, ${styleConfig.gradientMiddle}, ${styleConfig.gradientEnd})`,
        fontFamily: styleConfig.primaryFont,
      }}
    >
      {/* Back button — only visible to authenticated users */}
      {!userLoading && currentUser && (
        <div className="fixed left-4 z-[60] top-4">
          <div className="bg-black bg-opacity-20 backdrop-blur-sm rounded-xl p-3">
            <button
              onClick={() => window.location.href = '/dashboard/surveys'}
              className="flex items-center gap-2 px-4 py-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors group w-full"
              style={{
                background: '#FFFFFF',
                color: '#2E4A7D',
                border: '1px solid #E5E7EB',
              }}
              title="Back to surveys"
              aria-label="Back to surveys"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">Back</span>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-[1000px] w-full mx-auto">
        {/* Business info card — matches prompt page BusinessInfoCard */}
        <div
          className={`rounded-2xl shadow-lg px-6 pt-6 pb-8 flex flex-col items-center max-w-xl mx-auto relative mt-32 ${blurEnabled ? 'backdrop-blur-sm' : ''}`}
          style={{
            background: cardBg,
            color: styleConfig.cardText,
            border: cardBorder,
            backdropFilter: blurEnabled ? 'blur(8px)' : undefined,
          }}
        >
          {/* Logo circle — overlapping top of card */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-52 h-52 aspect-square flex items-center justify-center"
            style={{ pointerEvents: 'none', top: '-100px' }}
          >
            <div
              className={`rounded-full shadow-lg flex items-center justify-center w-full h-full aspect-square ${blurEnabled ? 'backdrop-blur-2xl' : ''}`}
              style={{
                backgroundColor: cardBg,
                backdropFilter: blurEnabled ? 'blur(24px)' : undefined,
                WebkitBackdropFilter: blurEnabled ? 'blur(24px)' : undefined,
                border: cardBorder,
                padding: '1px',
                zIndex: 30,
              }}
            >
              {styleConfig.logoUrl ? (
                <Image
                  src={styleConfig.logoUrl}
                  alt={styleConfig.businessName ? `${styleConfig.businessName} logo` : 'Logo'}
                  width={192}
                  height={192}
                  priority
                  quality={85}
                  className="h-48 w-48 aspect-square object-contain rounded-full"
                  style={{ objectFit: 'contain' }}
                  sizes="(max-width: 768px) 160px, 192px"
                />
              ) : (
                <div className="h-48 w-48 aspect-square bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-5xl text-gray-500">
                    {styleConfig.businessName?.[0] || 'S'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Business name & survey info */}
          <div className="mt-24 text-center">
            <h1
              className="text-3xl font-bold mb-1"
              style={{ color: styleConfig.primaryColor }}
            >
              {styleConfig.businessName || survey.title}
            </h1>
            {styleConfig.businessName && (
              <p className="text-base font-medium opacity-80" style={{ color: styleConfig.cardText }}>
                {survey.title}
              </p>
            )}
            {survey.description && (
              <p className="mt-1 text-sm opacity-70" style={{ color: styleConfig.cardText }}>
                {survey.description}
              </p>
            )}
          </div>
        </div>

        {/* Form card — full container width, matching prompt page form */}
        <div
          className={`rounded-2xl p-6 sm:p-8 shadow-xl mt-6 mb-8 ${blurEnabled ? 'backdrop-blur-sm' : ''}`}
          style={{
            backgroundColor: cardBg,
            border: cardBorder,
            backdropFilter: blurEnabled ? 'blur(8px)' : undefined,
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
