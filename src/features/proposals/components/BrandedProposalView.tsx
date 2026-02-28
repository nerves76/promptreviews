'use client';

import Image from 'next/image';
import { applyCardTransparency } from '@/utils/colorUtils';
import { ProposalPreview } from '@/features/proposals/components/ProposalPreview';
import { Proposal } from '@/features/proposals/types';

export interface StyleConfig {
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

function getCardBorderStyle(config: StyleConfig) {
  const width = config.cardBorderWidth ?? 1;
  if (width <= 0) return 'none';
  const hex = (config.cardBorderColor || '#FFFFFF').replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return `${width}px solid rgba(${r}, ${g}, ${b}, ${config.cardBorderTransparency ?? 0.5})`;
}

interface BrandedProposalViewProps {
  proposal: Proposal;
  styleConfig: StyleConfig;
  sowPrefix?: string | null;
  /** Content rendered inside the proposal content card, after ProposalPreview */
  children?: React.ReactNode;
  /** If true, renders as a contained block (no min-h-screen). Used for dashboard embedding. */
  contained?: boolean;
}

/**
 * Branded proposal rendering with gradient background, logo circle,
 * business info card, and proposal content card.
 *
 * Used by both the public SOW page and the dashboard preview page.
 */
export function BrandedProposalView({
  proposal,
  styleConfig,
  sowPrefix,
  children,
  contained = false,
}: BrandedProposalViewProps) {
  const cardBg = applyCardTransparency(styleConfig.cardBg, styleConfig.cardTransparency);
  const cardBorder = getCardBorderStyle(styleConfig);
  const blurEnabled = styleConfig.cardTransparency < 1;

  return (
    <div
      className={`${contained ? '' : 'min-h-screen'} px-4`}
      style={{
        background: `linear-gradient(to bottom, ${styleConfig.gradientStart}, ${styleConfig.gradientMiddle}, ${styleConfig.gradientEnd})`,
        fontFamily: styleConfig.primaryFont,
      }}
    >
      <div className="max-w-[900px] w-full mx-auto">
        {/* Business info card */}
        <div
          className={`rounded-2xl shadow-lg px-6 pt-6 pb-8 flex flex-col items-center max-w-xl mx-auto relative mt-32 ${blurEnabled ? 'backdrop-blur-sm' : ''}`}
          style={{
            background: cardBg,
            color: styleConfig.cardText,
            border: cardBorder,
            backdropFilter: blurEnabled ? 'blur(8px)' : undefined,
          }}
        >
          {/* Logo circle */}
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
                    {styleConfig.businessName?.[0] || 'P'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Business name */}
          <div className="mt-24 text-center">
            <h1
              className="text-3xl font-bold mb-1"
              style={{ color: styleConfig.primaryColor }}
            >
              {styleConfig.businessName || 'Proposal'}
            </h1>
            {proposal.business_email && (
              <p className="text-sm opacity-70" style={{ color: styleConfig.cardText }}>
                {proposal.business_email}
              </p>
            )}
            {proposal.business_phone && (
              <p className="text-sm opacity-70" style={{ color: styleConfig.cardText }}>
                {proposal.business_phone}
              </p>
            )}
          </div>
        </div>

        {/* Proposal content card */}
        <div
          className={`rounded-2xl p-6 sm:p-8 shadow-xl mt-6 mb-8 ${blurEnabled ? 'backdrop-blur-sm' : ''}`}
          style={{
            backgroundColor: cardBg,
            border: cardBorder,
            backdropFilter: blurEnabled ? 'blur(8px)' : undefined,
          }}
        >
          <ProposalPreview
            proposal={proposal}
            id="proposal-preview-content"
            textColor={styleConfig.cardText}
            sowPrefix={sowPrefix}
          />

          {children}
        </div>

        {/* Footer */}
        <div className="text-center pb-8">
          <p className="text-sm opacity-50" style={{ color: styleConfig.cardText }}>
            Powered by <a href="https://promptreviews.app" className="underline hover:opacity-80" target="_blank" rel="noopener noreferrer">Prompt Reviews</a>
          </p>
        </div>
      </div>
    </div>
  );
}
