import React, { useRef, useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
// Import any shared helpers from widget-embed/index.tsx as needed
// ...
// --- Shared types and helpers ---
// (import or define WidgetData, getDesignWithDefaults, renderStars, hexToRgba, lightenHex, getRelativeTime, etc.)

// Shared types and helpers for PhotoWidget

// WidgetType and WidgetData
type WidgetType = 'single' | 'multi' | 'photo';

interface WidgetData {
  id: string;
  name: string;
  widget_type: WidgetType;
  design: {
    bgColor: string;
    textColor: string;
    accentColor: string;
    bodyTextColor: string;
    nameTextColor: string;
    roleTextColor: string;
    quoteFontSize: number;
    attributionFontSize: number;
    borderRadius: number;
    shadow: boolean;
    bgOpacity: number;
    autoAdvance: boolean;
    slideshowSpeed: number;
    border: boolean;
    borderWidth: number;
    lineSpacing: number;
    showQuotes: boolean;
    showRelativeDate: boolean;
    showGrid: boolean;
    width: number;
    sectionBgType?: 'none' | 'custom';
    sectionBgColor?: string;
    shadowIntensity?: number;
    shadowColor?: string;
    borderColor: string;
    showSubmitReviewButton: boolean;
  };
  reviews: Array<{
    id: string;
    review_content: string;
    first_name: string;
    last_name: string;
    reviewer_role: string;
    platform: string;
    created_at: string;
    star_rating: number;
    photo_url?: string;
  }>;
  slug?: string;
  universalPromptSlug?: string;
}

// getDesignWithDefaults
const DEFAULT_DESIGN = {
  bgType: "solid",
  bgColor: "#ffffff",
  textColor: "#22223b",
  accentColor: "slateblue",
  bodyTextColor: "#22223b",
  nameTextColor: "#1a237e",
  roleTextColor: "#6b7280",
  quoteFontSize: 18,
  attributionFontSize: 15,
  borderRadius: 16,
  shadow: true,
  bgOpacity: 1,
  autoAdvance: false,
  slideshowSpeed: 4,
  border: true,
  borderWidth: 2,
  lineSpacing: 1.4,
  showQuotes: true,
  showRelativeDate: false,
  showGrid: false,
  width: 1000,
  sectionBgType: "none",
  sectionBgColor: "#ffffff",
  shadowIntensity: 0.2,
  shadowColor: "#222222",
  borderColor: "#cccccc",
  showSubmitReviewButton: true,
};

function getDesignWithDefaults(design: Partial<typeof DEFAULT_DESIGN> = {}) {
  return { ...DEFAULT_DESIGN, ...design };
}

// hexToRgba
function hexToRgba(hex: string, alpha: number) {
  let c = hex.replace('#', '');
  if (c.length === 3)
    c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

// lightenHex
function lightenHex(hex: string, amount: number = 0.7) {
  let c = hex.replace('#', '');
  if (c.length === 3)
    c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;
  r = Math.round(r + (255 - r) * amount);
  g = Math.round(g + (255 - g) * amount);
  b = Math.round(b + (255 - b) * amount);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// renderStars
function renderStars(rating: number, size: number = 16) {
  if (typeof rating !== 'number' || isNaN(rating)) return null;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const full = i <= Math.floor(rating);
    const half = !full && i - 0.5 <= rating;
    const gradientId = `half-star-gradient-${i}-${Math.random()}`;
    stars.push(
      <svg
        key={i}
        width={size}
        height={size}
        viewBox="0 0 20 20"
        fill={full ? '#FBBF24' : half ? `url(#${gradientId})` : '#E5E7EB'}
        stroke="#FBBF24"
        style={{ display: 'inline-block', marginRight: 2 }}
      >
        {half && (
          <defs>
            <linearGradient id={gradientId}>
              <stop offset="50%" stopColor="#FBBF24" />
              <stop offset="50%" stopColor="#E5E7EB" />
            </linearGradient>
          </defs>
        )}
        <polygon points="10,1 12.59,7.36 19.51,7.64 14,12.14 15.82,18.99 10,15.27 4.18,18.99 6,12.14 0.49,7.64 7.41,7.36" />
      </svg>
    );
  }
  return <span style={{ display: 'inline-flex', alignItems: 'center', marginBottom: 4 }}>{stars}</span>;
}

// getRelativeTime
function getRelativeTime(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  if (years > 0) return `${years} year${years > 1 ? "s" : ""} ago`;
  if (months > 0) return `${months} month${months > 1 ? "s" : ""} ago`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "just now";
}

// Placeholder for styles (define or import as needed)
const styles = "";

// --- PhotoWidget component ---
const PhotoWidget: React.FC<{ data: WidgetData }> = ({ data }) => {
  const design = getDesignWithDefaults(data.design);
  const { reviews } = data;
  const prevRefDesktop = React.useRef(null);
  const nextRefDesktop = React.useRef(null);
  const paginationRefDesktop = React.useRef(null);
  const [swiperInstanceDesktop, setSwiperInstanceDesktop] = React.useState<any>(null);
  const [submitHover, setSubmitHover] = useState(false);
  const [paginationReady, setPaginationReady] = React.useState(false);

  // Mobile refs and state
  const prevRefMobile = React.useRef(null);
  const nextRefMobile = React.useRef(null);
  const paginationRefMobile = React.useRef(null);
  const [swiperInstanceMobile, setSwiperInstanceMobile] = React.useState<any>(null);

  React.useEffect(() => {
    setPaginationReady(true);
  }, []);

  // Navigation and pagination for desktop
  React.useEffect(() => {
    if (
      swiperInstanceDesktop &&
      swiperInstanceDesktop.params &&
      swiperInstanceDesktop.params.navigation &&
      prevRefDesktop.current &&
      nextRefDesktop.current
    ) {
      swiperInstanceDesktop.params.navigation.prevEl = prevRefDesktop.current;
      swiperInstanceDesktop.params.navigation.nextEl = nextRefDesktop.current;
      swiperInstanceDesktop.navigation.init();
      swiperInstanceDesktop.navigation.update();
    }
    if (
      swiperInstanceDesktop &&
      swiperInstanceDesktop.params &&
      swiperInstanceDesktop.params.pagination &&
      paginationRefDesktop.current
    ) {
      swiperInstanceDesktop.params.pagination.el = paginationRefDesktop.current;
      swiperInstanceDesktop.pagination.init();
      swiperInstanceDesktop.pagination.render();
      swiperInstanceDesktop.pagination.update();
    }
  }, [swiperInstanceDesktop, prevRefDesktop, nextRefDesktop, paginationRefDesktop]);

  // Navigation and pagination for mobile
  React.useEffect(() => {
    if (
      swiperInstanceMobile &&
      swiperInstanceMobile.params &&
      swiperInstanceMobile.params.navigation &&
      prevRefMobile.current &&
      nextRefMobile.current
    ) {
      swiperInstanceMobile.params.navigation.prevEl = prevRefMobile.current;
      swiperInstanceMobile.params.navigation.nextEl = nextRefMobile.current;
      swiperInstanceMobile.navigation.init();
      swiperInstanceMobile.navigation.update();
    }
    if (
      swiperInstanceMobile &&
      swiperInstanceMobile.params &&
      swiperInstanceMobile.params.pagination &&
      paginationRefMobile.current
    ) {
      swiperInstanceMobile.params.pagination.el = paginationRefMobile.current;
      swiperInstanceMobile.pagination.init();
      swiperInstanceMobile.pagination.render();
      swiperInstanceMobile.pagination.update();
    }
  }, [swiperInstanceMobile, prevRefMobile, nextRefMobile, paginationRefMobile]);

  const cardBg = design.bgColor === 'transparent' ? 'none' : hexToRgba(design.bgColor, design.bgOpacity ?? 1);
  const accent = design.accentColor;
  const navArrowBg = design.bgColor === 'transparent' ? 'rgba(255,255,255,0.4)' : hexToRgba(design.bgColor, 0.4);
  const navArrowBorder = navArrowBg;
  const buttonBg = submitHover
    ? (design.bgColor === 'transparent' ? 'rgba(255,255,255,0.2)' : hexToRgba(design.bgColor, 0.2))
    : navArrowBg;
  const buttonStyle = {
    display: 'inline-block',
    border: `2px solid ${navArrowBorder}`,
    background: buttonBg,
    color: accent,
    borderRadius: design.borderRadius,
    padding: '4px 16px',
    fontWeight: 500,
    fontSize: 14,
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxSizing: 'border-box' as any,
    transform: 'translateX(7px)',
  };

  return (
    <>
      <style>{styles}</style>
      <div className="flex flex-col items-center px-4" style={{ '--pr-accent-color': design.accentColor } as React.CSSProperties}>
        <div className="flex flex-col items-center w-full max-w-4xl px-4">
          <div className="flex flex-col items-center w-full justify-center relative">
            {/* Desktop: arrows and Swiper in a row */}
            <div className="hidden md:flex flex-row items-center justify-center w-full mt-2 gap-4">
              <div className="flex items-center justify-center flex-shrink-0 ml-4">
                <button
                  ref={prevRefDesktop}
                  className="rounded-full border border-gray-200 w-10 h-10 flex items-center justify-center transition z-10 hover:bg-opacity-80 active:scale-95"
                  aria-label="Previous"
                  style={{
                    width: 40,
                    height: 40,
                    minWidth: 40,
                    minHeight: 40,
                    aspectRatio: '1 / 1',
                    background: cardBg,
                    boxShadow: design.shadow ? `inset 0 0 8px 0 ${hexToRgba('#000', 0.18)}, inset 0 0 2px 0 ${hexToRgba('#fff', 0.12)}` : 'none',
                    border: `1.5px solid ${hexToRgba('#888', 0.22)}`,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ display: 'block', margin: 'auto' }}>
                    <polygon points="12.5,3 5.5,10 12.5,17" fill={design.accentColor || '#111'} />
                  </svg>
                </button>
              </div>
              <div className="flex-1">
                <Swiper
                  key={String(design.autoAdvance) + '-' + String(paginationReady)}
                  onSwiper={setSwiperInstanceDesktop}
                  modules={[
                    Navigation,
                    Pagination,
                    A11y,
                    ...(design.autoAdvance ? [Autoplay] : [])
                  ]}
                  spaceBetween={30}
                  slidesPerView={1}
                  navigation={{ prevEl: prevRefDesktop.current, nextEl: nextRefDesktop.current }}
                  pagination={{ 
                    clickable: true,
                    el: paginationRefDesktop.current,
                    bulletClass: 'swiper-pagination-bullet',
                    bulletActiveClass: 'swiper-pagination-bullet-active',
                    renderBullet: function (index, className) {
                      const isActive = className.includes('swiper-pagination-bullet-active');
                      const color = isActive ? design.accentColor : lightenHex(design.accentColor, 0.7);
                      return '<span class="' + className + '" style="background: ' + color + ';"></span>';
                    }
                  }}
                  {...(design.autoAdvance ? { autoplay: {
                    delay: (design.slideshowSpeed ?? 4) * 1000,
                    disableOnInteraction: false,
                  }} : {})}
                  className="max-w-4xl w-full"
                >
                  {reviews.map((review, index) => (
                    <SwiperSlide key={review.id || index}>
                      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <article
                          className="flex flex-col md:flex-row items-stretch bg-white rounded-3xl w-full px-0 md:px-0 justify-center flex-1 md:h-[440px] overflow-hidden relative"
                          style={{
                            background: design.bgColor === 'transparent' ? 'none' : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
                            color: design.textColor,
                            border: design.border ? `${design.borderWidth ?? 2}px solid ${design.borderColor ?? '#cccccc'}` : 'none',
                            borderRadius: design.borderRadius,
                          }}
                          itemScope
                          itemType="https://schema.org/Review"
                        >
                          {design.shadow && (
                            <div
                              className="pointer-events-none absolute inset-0 rounded-3xl"
                              style={{
                                boxShadow: `inset 0 0 32px 0 ${hexToRgba(design.shadowColor ?? '#222222', design.shadowIntensity ?? 0.2)}`,
                                borderRadius: design.borderRadius,
                                zIndex: 1,
                              }}
                            />
                          )}
                          {/* PHOTO ON TOP ON MOBILE, LEFT ON DESKTOP */}
                          <div className="pr-widget-photo-img flex items-center justify-center w-full md:w-2/5 h-[440px] md:h-full min-h-[440px] relative" style={{ background: '#f3f4f6', boxShadow: 'none', zIndex: 2 }}>
                            {review.photo_url ? (
                              <img
                                src={review.photo_url}
                                alt={`${review.first_name} ${review.last_name}`}
                                className="w-full h-full object-cover shadow-none"
                                style={{ boxShadow: 'none' }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100" style={{ boxShadow: 'none' }}>
                                <svg
                                  className="w-12 h-12 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  style={{ filter: 'none', boxShadow: 'none' }}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                          {/* CONTENT BELOW ON MOBILE, RIGHT ON DESKTOP */}
                          <div className="flex flex-col justify-between h-full items-center flex-1 px-6 py-4 relative overflow-hidden" style={{ boxShadow: design.shadow ? `inset 0 4px 32px 0 ${hexToRgba(design.shadowColor ?? '#222222', design.shadowIntensity ?? 0.2)}` : 'none', zIndex: 3 }}>
                            {/* Divider shadow on content edge (desktop only) */}
                            <div className="hidden sm:block pointer-events-none absolute top-0 bottom-0 left-0 h-full w-16 z-10" style={{
                              background: `linear-gradient(to right, ${hexToRgba(design.shadowColor ?? '#222222', (design.shadowIntensity ?? 0.18) * 0.18)}, transparent 80%)`
                            }} />
                            {/* Card right edge shadow (desktop only) */}
                            <div className="hidden sm:block pointer-events-none absolute top-0 right-0 h-full w-16 z-10" style={{
                              background: `linear-gradient(to left, ${hexToRgba(design.shadowColor ?? '#222222', (design.shadowIntensity ?? 0.18) * 0.18)}, transparent 80%)`
                            }} />
                            {/* Stars at the very top of the card */}
                            <div className="flex items-center justify-center mb-2 mt-4" style={{ minHeight: 36, width: '100%' }}>
                              {renderStars(review.star_rating, 20)}
                            </div>
                            {/* Review content and quotes */}
                            <div className="flex flex-col items-center justify-center w-full min-h-[120px] sm:min-h-[180px] pb-24" style={{ position: 'relative' }}>
                              <div className="w-full text-center text-[18px] text-gray-800 mb-4 break-words whitespace-pre-line relative" style={{ position: 'relative', overflow: 'visible' }}>
                                {design.showQuotes && (
                                  <span style={{
                                    position: 'absolute',
                                    left: '-16px',
                                    top: '-24px',
                                    fontSize: '72px',
                                    color: lightenHex(design.accentColor, 0.6),
                                    opacity: 0.6,
                                    fontFamily: 'Georgia, serif',
                                    lineHeight: 1,
                                    zIndex: 2,
                                    pointerEvents: 'none',
                                    userSelect: 'none',
                                  }}>
                                    “
                                  </span>
                                )}
                                <p className="mb-8 text-[14px] text-center" style={{ color: design.textColor }}>
                                  {review.review_content}
                                </p>
                                {design.showQuotes && (
                                  <span style={{
                                    position: 'absolute',
                                    right: '-16px',
                                    bottom: '-48px',
                                    fontSize: '72px',
                                    color: lightenHex(design.accentColor, 0.6),
                                    opacity: 0.6,
                                    fontFamily: 'Georgia, serif',
                                    lineHeight: 1,
                                    zIndex: 2,
                                    pointerEvents: 'none',
                                    userSelect: 'none',
                                  }}>
                                    ”
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-center gap-1 w-full mt-2 mb-4">
                              <span
                                className="font-semibold"
                                itemProp="author"
                                itemScope
                                itemType="https://schema.org/Person"
                                style={{ fontSize: design.attributionFontSize * 0.85, color: design.nameTextColor }}
                              >
                                <span itemProp="name">
                                  {review.first_name} {review.last_name}
                                </span>
                              </span>
                              <span
                                className="text-xs"
                                itemProp="author"
                                itemScope
                                itemType="https://schema.org/Person"
                                style={{ fontSize: design.attributionFontSize * 0.85, color: design.roleTextColor }}
                              >
                                <span itemProp="jobTitle">
                                  {review.reviewer_role}
                                </span>
                              </span>
                              {design.showRelativeDate && review.created_at && (
                                <span className="text-xs text-gray-400 mt-1">
                                  {getRelativeTime(review.created_at)}
                                  {review.platform && !/^custom$/i.test(review.platform.trim()) && (
                                    <> via {review.platform}</>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </article>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
              <div className="flex items-center justify-center flex-shrink-0 mr-4">
                <button
                  ref={nextRefDesktop}
                  className="rounded-full border border-gray-200 w-10 h-10 flex items-center justify-center transition z-10 hover:bg-opacity-80 active:scale-95"
                  aria-label="Next"
                  style={{
                    width: 40,
                    height: 40,
                    minWidth: 40,
                    minHeight: 40,
                    aspectRatio: '1 / 1',
                    background: cardBg,
                    boxShadow: design.shadow ? `
                      inset 0 0 8px 0 ${hexToRgba('#000', 0.18)},
                      inset 0 0 2px 0 ${hexToRgba('#fff', 0.12)}
                    ` : 'none',
                    border: `1.5px solid ${hexToRgba('#888', 0.22)}`,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ display: 'block', margin: 'auto' }}>
                    <polygon points="7.5,3 14.5,10 7.5,17" fill={design.accentColor || '#111'} />
                  </svg>
                </button>
              </div>
            </div>

            {/* Pagination dots below cards on desktop */}
            <div className="hidden md:flex flex-row items-center justify-center w-full mt-12">
              <div ref={paginationRefDesktop} className="swiper-pagination" />
            </div>

            {/* Mobile: Swiper with pagination and navigation below */}
            <div className="md:hidden w-full">
              {/* Pagination element */}
              <div className="absolute left-0 right-0 flex justify-center" style={{ bottom: 4, zIndex: 10 }}>
                <div ref={paginationRefMobile} className="swiper-pagination" />
              </div>
              <Swiper
                key={String(design.autoAdvance) + '-' + String(paginationReady)}
                onSwiper={setSwiperInstanceMobile}
                modules={[
                  Navigation,
                  Pagination,
                  A11y,
                  ...(design.autoAdvance ? [Autoplay] : [])
                ]}
                spaceBetween={30}
                slidesPerView={1}
                navigation={{ prevEl: prevRefMobile.current, nextEl: nextRefMobile.current }}
                pagination={{
                  clickable: true,
                  el: paginationRefMobile.current,
                  bulletClass: 'swiper-pagination-bullet',
                  bulletActiveClass: 'swiper-pagination-bullet-active',
                  renderBullet: function (index, className) {
                    const isActive = className.includes('swiper-pagination-bullet-active');
                    const color = isActive ? design.accentColor : lightenHex(design.accentColor, 0.7);
                    return '<span class="' + className + '" style="background: ' + color + ';"></span>';
                  }
                }}
                {...(design.autoAdvance ? { autoplay: {
                  delay: (design.slideshowSpeed ?? 4) * 1000,
                  disableOnInteraction: false,
                }} : {})}
                className="w-full"
              >
                {reviews.map((review, index) => (
                  <SwiperSlide key={review.id || index}>
                    <div className="w-full max-w-full" style={{ position: 'relative', height: '100%' }}>
                      <article className="flex flex-col items-stretch bg-white rounded-3xl w-full px-0 justify-center flex-1 h-[480px] overflow-hidden relative" style={{
                        background: design.bgColor === 'transparent' ? 'none' : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
                        color: design.textColor,
                        border: design.border ? `${design.borderWidth ?? 2}px solid ${design.borderColor ?? '#cccccc'}` : 'none',
                        borderRadius: design.borderRadius,
                        boxShadow: design.shadow ? `inset 0 0 32px 0 ${hexToRgba(design.shadowColor ?? '#222222', design.shadowIntensity ?? 0.2)}` : 'none',
                      }}
                        itemScope
                        itemType="https://schema.org/Review"
                      >
                        {/* PHOTO ON TOP ON MOBILE */}
                        <div className="pr-widget-photo-img flex items-center justify-center w-full h-[320px] min-h-[280px] relative">
                          {review.photo_url ? (
                            <img
                              src={review.photo_url}
                              alt={`${review.first_name} ${review.last_name}`}
                              className="w-full h-full object-cover shadow-none"
                              style={{ boxShadow: 'none' }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100" style={{ boxShadow: 'none' }}>
                              <svg
                                className="w-12 h-12 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                style={{ filter: 'none', boxShadow: 'none' }}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        {/* CONTENT BELOW ON MOBILE */}
                        <div className="flex flex-col justify-between h-full items-center flex-1 px-4 py-4 pb-20">
                          <div className="flex items-center justify-center mb-2 mt-0" style={{ minHeight: 36, width: '100%' }}>
                            {renderStars(review.star_rating, 20)}
                          </div>
                          <div className="flex flex-col items-center justify-center w-full min-h-[120px] pb-12" style={{ position: 'relative' }}>
                            <div className="w-full text-center text-[14px] text-gray-800 mb-4 break-words whitespace-pre-line relative" style={{ position: 'relative', overflow: 'visible' }}>
                              {design.showQuotes && (
                                <span style={{
                                  position: 'absolute',
                                  left: '-16px',
                                  top: '-24px',
                                  fontSize: '72px',
                                  color: lightenHex(design.accentColor, 0.6),
                                  opacity: 0.6,
                                  fontFamily: 'Georgia, serif',
                                  lineHeight: 1,
                                  zIndex: 2,
                                  pointerEvents: 'none',
                                  userSelect: 'none',
                                }}>
                                  “
                                </span>
                              )}
                              <p className="mb-8 text-[14px] text-center" style={{ color: design.textColor }}>
                                {review.review_content}
                              </p>
                              {design.showQuotes && (
                                <span style={{
                                  position: 'absolute',
                                  right: '-16px',
                                  bottom: '-48px',
                                  fontSize: '72px',
                                  color: lightenHex(design.accentColor, 0.6),
                                  opacity: 0.6,
                                  fontFamily: 'Georgia, serif',
                                  lineHeight: 1,
                                  zIndex: 2,
                                  pointerEvents: 'none',
                                  userSelect: 'none',
                                }}>
                                  ”
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-center gap-1 w-full mt-2 mb-4">
                            <span
                              className="font-semibold"
                              itemProp="author"
                              itemScope
                              itemType="https://schema.org/Person"
                              style={{ fontSize: design.attributionFontSize * 0.85, color: design.nameTextColor }}
                            >
                              <span itemProp="name">
                                {review.first_name} {review.last_name}
                              </span>
                            </span>
                            <span
                              className="text-xs"
                              itemProp="author"
                              itemScope
                              itemType="https://schema.org/Person"
                              style={{ fontSize: design.attributionFontSize * 0.85, color: design.roleTextColor }}
                            >
                              <span itemProp="jobTitle">
                                {review.reviewer_role}
                              </span>
                            </span>
                            {design.showRelativeDate && review.created_at && (
                              <span className="text-xs text-gray-400 mt-1">
                                {getRelativeTime(review.created_at)}
                                {review.platform && !/^custom$/i.test(review.platform.trim()) && (
                                  <> via {review.platform}</>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </article>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
              {/* Navigation buttons */}
              <div className="flex flex-row items-center justify-between w-full px-4" style={{ marginTop: 24, position: 'relative', zIndex: 20 }}>
                <button
                  ref={prevRefMobile}
                  className="rounded-full border border-gray-200 w-10 h-10 min-w-10 min-h-10 flex items-center justify-center transition z-10 hover:bg-opacity-80 active:scale-95 flex-shrink-0"
                  aria-label="Previous"
                  style={{
                    background: cardBg,
                    boxShadow: design.shadow ? `inset 0 0 8px 0 ${hexToRgba('#000', 0.18)}, inset 0 0 2px 0 ${hexToRgba('#fff', 0.12)}` : 'none',
                    border: `1.5px solid ${hexToRgba('#888', 0.22)}`,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ display: 'block', margin: 'auto' }}>
                    <polygon points="12.5,3 5.5,10 12.5,17" fill={design.accentColor || '#111'} />
                  </svg>
                </button>
                <div className="flex-1" />
                <button
                  ref={nextRefMobile}
                  className="rounded-full border border-gray-200 w-10 h-10 min-w-10 min-h-10 flex items-center justify-center transition z-10 hover:bg-opacity-80 active:scale-95 flex-shrink-0"
                  aria-label="Next"
                  style={{
                    background: cardBg,
                    boxShadow: design.shadow ? `inset 0 0 8px 0 ${hexToRgba('#000', 0.18)}, inset 0 0 2px 0 ${hexToRgba('#fff', 0.12)}` : 'none',
                    border: `1.5px solid ${hexToRgba('#888', 0.22)}`,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ display: 'block', margin: 'auto' }}>
                    <polygon points="7.5,3 14.5,10 7.5,17" fill={design.accentColor || '#111'} />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PhotoWidget; 