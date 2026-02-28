'use client';

import Image from 'next/image';
import { applyCardTransparency } from '@/utils/colorUtils';
import { Proposal, ProposalCustomSection, ProposalLineItem } from '@/features/proposals/types';
import StarRating from '@/app/(app)/dashboard/widget/components/shared/StarRating';
import { formatSowNumber } from '@/features/proposals/sowHelpers';

export interface StyleConfig {
  primaryFont: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundType: string;
  backgroundColor: string;
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
  addressCity?: string | null;
  addressState?: string | null;
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

function getBackground(config: StyleConfig): string {
  if (config.backgroundType === 'solid') {
    return config.backgroundColor;
  }
  return `linear-gradient(to bottom, ${config.gradientStart}, ${config.gradientMiddle}, ${config.gradientEnd})`;
}

interface BrandedProposalViewProps {
  proposal: Proposal;
  styleConfig: StyleConfig;
  sowPrefix?: string | null;
  /** Content rendered after the last proposal card (e.g. signature section in its own card) */
  children?: React.ReactNode;
  /** If true, renders as a contained block (no min-h-screen). Used for dashboard embedding. */
  contained?: boolean;
}

/**
 * Branded proposal rendering with background, logo circle,
 * business info card, and each proposal section in its own card.
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
  const color = styleConfig.cardText;
  const mutedColor = `${color}B3`;

  const innerShadow = styleConfig.cardInnerShadow
    ? 'inset 0 2px 4px 0 rgba(0,0,0,0.2), inset 0 1px 2px 0 rgba(0,0,0,0.15)'
    : 'none';

  const cardClasses = `rounded-2xl p-6 sm:p-8 shadow-xl ${blurEnabled ? 'backdrop-blur-sm' : ''}`;
  const cardStyle: React.CSSProperties = {
    backgroundColor: cardBg,
    border: cardBorder,
    backdropFilter: blurEnabled ? 'blur(8px)' : undefined,
    boxShadow: styleConfig.cardInnerShadow
      ? `0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1), ${innerShadow}`
      : undefined,
  };

  const sections: ProposalCustomSection[] = Array.isArray(proposal.custom_sections)
    ? [...proposal.custom_sections].sort((a, b) => a.position - b.position)
    : [];

  const lineItems: ProposalLineItem[] = Array.isArray(proposal.line_items)
    ? proposal.line_items
    : [];

  const grandTotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  const addressDisplay = [styleConfig.addressCity, styleConfig.addressState]
    .filter(Boolean)
    .join(', ');

  return (
    <div
      className={`${contained ? '' : 'min-h-screen'} px-4`}
      style={{
        background: getBackground(styleConfig),
        fontFamily: styleConfig.primaryFont,
      }}
    >
      <div className="max-w-[900px] w-full mx-auto" id="proposal-preview-content">
        {/* Business info card */}
        <div
          className={`rounded-2xl shadow-lg px-6 pt-6 pb-8 flex flex-col items-center max-w-xl mx-auto relative mt-32 ${blurEnabled ? 'backdrop-blur-sm' : ''}`}
          style={{
            background: cardBg,
            color,
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

          {/* Business name and address */}
          <div className="mt-24 text-center">
            <h1
              className="text-3xl font-bold mb-1"
              style={{ color: styleConfig.primaryColor }}
            >
              {styleConfig.businessName || 'Proposal'}
            </h1>
            {addressDisplay && (
              <p className="text-base font-medium" style={{ color }}>
                {addressDisplay}
              </p>
            )}
            {proposal.business_email && (
              <p className="text-sm opacity-70" style={{ color }}>
                {proposal.business_email}
              </p>
            )}
            {proposal.business_phone && (
              <p className="text-sm opacity-70" style={{ color }}>
                {proposal.business_phone}
              </p>
            )}
          </div>
        </div>

        {/* Title, dates, and client info card */}
        <div className={`${cardClasses} mt-8`} style={cardStyle}>
          <h2 className="text-2xl font-bold" style={{ color }}>{proposal.title}</h2>
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm" style={{ color: mutedColor }}>
            {proposal.show_sow_number && proposal.sow_number != null && sowPrefix && (
              <span className="font-medium">SOW #{formatSowNumber(sowPrefix, proposal.sow_number)}</span>
            )}
            <span>Date: {new Date(proposal.proposal_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            {proposal.expiration_date && (
              <span>Expires: {new Date(proposal.expiration_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            )}
          </div>

          {(proposal.client_first_name || proposal.client_last_name || proposal.client_email || proposal.client_company) && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: mutedColor }}>
                Prepared for
              </h3>
              <div className="text-sm space-y-0.5" style={{ color }}>
                {(proposal.client_first_name || proposal.client_last_name) && (
                  <p className="font-medium">{[proposal.client_first_name, proposal.client_last_name].filter(Boolean).join(' ')}</p>
                )}
                {proposal.client_company && <p>{proposal.client_company}</p>}
                {proposal.client_email && <p>{proposal.client_email}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Each custom section in its own card */}
        {sections.map((section) => (
          <div key={section.id} className={`${cardClasses} mt-6`} style={cardStyle}>
            {section.title && (
              <h3 className="text-lg font-semibold" style={{ color }}>{section.title}</h3>
            )}
            {section.type === 'reviews' && section.reviews && section.reviews.length > 0 ? (
              <>
                {section.title && <div className="mb-4" />}
                <div className="space-y-6">
                  {section.reviews.map((review) => (
                    <div key={review.id} className="relative px-2">
                      {/* Decorative open quote */}
                      <span
                        className="absolute -top-2 -left-1 text-5xl font-serif leading-none select-none pointer-events-none"
                        style={{ color: `${color}20` }}
                        aria-hidden="true"
                      >
                        &ldquo;
                      </span>
                      <div className="pl-6 pr-6">
                        <StarRating rating={review.star_rating} size={16} />
                        <p
                          className="text-base leading-relaxed mt-2"
                          style={{ color }}
                        >
                          {review.review_content}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-sm font-semibold" style={{ color }}>
                            &mdash; {review.reviewer_name}
                          </span>
                          {review.platform && (
                            <span className="text-xs" style={{ color: mutedColor }}>
                              via {review.platform}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Decorative close quote */}
                      <span
                        className="absolute -bottom-3 -right-1 text-5xl font-serif leading-none select-none pointer-events-none"
                        style={{ color: `${color}20` }}
                        aria-hidden="true"
                      >
                        &rdquo;
                      </span>
                      {/* Separator between reviews (not after last) */}
                      {section.reviews!.indexOf(review) < section.reviews!.length - 1 && (
                        <div className="mt-5" style={{ borderBottom: `1px solid ${color}15` }} />
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                {section.subtitle && (
                  <p className="text-sm mt-0.5 mb-2" style={{ color: mutedColor }}>{section.subtitle}</p>
                )}
                {!section.subtitle && section.title && <div className="mb-2" />}
                {section.body && (
                  <div className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color }}>
                    {section.body}
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {/* Pricing card */}
        {proposal.show_pricing && lineItems.length > 0 && (
          <div className={`${cardClasses} mt-6`} style={cardStyle}>
            <h3 className="text-lg font-semibold mb-3" style={{ color }}>Pricing</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${mutedColor}33` }}>
                    <th className="text-left py-2 pr-4 font-medium" style={{ color: mutedColor }}>Description</th>
                    <th className="text-right py-2 px-4 font-medium w-20" style={{ color: mutedColor }}>Qty</th>
                    <th className="text-right py-2 px-4 font-medium w-28" style={{ color: mutedColor }}>Unit price</th>
                    <th className="text-right py-2 pl-4 font-medium w-28" style={{ color: mutedColor }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item) => (
                    <tr key={item.id} style={{ borderBottom: `1px solid ${mutedColor}1A` }}>
                      <td className="py-2 pr-4" style={{ color }}>{item.description}</td>
                      <td className="text-right py-2 px-4" style={{ color }}>{item.quantity}</td>
                      <td className="text-right py-2 px-4" style={{ color }}>${item.unit_price.toFixed(2)}</td>
                      <td className="text-right py-2 pl-4 font-medium" style={{ color }}>
                        ${(item.quantity * item.unit_price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: `2px solid ${mutedColor}33` }}>
                    <td colSpan={3} className="text-right py-3 pr-4 font-semibold" style={{ color }}>
                      Grand total
                    </td>
                    <td className="text-right py-3 pl-4 font-bold text-lg" style={{ color }}>
                      ${grandTotal.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Terms card */}
        {proposal.show_terms && proposal.terms_content && (
          <div className={`${cardClasses} mt-6`} style={cardStyle}>
            <h3 className="text-lg font-semibold mb-2" style={{ color }}>Terms & conditions</h3>
            <div className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: mutedColor }}>
              {proposal.terms_content}
            </div>
          </div>
        )}

        {/* Children (signature section etc.) rendered as a separate card */}
        {children && (
          <div className={`${cardClasses} mt-6 mb-8`} style={cardStyle}>
            {children}
          </div>
        )}

        {/* Footer */}
        <div className={`text-center ${children ? '' : 'mt-6'} pb-8`}>
          <p className="text-sm opacity-50" style={{ color }}>
            Powered by <a href="https://promptreviews.app" className="underline hover:opacity-80" target="_blank" rel="noopener noreferrer">Prompt Reviews</a>
          </p>
        </div>
      </div>
    </div>
  );
}
