'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { applyCardTransparency, getContrastTextColor, contrastRatio } from '@/utils/colorUtils';
import { Proposal, ProposalCustomSection, ProposalLineItem, PricingType, PRICING_TYPE_LABELS } from '@/features/proposals/types';
import StarRating from '@/app/(app)/dashboard/widget/components/shared/StarRating';
import { formatSowNumber } from '@/features/proposals/sowHelpers';

interface NavItem {
  id: string;
  label: string;
}

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
  /** Sender's saved signature to display as "Authorized by" */
  senderSignature?: { name: string; imageUrl: string } | null;
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
  senderSignature,
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

  // Off-card reviews: use cardText (respects user's style settings) with a
  // contrast-check fallback. Cards are semi-transparent so cardText is already
  // chosen to work against backgrounds that show through.
  const effectiveBgHex = styleConfig.backgroundType === 'solid'
    ? styleConfig.backgroundColor
    : styleConfig.gradientMiddle;
  const offCardTextColor = contrastRatio(color, effectiveBgHex) >= 3
    ? color
    : getContrastTextColor(effectiveBgHex);
  const offCardMutedColor = `${offCardTextColor}B3`;

  // Opaque card background for nav dots (no transparency)
  const cardBgOpaque = styleConfig.cardBg;

  const sections: ProposalCustomSection[] = Array.isArray(proposal.custom_sections)
    ? [...proposal.custom_sections].sort((a, b) => a.position - b.position)
    : [];

  const lineItems: ProposalLineItem[] = Array.isArray(proposal.line_items)
    ? proposal.line_items
    : [];

  const defaultPt: PricingType = proposal.pricing_type || 'fixed';
  const getItemType = (item: ProposalLineItem): PricingType => item.pricing_type || defaultPt;

  // Check if all items share the same type
  const allSameType = lineItems.length > 0 && lineItems.every((item) => getItemType(item) === getItemType(lineItems[0]));
  const uniformType = allSameType ? getItemType(lineItems[0]) : null;

  // Compute totals by category
  const oneTimeTotal = lineItems
    .filter((item) => getItemType(item) !== 'monthly')
    .reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const monthlyTotal = lineItems
    .filter((item) => getItemType(item) === 'monthly')
    .reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const grandTotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const hasMixedTypes = oneTimeTotal > 0 && monthlyTotal > 0;
  const showTypeColumn = !allSameType;

  const qtyHeader = uniformType === 'hourly' ? 'Hours' : 'Qty';
  const rateHeader = uniformType === 'hourly' ? 'Rate' : uniformType === 'monthly' ? 'Monthly rate' : 'Unit price';

  const addressDisplay = [styleConfig.addressCity, styleConfig.addressState]
    .filter(Boolean)
    .join(', ');

  // Check if children actually render content (filters out false/null from conditional JSX)
  const hasChildren = React.Children.toArray(children).length > 0;

  // --- Subway nav ---
  const navItems = useMemo<NavItem[]>(() => {
    if (contained) return [];
    const items: NavItem[] = [];
    items.push({ id: 'proposal-overview', label: 'Overview' });
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      items.push({ id: `proposal-section-${s.id}`, label: s.title || `Section ${i + 1}` });
    }
    if (proposal.show_pricing && lineItems.length > 0) {
      items.push({ id: 'proposal-pricing', label: 'Pricing' });
    }
    if (proposal.show_terms && proposal.terms_content) {
      items.push({ id: 'proposal-terms', label: 'Terms' });
    }
    if (senderSignature) {
      items.push({ id: 'proposal-sender-signature', label: 'Authorized by' });
    }
    if (hasChildren) {
      items.push({ id: 'proposal-signature', label: 'Signature' });
    }
    return items;
  }, [contained, sections, proposal.show_pricing, proposal.show_terms, proposal.terms_content, lineItems.length, senderSignature, hasChildren]);

  const showNav = navItems.length >= 2;

  const [activeId, setActiveId] = useState<string>(navItems[0]?.id ?? '');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!showNav) return;
    const ids = navItems.map((n) => n.id);

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 },
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observerRef.current!.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [showNav, navItems]);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div
      className={`${contained ? '' : 'min-h-screen'} px-4 branded-proposal-bg`}
      style={{
        background: getBackground(styleConfig),
        fontFamily: styleConfig.primaryFont,
      }}
    >
      {/* Desktop subway nav — left side dots */}
      {showNav && (
        <nav
          className="hidden lg:flex fixed left-6 top-1/2 -translate-y-1/2 z-50 flex-col items-center gap-0"
          aria-label="Contract sections"
        >
          {navItems.map((item, idx) => {
            const isActive = activeId === item.id;
            return (
              <div key={item.id} className="flex items-center relative group">
                {/* Connector line above (skip for first) */}
                {idx > 0 && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 w-px"
                    style={{
                      top: '-12px',
                      height: '12px',
                      backgroundColor: `${cardBgOpaque}40`,
                    }}
                  />
                )}
                {/* Dot */}
                <button
                  onClick={() => scrollTo(item.id)}
                  className="relative z-10 rounded-full transition-all duration-200 my-3"
                  style={{
                    width: isActive ? '12px' : '8px',
                    height: isActive ? '12px' : '8px',
                    backgroundColor: isActive ? styleConfig.primaryColor : `${cardBgOpaque}80`,
                    boxShadow: isActive ? `0 0 8px ${styleConfig.primaryColor}66` : 'none',
                  }}
                  aria-label={`Go to ${item.label}`}
                  aria-current={isActive ? 'true' : undefined}
                />
                {/* Hover label */}
                <span
                  className="absolute left-full ml-3 whitespace-nowrap text-sm font-medium rounded-md px-2 py-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pointer-events-none"
                  style={{
                    color,
                    backgroundColor: `${cardBg}`,
                    border: cardBorder,
                  }}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </nav>
      )}

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

        {/* Mobile subway nav — horizontal sticky pills */}
        {showNav && (
          <nav
            className="lg:hidden sticky top-0 z-40 -mx-4 px-4 py-3 mt-6 overflow-x-auto scrollbar-hide backdrop-blur-md"
            style={{ background: 'transparent' }}
            aria-label="Contract sections"
          >
            <div className="flex gap-2 w-max">
              {navItems.map((item) => {
                const isActive = activeId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollTo(item.id)}
                    className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200"
                    style={{
                      backgroundColor: isActive ? styleConfig.primaryColor : `${cardBg}`,
                      color: isActive ? '#ffffff' : color,
                      border: isActive ? 'none' : cardBorder,
                    }}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        {/* Title, dates, and client info card */}
        <div id="proposal-overview" className={`${cardClasses} mt-8 scroll-mt-16`} style={cardStyle}>
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

          {/* From / Prepared for — two-column on desktop, stacked on mobile */}
          {((proposal.business_name || proposal.business_email || proposal.business_phone || proposal.business_address) ||
            (proposal.client_first_name || proposal.client_last_name || proposal.client_email || proposal.client_company)) && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(proposal.business_name || proposal.business_email || proposal.business_phone || proposal.business_address) && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: mutedColor }}>
                    From
                  </h3>
                  <div className="text-sm space-y-0.5" style={{ color }}>
                    {proposal.business_name && <p className="font-medium">{proposal.business_name}</p>}
                    {proposal.business_email && <p>{proposal.business_email}</p>}
                    {proposal.business_phone && <p>{proposal.business_phone}</p>}
                    {proposal.business_address && <p>{proposal.business_address}</p>}
                  </div>
                </div>
              )}
              {(proposal.client_first_name || proposal.client_last_name || proposal.client_email || proposal.client_company) && (
                <div>
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
          )}
        </div>

        {/* Each custom section in its own card (or off-card for reviews) */}
        {sections.map((section) => {
          const isOffCardReviews = section.type === 'reviews' && section.reviews_on_card === false;
          const sectionColor = isOffCardReviews ? offCardTextColor : color;
          const sectionMuted = isOffCardReviews ? offCardMutedColor : mutedColor;

          return (
            <div
              key={section.id}
              id={`proposal-section-${section.id}`}
              className={isOffCardReviews ? 'mt-6 scroll-mt-16 px-6 sm:px-8 py-6' : `${cardClasses} mt-6 scroll-mt-16`}
              style={isOffCardReviews ? undefined : cardStyle}
            >
              {section.title && (
                <h3 className="text-lg font-semibold" style={{ color: sectionColor }}>{section.title}</h3>
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
                          style={{ color: `${sectionColor}20` }}
                          aria-hidden="true"
                        >
                          &ldquo;
                        </span>
                        <div className="pl-6 pr-6">
                          <StarRating rating={review.star_rating} size={16} />
                          <p
                            className="text-base leading-relaxed mt-2"
                            style={{ color: sectionColor }}
                          >
                            {review.review_content}
                          </p>
                          <div className="flex items-center gap-2 mt-3">
                            <span className="text-sm font-semibold" style={{ color: sectionColor }}>
                              &mdash; {review.reviewer_name}
                            </span>
                            {review.platform && (
                              <span className="text-xs" style={{ color: sectionMuted }}>
                                via {review.platform}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Decorative close quote */}
                        <span
                          className="absolute -bottom-3 -right-1 text-5xl font-serif leading-none select-none pointer-events-none"
                          style={{ color: `${sectionColor}20` }}
                          aria-hidden="true"
                        >
                          &rdquo;
                        </span>
                        {/* Separator between reviews (not after last) */}
                        {section.reviews!.indexOf(review) < section.reviews!.length - 1 && (
                          <div className="mt-5" style={{ borderBottom: `1px solid ${sectionColor}15` }} />
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {section.subtitle && (
                    <p className="text-sm mt-0.5 mb-2" style={{ color: sectionMuted }}>{section.subtitle}</p>
                  )}
                  {!section.subtitle && section.title && <div className="mb-2" />}
                  {section.body && (
                    <div className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: sectionColor }}>
                      {section.body}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        {/* Pricing card */}
        {proposal.show_pricing && lineItems.length > 0 && (
          <div id="proposal-pricing" className={`${cardClasses} mt-6 scroll-mt-16`} style={cardStyle}>
            <h3 className="text-lg font-semibold mb-3" style={{ color }}>Pricing</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${mutedColor}33` }}>
                    <th className="text-left py-2 pr-4 font-medium" style={{ color: mutedColor }}>Description</th>
                    {showTypeColumn && (
                      <th className="text-left py-2 px-4 font-medium w-24" style={{ color: mutedColor }}>Type</th>
                    )}
                    <th className="text-right py-2 px-4 font-medium w-20" style={{ color: mutedColor }}>
                      {showTypeColumn ? 'Qty/Hrs' : qtyHeader}
                    </th>
                    <th className="text-right py-2 px-4 font-medium w-28" style={{ color: mutedColor }}>
                      {showTypeColumn ? 'Rate' : rateHeader}
                    </th>
                    <th className="text-right py-2 pl-4 font-medium w-28" style={{ color: mutedColor }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item) => {
                    const itemType = getItemType(item);
                    return (
                      <tr key={item.id} style={{ borderBottom: `1px solid ${mutedColor}1A` }}>
                        <td className="py-2 pr-4" style={{ color }}>{item.description}</td>
                        {showTypeColumn && (
                          <td className="py-2 px-4 text-xs" style={{ color: mutedColor }}>
                            {PRICING_TYPE_LABELS[itemType]}
                          </td>
                        )}
                        <td className="text-right py-2 px-4" style={{ color }}>{item.quantity}</td>
                        <td className="text-right py-2 px-4" style={{ color }}>${item.unit_price.toFixed(2)}</td>
                        <td className="text-right py-2 pl-4 font-medium" style={{ color }}>
                          ${(item.quantity * item.unit_price).toFixed(2)}
                          {itemType === 'monthly' && <span className="text-xs opacity-70">/mo</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  {hasMixedTypes ? (
                    <>
                      <tr style={{ borderTop: `2px solid ${mutedColor}33` }}>
                        <td colSpan={showTypeColumn ? 4 : 3} className="text-right py-2 pr-4 font-semibold text-sm" style={{ color }}>
                          One-time total
                        </td>
                        <td className="text-right py-2 pl-4 font-bold" style={{ color }}>
                          ${oneTimeTotal.toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={showTypeColumn ? 4 : 3} className="text-right py-2 pr-4 font-semibold text-sm" style={{ color }}>
                          Monthly total
                        </td>
                        <td className="text-right py-2 pl-4 font-bold" style={{ color }}>
                          ${monthlyTotal.toFixed(2)}/mo
                        </td>
                      </tr>
                      <tr style={{ borderTop: `1px solid ${mutedColor}33` }}>
                        <td colSpan={showTypeColumn ? 4 : 3} className="text-right py-3 pr-4 font-semibold" style={{ color }}>
                          Grand total
                        </td>
                        <td className="text-right py-3 pl-4 font-bold text-lg" style={{ color }}>
                          ${oneTimeTotal.toFixed(2)} + ${monthlyTotal.toFixed(2)}/mo
                        </td>
                      </tr>
                    </>
                  ) : (
                    <tr style={{ borderTop: `2px solid ${mutedColor}33` }}>
                      <td colSpan={showTypeColumn ? 4 : 3} className="text-right py-3 pr-4 font-semibold" style={{ color }}>
                        Grand total{uniformType === 'monthly' ? ' per month' : ''}
                      </td>
                      <td className="text-right py-3 pl-4 font-bold text-lg" style={{ color }}>
                        ${grandTotal.toFixed(2)}{uniformType === 'monthly' ? '/mo' : ''}
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Terms card */}
        {proposal.show_terms && proposal.terms_content && (
          <div id="proposal-terms" className={`${cardClasses} mt-6 scroll-mt-16`} style={cardStyle}>
            <h3 className="text-lg font-semibold mb-2" style={{ color }}>Terms & conditions</h3>
            <div className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: mutedColor }}>
              {proposal.terms_content}
            </div>
          </div>
        )}

        {/* Sender signature card (Authorized by) */}
        {senderSignature && (
          <div id="proposal-sender-signature" className={`${cardClasses} mt-6 scroll-mt-16`} style={cardStyle}>
            <h3 className="text-lg font-semibold mb-3" style={{ color }}>Authorized by</h3>
            <img
              src={senderSignature.imageUrl}
              alt={`Signature by ${senderSignature.name}`}
              className="max-h-16 rounded"
            />
            <p className="text-sm font-medium mt-2" style={{ color }}>{senderSignature.name}</p>
          </div>
        )}

        {/* Children (signature section etc.) rendered as a separate card */}
        {hasChildren && (
          <div id="proposal-signature" className={`${cardClasses} mt-6 mb-8 scroll-mt-16`} style={cardStyle}>
            {children}
          </div>
        )}

        {/* Footer */}
        <div className={`text-center ${hasChildren ? '' : 'mt-6'} pb-8`}>
          <p className="text-sm opacity-50" style={{ color }}>
            Powered by <a href="https://promptreviews.app" className="underline hover:opacity-80" target="_blank" rel="noopener noreferrer">Prompt Reviews</a>
          </p>
        </div>
      </div>
    </div>
  );
}
