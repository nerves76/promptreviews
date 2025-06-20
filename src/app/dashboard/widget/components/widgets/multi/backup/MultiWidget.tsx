import React, { useRef, useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import StarRating from '../../../shared/StarRating';
import { getDesignWithDefaults, DEFAULT_DESIGN, hexToRgba, lightenHex, getRelativeTime } from '../../../shared/utils';
// Import any shared helpers from widget-embed/index.tsx as needed
// ...
// --- Shared types and helpers ---
// (import or define WidgetData, getDesignWithDefaults, renderStars, hexToRgba, lightenHex, getRelativeTime, etc.)

// WidgetType and WidgetData
type WidgetType = 'single' | 'multi' | 'photo';

// Define the design state type
interface DesignState {
  bgType: "none" | "solid";
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
  sectionBgType: "none" | "custom";
  sectionBgColor: string;
  shadowIntensity: number;
  shadowColor: string;
  borderColor: string;
  font: string;
  showSubmitReviewButton: boolean;
}

// Define the widget data structure
interface WidgetData {
  id: string;
  widget_type: 'multi' | 'single' | 'photo';
  design: DesignState;
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
  universalPromptSlug?: string;
}

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
const LAYOUT_FIELDS: (keyof DesignState)[] = ['width'];

// Smart merge: only apply layout fields if explicitly set in userDesign
function smartMergeDesign(userDesign: Partial<DesignState> = {}, defaultDesign = DEFAULT_DESIGN.multi) {
  const merged = { ...defaultDesign, ...userDesign };
  for (const field of LAYOUT_FIELDS) {
    if (!(field in userDesign)) {
      delete merged[field];
    }
  }
  return merged;
}

// Add this helper function near the top with other utility functions
function getValidFontSize(size: number | undefined | null, defaultSize: number = 14): number {
  if (typeof size !== 'number' || isNaN(size)) return defaultSize;
  return size;
}

// Add this helper function near the top with other utility functions
function getValidBackgroundColor(bgColor: string | undefined, bgOpacity: number | undefined): string {
  if (!bgColor || bgColor === 'transparent') return 'rgba(255, 255, 255, 1)';
  return hexToRgba(bgColor, bgOpacity ?? 1);
}

// Placeholder for styles (define or import as needed)
const styles = "";

// Add these styles near the top of the file, after the imports
const swiperStyles = `
  .swiper-pagination {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 16px;
  }
  .swiper-pagination-bullet {
    width: 8px;
    height: 8px;
    background: #ccc;
    opacity: 1;
    margin: 0 4px;
    transition: all 0.2s ease;
    border-radius: 50%;
  }
  .swiper-pagination-bullet-active {
    transform: scale(1.2);
  }
  .swiper-button-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

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
    // Use getDesignWithDefaults to get the design state
    const design = getDesignWithDefaults(data.design, data.widget_type);
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
  
    // Log the widget type and design for debugging
    useEffect(() => {
      console.log('MultiWidget - widget_type:', data.widget_type);
      console.log('MultiWidget - design:', design);
      console.log('MultiWidget - data.design:', data.design);
      console.log('MultiWidget - DEFAULT_DESIGN[multi]:', DEFAULT_DESIGN.multi);
    }, [data.widget_type, design, data.design]);
  
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
              className="group absolute -left-8 top-1/2 -translate-y-1/2 z-10 rounded-full w-10 h-10 flex items-center justify-center transition hover:bg-opacity-80 active:scale-95 focus:scale-95 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--pr-accent-color)] focus-visible:outline-offset-2 hidden md:flex"
              aria-label="Previous"
              tabIndex={0}
              style={{
                background: getValidBackgroundColor(design.bgColor, design.bgOpacity),
                border: `1.5px solid ${hexToRgba('#888', 0.22)}`,
              }}
            >
              {design.shadow && (
                <div
                  className="pointer-events-none absolute inset-0 rounded-full"
                  style={{
                    boxShadow: `inset 0 0 8px 0 ${hexToRgba(design.shadowColor ?? '#222222', design.shadowIntensity ?? 0.2)}`,
                    zIndex: 1,
                  }}
                />
              )}
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ display: 'block', margin: 'auto', transition: 'fill 0.2s', position: 'relative', zIndex: 2 }}>
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
              className="group absolute -right-8 top-1/2 -translate-y-1/2 z-10 rounded-full w-10 h-10 flex items-center justify-center transition hover:bg-opacity-80 active:scale-95 focus:scale-95 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--pr-accent-color)] focus-visible:outline-offset-2 hidden md:flex"
              aria-label="Next"
              tabIndex={0}
              style={{
                background: getValidBackgroundColor(design.bgColor, design.bgOpacity),
                border: `1.5px solid ${hexToRgba('#888', 0.22)}`,
              }}
            >
              {design.shadow && (
                <div
                  className="pointer-events-none absolute inset-0 rounded-full"
                  style={{
                    boxShadow: `inset 0 0 8px 0 ${hexToRgba(design.shadowColor ?? '#222222', design.shadowIntensity ?? 0.2)}`,
                    zIndex: 1,
                  }}
                />
              )}
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ display: 'block', margin: 'auto', transition: 'fill 0.2s', position: 'relative', zIndex: 2 }}>
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
              <style>{swiperStyles}</style>
              {reviews.map((review, index) => (
                <SwiperSlide key={review.id || index}>
                  <div className="w-full h-[380px] flex flex-col rounded-3xl overflow-hidden px-2 py-4 shadow text-sm relative" style={{
                    background: getValidBackgroundColor(design.bgColor, design.bgOpacity),
                    color: design.textColor,
                    border: design.border ? `${design.borderWidth ?? 2}px solid ${design.borderColor ?? '#cccccc'}` : 'none',
                    borderRadius: design.borderRadius,
                  }}>
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
                    <div className="flex items-center justify-center mb-2 mt-0 relative z-10" style={{ minHeight: 36, width: '100%' }}>
                      {typeof review.star_rating === 'number' && !isNaN(review.star_rating) && <StarRating rating={review.star_rating} size={18} />}
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
                        style={{ fontSize: getValidFontSize(design.attributionFontSize, 14) * 0.85, color: design.nameTextColor }}
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
                        style={{ fontSize: getValidFontSize(design.attributionFontSize, 14) * 0.85, color: design.roleTextColor }}
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
        <div className="hidden md:flex flex-row items-center justify-center max-w-5xl mx-auto w-full mt-4">
          <div ref={paginationRefDesktop} className="swiper-pagination" />
        </div>
        {/* Desktop/tablet submit button: pr-8 nudges the button further left. */}
        {design.showSubmitReviewButton && (
          <div className="hidden md:flex max-w-5xl mx-auto w-full justify-end mt-4 pr-8">
            <a
              href={`/r/${data.universalPromptSlug}`}
              className="relative"
              style={{
                display: 'inline-block',
                background: getValidBackgroundColor(design.bgColor, design.bgOpacity),
                color: design.accentColor,
                borderRadius: design.borderRadius,
                padding: '6px 18px',
                fontWeight: 600,
                boxShadow: `inset 0 0 32px 0 ${hexToRgba(design.shadowColor ?? '#222222', design.shadowIntensity ?? 0.2)}`,
                border: `1px solid ${hexToRgba('#888', 0.22)}`,
              }}
            >
              <span className="relative z-10">Submit a Review</span>
            </a>
          </div>
        )}
        {/* Mobile view */}
        <div className="md:hidden w-full max-w-[400px] mx-auto">
          <div className="relative">
            <Swiper
              key={String(design.autoAdvance) + '-' + String(paginationReady)}
              onSwiper={setSwiperInstanceMobile}
              modules={[Navigation, Pagination, A11y, ...(design.autoAdvance ? [Autoplay] : [])]}
              slidesPerView={1}
              centeredSlides={true}
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
                  <div className="flex flex-col h-[380px] items-center justify-between rounded-3xl overflow-hidden px-2 py-6 shadow mx-auto text-sm relative" style={{
                    background: getValidBackgroundColor(design.bgColor, design.bgOpacity),
                    color: design.textColor,
                    border: design.border ? `${design.borderWidth ?? 2}px solid ${design.borderColor ?? '#cccccc'}` : 'none',
                    borderRadius: design.borderRadius,
                  }}>
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
                    <div className="flex items-center justify-center mb-2 mt-0" style={{ minHeight: 36, width: '100%' }}>
                      {typeof review.star_rating === 'number' && !isNaN(review.star_rating) && <StarRating rating={review.star_rating} size={18} />}
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
                        style={{ fontSize: getValidFontSize(design.attributionFontSize, 14) * 0.85, color: design.nameTextColor }}
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
                        style={{ fontSize: getValidFontSize(design.attributionFontSize, 14) * 0.85, color: design.roleTextColor }}
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
            
            {/* Mobile navigation */}
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
          </div>
          
          {/* Mobile submit button */}
          {design.showSubmitReviewButton && (
            <div className="flex w-full justify-end mt-4">
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
                  boxShadow: `inset 0 0 32px 0 ${hexToRgba(design.shadowColor ?? '#222222', design.shadowIntensity ?? 0.2)}`,
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