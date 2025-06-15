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

// =========================
// Widget Layout Safety Rules
//
// - Never use design-driven layout fields (width, padding, margin) in widget containers unless explicitly set in the widget's design object.
// - Always use Tailwind responsive classes (max-w-4xl, w-full, mx-auto, etc.) for all widget containers.
// - If you must use a design-driven layout field, only apply it if it is explicitly set in the widget's design object (never from defaults).
// - Always use smartMergeDesign (see below) to merge design objects.
// - Update smartMergeDesign if you add new layout-related fields to DEFAULT_DESIGN.
// =========================

// List of layout-related fields to protect (update if you add more to DEFAULT_DESIGN)
const LAYOUT_FIELDS: (keyof typeof DEFAULT_DESIGN)[] = ['width'];

// Smart merge: only apply layout fields if explicitly set in userDesign
function smartMergeDesign(userDesign: Partial<typeof DEFAULT_DESIGN> = {}, defaultDesign = DEFAULT_DESIGN) {
  const merged = { ...defaultDesign, ...userDesign };
  for (const field of LAYOUT_FIELDS) {
    if (!(field in userDesign)) {
      delete merged[field];
    }
  }
  return merged;
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

// =========================
// MultiWidget Responsive Carousel
//
// - Responsive layout: 1 card (mobile), 2 (tablet), 3 (desktop)
// - On single-card/tablet, all elements (card, arrows, nav dots, submit button) are visually contained within 400px
// - Arrows use an invert effect on hover, active, and focus: accent color becomes background, arrow becomes card background/white
// - Nav dots and submit button are always aligned with the card area, never past the edge
//
// Accessibility notes:
// - Arrow buttons have aria-labels for screen readers
// - Consider adding better focus outlines for keyboard users
// - Consider aria-live="polite" on Swiper for announcing slide changes
// - Consider keyboard navigation for arrows (left/right arrow keys)
// =========================

// Accessibility: add focus-visible outline to arrow buttons
const focusOutline = {
  outline: '2px solid ' + (typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--pr-accent-color') || 'slateblue' : 'slateblue'),
  outlineOffset: '2px',
};

const MultiWidget: React.FC<{ data: WidgetData }> = ({ data }) => {
    // Use smartMergeDesign instead of getDesignWithDefaults
    const design = smartMergeDesign(data.design);
    const { reviews } = data;
    const prevRefDesktop = useRef(null);
    const nextRefDesktop = useRef(null);
    const paginationRefDesktop = useRef(null);
    const prevRefMobile = useRef(null);
    const nextRefMobile = useRef(null);
    const paginationRefMobile = useRef(null);
    const [swiperInstanceDesktop, setSwiperInstanceDesktop] = useState<any>(null);
    const [swiperInstanceMobile, setSwiperInstanceMobile] = useState<any>(null);
    const [paginationReady, setPaginationReady] = useState(false);
  
    useEffect(() => { setPaginationReady(true); }, []);
  
    // Desktop navigation/pagination
    useEffect(() => {
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
  
    // Mobile navigation/pagination
    useEffect(() => {
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
  
    // Ensure Swiper updates on window resize for responsive breakpoints
    useEffect(() => {
      if (!swiperInstanceDesktop) return;
      const handleResize = () => swiperInstanceDesktop.update();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [swiperInstanceDesktop]);
  
    useEffect(() => {
      if (!swiperInstanceMobile) return;
      const handleResize = () => swiperInstanceMobile.update();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [swiperInstanceMobile]);
  
    // Keyboard navigation for arrow buttons
    const handleArrowKey = (e: React.KeyboardEvent, direction: 'prev' | 'next') => {
      if (e.key === 'ArrowLeft' && direction === 'prev') {
        swiperInstanceDesktop?.slidePrev?.();
        swiperInstanceMobile?.slidePrev?.();
      } else if (e.key === 'ArrowRight' && direction === 'next') {
        swiperInstanceDesktop?.slideNext?.();
        swiperInstanceMobile?.slideNext?.();
      }
    };
  
    return (
      <div className="flex flex-col items-center px-4" style={{ '--pr-accent-color': design.accentColor } as React.CSSProperties}>
        {/* Desktop/tablet/large: Swiper in a centered, max-width container */}
        <div className="hidden md:flex w-full justify-center">
          <div className="relative w-full max-w-5xl mx-auto px-8">
            {/* Left Arrow */}
            <button
              ref={prevRefDesktop}
              className="group absolute -left-8 top-1/2 -translate-y-1/2 z-10 rounded-full border border-gray-200 w-10 h-10 flex items-center justify-center transition hover:bg-opacity-80 active:scale-95 focus:scale-95 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--pr-accent-color)] focus-visible:outline-offset-2 hidden md:flex"
              aria-label="Previous"
              tabIndex={0}
              style={{
                background: design.bgColor === 'transparent' ? 'none' : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
                boxShadow: design.shadow ? `inset 0 0 8px 0 ${hexToRgba('#000', 0.18)}, inset 0 0 2px 0 ${hexToRgba('#fff', 0.12)}` : 'none',
                border: `1.5px solid ${hexToRgba('#888', 0.22)}`,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ display: 'block', margin: 'auto', transition: 'fill 0.2s' }}>
                <polygon
                  points="12.5,3 5.5,10 12.5,17"
                  fill={design.accentColor || '#111'}
                  className="group-hover:fill-white group-active:fill-white group-focus:fill-white"
                  style={{
                    transition: 'fill 0.2s',
                    fill: design.accentColor || '#111',
                  }}
                />
              </svg>
              <style>{`
                .group:hover, .group:active, .group:focus { background: ${design.accentColor} !important; }
                .group:hover polygon, .group:active polygon, .group:focus polygon { fill: ${design.bgColor === 'transparent' ? '#fff' : design.bgColor} !important; }
              `}</style>
            </button>
            {/* Right Arrow */}
            <button
              ref={nextRefDesktop}
              className="group absolute -right-8 top-1/2 -translate-y-1/2 z-10 rounded-full border border-gray-200 w-10 h-10 flex items-center justify-center transition hover:bg-opacity-80 active:scale-95 focus:scale-95 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--pr-accent-color)] focus-visible:outline-offset-2 hidden md:flex"
              aria-label="Next"
              tabIndex={0}
              style={{
                background: design.bgColor === 'transparent' ? 'none' : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
                boxShadow: design.shadow ? `inset 0 0 8px 0 ${hexToRgba('#000', 0.18)}, inset 0 0 2px 0 ${hexToRgba('#fff', 0.12)}` : 'none',
                border: `1.5px solid ${hexToRgba('#888', 0.22)}`,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ display: 'block', margin: 'auto', transition: 'fill 0.2s' }}>
                <polygon
                  points="7.5,3 14.5,10 7.5,17"
                  fill={design.accentColor || '#111'}
                  className="group-hover:fill-white group-active:fill-white group-focus:fill-white"
                  style={{
                    transition: 'fill 0.2s',
                    fill: design.accentColor || '#111',
                  }}
                />
              </svg>
              <style>{`
                .group:hover, .group:active, .group:focus { background: ${design.accentColor} !important; }
                .group:hover polygon, .group:active polygon, .group:focus polygon { fill: ${design.bgColor === 'transparent' ? '#fff' : design.bgColor} !important; }
              `}</style>
            </button>
            <Swiper
              key={String(design.autoAdvance) + '-' + String(paginationReady)}
              onSwiper={setSwiperInstanceDesktop}
              modules={[Navigation, Pagination, A11y, ...(design.autoAdvance ? [Autoplay] : [])]}
              spaceBetween={24}
              slidesPerView={1}
              breakpoints={{
                768: { slidesPerView: 2, spaceBetween: 24 },
                1024: { slidesPerView: 3, spaceBetween: 24 },
              }}
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
              className="w-full"
            >
              {reviews.map((review, index) => (
                <SwiperSlide key={review.id || index}>
                  <div className="w-full h-[380px] flex flex-col rounded-3xl overflow-hidden bg-white px-2 py-4 shadow text-sm" style={{
                    background: design.bgColor === 'transparent' ? 'none' : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
                    color: design.textColor,
                    border: design.border ? `${design.borderWidth ?? 2}px solid ${design.borderColor ?? '#cccccc'}` : 'none',
                    borderRadius: design.borderRadius,
                    boxShadow: design.shadow ? `inset 0 4px 32px 0 ${hexToRgba(design.shadowColor ?? '#222222', design.shadowIntensity ?? 0.2)}` : 'none',
                  }}>
                    <div className="flex items-center justify-center mb-2 mt-0" style={{ minHeight: 36, width: '100%' }}>
                      {typeof review.star_rating === 'number' && !isNaN(review.star_rating) && renderStars(review.star_rating, 18)}
                    </div>
                    <div className="flex-1 min-h-0 w-full flex flex-col justify-center text-center text-[14px] md:text-[16px] text-gray-800 break-words whitespace-pre-line relative overflow-hidden line-clamp-5">
                      {design.showQuotes && (
                        <span className="absolute left-2 top-0 text-[72px] lg:text-[48px] opacity-60 font-serif select-none pointer-events-none" style={{ color: lightenHex(design.accentColor, 0.6), lineHeight: 1, zIndex: 2 }}>
                          &ldquo;
                        </span>
                      )}
                      <p className="mx-6 md:mt-0 text-[14px] md:text-[16px] text-center z-10 relative leading-relaxed" style={{ color: design.textColor }}>
                        {review.review_content}
                      </p>
                      {design.showQuotes && (
                        <span className="absolute right-2 bottom-2 text-[72px] lg:text-[48px] opacity-60 font-serif select-none pointer-events-none" style={{ color: lightenHex(design.accentColor, 0.6), lineHeight: 1, zIndex: 2 }}>
                          &rdquo;
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1 w-full mt-auto mb-2">
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
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
        {/* Desktop/tablet nav dots: mt-0 ensures the dots are as close as possible to the cards for a tight, visually connected look. */}
        <div className="hidden md:flex flex-row items-center justify-center max-w-5xl mx-auto w-full mt-0">
          <div ref={paginationRefDesktop} className="swiper-pagination" />
        </div>
        {/* Desktop/tablet submit button: pr-8 nudges the button further left. */}
        {design.showSubmitReviewButton && (
          <div className="hidden md:flex max-w-5xl mx-auto w-full justify-end mt-4 pr-8">
            <a
              href={`/r/${data.universalPromptSlug}`}
              style={{
                display: 'inline-block',
                background: design.bgColor === 'transparent' ? 'none' : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
                color: design.accentColor,
                borderRadius: design.borderRadius,
                padding: '6px 18px',
                fontWeight: 600,
                fontSize: 16,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
                boxShadow: design.shadow ? `inset 0 0 32px 0 ${hexToRgba(design.shadowColor ?? '#222222', design.shadowIntensity ?? 0.2)}` : 'none',
                border: design.border ? `${design.borderWidth ?? 2}px solid ${design.borderColor ?? '#cccccc'}` : 'none',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = design.accentColor;
                e.currentTarget.style.color = design.bgColor === 'transparent' ? '#fff' : design.bgColor;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = design.bgColor === 'transparent' ? 'none' : hexToRgba(design.bgColor, design.bgOpacity ?? 1);
                e.currentTarget.style.color = design.accentColor;
              }}
            >
              Submit a review
            </a>
          </div>
        )}
        {/* Mobile: Swiper with pagination and navigation below */}
        <div className="md:hidden w-full">
          {/* Tablet/mobile: constrain all elements to 400px and center */}
          <div className="max-w-[400px] mx-auto relative">
            {/* aria-live for announcing slide changes */}
            <div aria-live="polite">
              <Swiper
                key={String(design.autoAdvance) + '-' + String(paginationReady)}
                onSwiper={setSwiperInstanceMobile}
                modules={[Navigation, Pagination, A11y, ...(design.autoAdvance ? [Autoplay] : [])]}
                slidesPerView={1}
                centeredSlides={false}
                navigation={{ prevEl: prevRefMobile.current, nextEl: nextRefMobile.current }}
                pagination={{
                  clickable: true,
                  el: paginationRefMobile.current,
                  type: 'bullets',
                  bulletClass: 'swiper-pagination-bullet',
                  bulletActiveClass: 'swiper-pagination-bullet-active',
                  renderBullet: function (index, className) {
                    const isActive = className.includes('swiper-pagination-bullet-active');
                    const color = isActive ? design.accentColor : lightenHex(design.accentColor, 0.7);
                    return '<span class="' + className + '" style="background: ' + color + '; margin: 0 2px; width: 6px; height: 6px;"></span>';
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
                    <div className="flex flex-col h-[380px] items-center justify-between bg-white rounded-3xl overflow-hidden px-2 py-6 shadow mx-auto text-sm max-w-[400px]" style={{
                      background: design.bgColor === 'transparent' ? 'none' : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
                      color: design.textColor,
                      border: design.border ? `${design.borderWidth ?? 2}px solid ${design.borderColor ?? '#cccccc'}` : 'none',
                      borderRadius: design.borderRadius,
                      boxShadow: design.shadow ? `inset 0 4px 32px 0 ${hexToRgba(design.shadowColor ?? '#222222', design.shadowIntensity ?? 0.2)}` : 'none',
                    }}>
                      <div className="flex items-center justify-center mb-2 mt-0" style={{ minHeight: 36, width: '100%' }}>
                        {typeof review.star_rating === 'number' && !isNaN(review.star_rating) && renderStars(review.star_rating, 18)}
                      </div>
                      <div className="flex-1 min-h-0 w-full flex flex-col justify-center text-center text-[14px] md:text-[16px] text-gray-800 break-words whitespace-pre-line relative overflow-hidden line-clamp-5">
                        {design.showQuotes && (
                          <span className="absolute left-2 top-0 text-[72px] lg:text-[48px] opacity-60 font-serif select-none pointer-events-none" style={{ color: lightenHex(design.accentColor, 0.6), lineHeight: 1, zIndex: 2 }}>
                            &ldquo;
                          </span>
                        )}
                        <p className="mx-6 md:mt-0 text-[14px] md:text-[16px] text-center z-10 relative leading-relaxed" style={{ color: design.textColor }}>
                          {review.review_content}
                        </p>
                        {design.showQuotes && (
                          <span className="absolute right-2 bottom-2 text-[72px] lg:text-[48px] opacity-60 font-serif select-none pointer-events-none" style={{ color: lightenHex(design.accentColor, 0.6), lineHeight: 1, zIndex: 2 }}>
                            &rdquo;
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-center gap-1 w-full mt-auto mb-2">
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
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
            {/* On mobile/tablet, nav arrows are at the edges of the card and nav dots are centered between them, all within 400px */}
            <div className="flex w-full relative mt-4" style={{ minHeight: 48 }}>
              <button
                ref={prevRefMobile}
                className="group absolute left-0 top-1/2 -translate-y-1/2 rounded-full border border-gray-200 w-10 h-10 min-w-10 min-h-10 flex items-center justify-center transition hover:bg-opacity-80 active:scale-95 focus:scale-95 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--pr-accent-color)] focus-visible:outline-offset-2 flex-shrink-0"
                aria-label="Previous"
                tabIndex={0}
                style={{
                  background: design.bgColor === 'transparent' ? 'rgba(255,255,255,0.4)' : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
                  boxShadow: design.shadow ? `inset 0 0 8px 0 ${hexToRgba('#000', 0.18)}, inset 0 0 2px 0 ${hexToRgba('#fff', 0.12)}` : 'none',
                  border: `1.5px solid ${hexToRgba('#888', 0.22)}`,
                }}
                onKeyDown={e => handleArrowKey(e, 'prev')}
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ display: 'block', margin: 'auto', transition: 'fill 0.2s' }}>
                  <polygon
                    points="12.5,3 5.5,10 12.5,17"
                    fill={design.accentColor || '#111'}
                    className="group-hover:fill-white group-active:fill-white group-focus:fill-white"
                    style={{
                      transition: 'fill 0.2s',
                      fill: design.accentColor || '#111',
                    }}
                  />
                </svg>
              </button>
              <div className="flex justify-center items-center w-full">
                <div ref={paginationRefMobile} className="swiper-pagination" />
              </div>
              <button
                ref={nextRefMobile}
                className="group absolute right-0 top-1/2 -translate-y-1/2 rounded-full border border-gray-200 w-10 h-10 min-w-10 min-h-10 flex items-center justify-center transition hover:bg-opacity-80 active:scale-95 focus:scale-95 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--pr-accent-color)] focus-visible:outline-offset-2 flex-shrink-0"
                aria-label="Next"
                tabIndex={0}
                style={{
                  background: design.bgColor === 'transparent' ? 'rgba(255,255,255,0.4)' : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
                  boxShadow: design.shadow ? `inset 0 0 8px 0 ${hexToRgba('#000', 0.18)}, inset 0 0 2px 0 ${hexToRgba('#fff', 0.12)}` : 'none',
                  border: `1.5px solid ${hexToRgba('#888', 0.22)}`,
                }}
                onKeyDown={e => handleArrowKey(e, 'next')}
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ display: 'block', margin: 'auto', transition: 'fill 0.2s' }}>
                  <polygon
                    points="7.5,3 14.5,10 7.5,17"
                    fill={design.accentColor || '#111'}
                    className="group-hover:fill-white group-active:fill-white group-focus:fill-white"
                    style={{
                      transition: 'fill 0.2s',
                      fill: design.accentColor || '#111',
                    }}
                  />
                </svg>
              </button>
            </div>
            {/* Mobile/tablet submit button (below md only) */}
            {design.showSubmitReviewButton && (
              <div className="flex max-w-[400px] mx-auto w-full justify-end mt-4" style={{ marginRight: '20px' }}>
                <a
                  href={`/r/${data.universalPromptSlug}`}
                  style={{
                    display: 'inline-block',
                    background: design.bgColor === 'transparent' ? 'none' : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
                    color: design.accentColor,
                    borderRadius: design.borderRadius,
                    padding: '6px 18px',
                    fontWeight: 600,
                    fontSize: 16,
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    boxShadow: design.shadow ? `inset 0 0 32px 0 ${hexToRgba(design.shadowColor ?? '#222222', design.shadowIntensity ?? 0.2)}` : 'none',
                    border: design.border ? `${design.borderWidth ?? 2}px solid ${design.borderColor ?? '#cccccc'}` : 'none',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = design.accentColor;
                    e.currentTarget.style.color = design.bgColor === 'transparent' ? '#fff' : design.bgColor;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = design.bgColor === 'transparent' ? 'none' : hexToRgba(design.bgColor, design.bgOpacity ?? 1);
                    e.currentTarget.style.color = design.accentColor;
                  }}
                >
                  Submit a review
                </a>
              </div>
            )}
          </div>
        </div>
        {/* Custom pagination size for all breakpoints */}
        <style>{`
          .swiper-pagination-bullet {
            width: 8px !important;
            height: 8px !important;
          }
        `}</style>
      </div>
    );
  };
export default MultiWidget; 