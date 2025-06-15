// NOTE: This file is no longer used. It is kept as a backup reference only.
// All widget types now import WidgetData and shared helpers from 'src/widget-embed/index.tsx'.

import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserClient } from '@supabase/ssr';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Define the widget types
type WidgetType = 'single' | 'multi' | 'photo';

// Define the widget data structure
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

// Add this helper function after the WidgetData interface
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

// Function to fetch widget data from Supabase
async function fetchWidgetData(widgetId: string): Promise<WidgetData | null> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('widgets')
    .select('*')
    .eq('id', widgetId)
    .single();

  if (error || !data) {
    console.error('Error fetching widget data:', error);
    return null;
  }

  const { data: reviews, error: reviewsError } = await supabase
    .from('widget_reviews')
    .select('*')
    .eq('widget_id', widgetId)
    .order('order_index', { ascending: true });

  if (reviewsError) {
    console.error('Error fetching widget reviews:', reviewsError);
    return null;
  }

  return {
    ...data,
    reviews: reviews || [],
  };
}

// Helper to get relative time string (dashboard logic)
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

// Add star rating rendering helper
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

// Helper to convert hex to rgba
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

// Helper to lighten a hex color
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

// Helper to inject widget responsive CSS at runtime
function injectWidgetResponsiveCSS() {
  if (!document.getElementById('pr-widget-responsive-css')) {
    const style = document.createElement('style');
    style.id = 'pr-widget-responsive-css';
    style.innerHTML = `
      .pr-widget-root { max-width: 100%; margin: 0 auto; position: relative; }
      .pr-widget-card { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 24px 16px; position: relative; min-height: 320px; max-height: 320px; height: 320px; overflow: hidden; }
      .pr-widget-photo-card { display: flex; flex-direction: column; align-items: stretch; min-height: 320px; max-height: 320px; height: 320px; overflow: hidden; }
      .pr-widget-photo-img { display: flex; align-items: center; justify-content: center; background-color: #f3f4f6; overflow: hidden; width: 100%; min-width: 200px; height: 220px; }
      .pr-widget-photo-content { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 16px; position: relative; }
      @media (min-width: 640px) {
        .pr-widget-photo-card { flex-direction: row; height: 440px; }
        .pr-widget-photo-img { width: 33.333333%; height: 100%; }
        .pr-widget-photo-content { padding: 32px; }
      }
      .pr-widget-stars { display: flex; align-items: center; justify-center; margin-bottom: 8px; margin-top: 4px; }
      .pr-widget-review-body { margin-bottom: 16px; padding: 0 8px; text-align: center; }
      .pr-widget-photo-body { margin-bottom: 16px; padding: 0 8px; text-align: left; }
      .pr-widget-author { display: flex; flex-direction: column; align-items: center; gap: 4px; width: 100%; margin-top: auto; }
      .pr-widget-photo-author { align-items: flex-start; }
      .pr-widget-pagination { display: flex; justify-content: center; margin-top: 1.5rem; }
      .pr-widget-pagination .swiper-pagination-bullet { 
        width: 8px; 
        height: 8px; 
        background: #d1d5db; 
        opacity: 1;
        transition: all 0.3s ease;
        margin: 0 4px;
      }
      .pr-widget-pagination .swiper-pagination-bullet-active { 
        background: var(--pr-accent-color, #4F46E5);
        transform: scale(1.2);
      }
      .swiper-button-disabled { 
        opacity: 0.5; 
        cursor: not-allowed;
        pointer-events: none;
      }
      .swiper-button-disabled:hover { 
        background: rgba(255, 255, 255, 0.6) !important; 
      }
      .swiper-slide { 
        height: auto !important; 
        transition: transform 0.3s ease;
      }
      .swiper-slide > div { 
        height: 100% !important; 
      }
      .swiper-slide article { 
        height: 440px !important;
        transition: all 0.3s ease;
      }
      
      /* Additional styles for better responsiveness */
      @media (max-width: 640px) {
        /* .gap-8 { gap: 1rem; } */
        .px-8 { padding-left: 1rem; padding-right: 1rem; }
      }
    `;
    document.head.appendChild(style);
  }
}

// Main widget renderer
const WidgetRenderer: React.FC<{ data: WidgetData }> = ({ data }) => {
  switch (data.widget_type) {
    case 'single':
      return <SingleWidget data={data} />;
    case 'multi':
      return <MultiWidget data={data} />;
    case 'photo':
      return <PhotoWidget data={data} />;
    default:
      return <div>Unknown widget type</div>;
  }
};

// Helper to inject Swiper CSS at runtime
function injectSwiperCSS(): Promise<void> {
  return new Promise<void>((resolve) => {
    const SWIPER_CSS_URL = 'https://cdn.jsdelivr.net/npm/swiper@11.1.0/swiper-bundle.min.css';
    if (!document.querySelector('link[data-pr-swiper]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = SWIPER_CSS_URL;
      link.setAttribute('data-pr-swiper', 'true');
      link.onload = () => resolve();
      document.head.appendChild(link);
    } else {
      resolve();
    }
  });
}

// Helper to inject Swiper navigation CSS for embed
function injectSwiperNavCSS() {
  if (!document.getElementById('pr-swiper-nav-css')) {
    const style = document.createElement('style');
    style.id = 'pr-swiper-nav-css';
    style.innerHTML = `
      .swiper-button-next,
      .swiper-button-prev {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        z-index: 10;
        background: rgba(255,255,255,0.85);
        border: 1px solid #e5e7eb;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        cursor: pointer;
        transition: background 0.2s;
      }
      .swiper-button-next:hover,
      .swiper-button-prev:hover {
        background: #f3f4f6;
      }
      .swiper-button-prev { left: -24px; }
      .swiper-button-next { right: -24px; }
      @media (max-width: 600px) {
        .swiper-button-prev { left: 4px; }
        .swiper-button-next { right: 4px; }
      }
      .swiper-pagination {
        position: relative;
        margin-top: 16px;
      }
      .swiper-pagination-bullet {
        width: 8px;
        height: 8px;
        background: #e5e7eb;
        opacity: 1;
      }
      .swiper-pagination-bullet-active {
        background: #4f46e5;
      }
    `;
    document.head.appendChild(style);
  }
}

// Inject dashboard-style navigation button CSS
function injectWidgetNavCSS() {
  if (!document.getElementById('pr-widget-nav-css')) {
    const style = document.createElement('style');
    style.id = 'pr-widget-nav-css';
    style.innerHTML = `
      .pr-widget-nav-btn {
        border-radius: 9999px;
        background: rgba(255,255,255,0.6);
        backdrop-filter: blur(2px);
        border: 1px solid #e5e7eb;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
        z-index: 10;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      }
      .pr-widget-nav-btn.left {
        padding: 10px 14px 10px 10px;
      }
      .pr-widget-nav-btn.right {
        padding: 10px 10px 10px 14px;
      }
      .pr-widget-nav-btn:hover {
        background: #fff;
      }
      .pr-widget-nav-btn svg {
        width: 20px;
        height: 20px;
        display: block;
        margin: 0;
        padding: 0;
      }
      .pr-widget-nav-row {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 32px;
        width: 100%;
        max-width: 1000px;
        margin: 0 auto;
        padding: 0 16px;
      }
      .pr-widget-nav-center {
        flex: 1;
        display: flex;
        justify-content: center;
      }
      .pr-widget-pagination {
        display: flex;
        justify-content: center;
        margin-top: 24px;
      }
      .pr-widget-triangle-left, .pr-widget-triangle-right {
        display: block;
        width: 0;
        height: 0;
      }
      .pr-widget-triangle-left {
        border-top: 10px solid transparent;
        border-bottom: 10px solid transparent;
        border-right: 14px solid #222;
      }
      .pr-widget-triangle-right {
        border-top: 10px solid transparent;
        border-bottom: 10px solid transparent;
        border-left: 14px solid #222;
      }
      @media (max-width: 600px) {
        .pr-widget-nav-row {
          flex-direction: column;
          gap: 8px;
          align-items: center;
        }
        .pr-widget-nav-center {
          order: 1;
        }
        .pr-widget-nav-btn {
          order: 2;
          margin: 0 8px;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Update the styles for pagination
const styles = `
  .swiper-pagination {
    position: relative !important;
    bottom: auto !important;
    display: flex !important;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-top: 24px;
    width: auto !important;
  }
  .swiper-pagination-bullet {
    width: 8px !important;
    height: 8px !important;
    background: #d1d5db !important;
    opacity: 1 !important;
    transition: all 0.3s ease;
    margin: 0 4px !important;
  }
  .swiper-pagination-bullet-active {
    background: var(--pr-accent-color, #4F46E5) !important;
    transform: scale(1.2);
  }
  @media (max-width: 640px) {
    /* reverted custom mobile pagination margin for photo widget */
  }
`;

// MultiWidget implementation
const MultiWidget: React.FC<{ data: WidgetData }> = ({ data }) => {
  const design = getDesignWithDefaults(data.design);
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

  return (
    <div className="flex flex-col items-center px-4" style={{ '--pr-accent-color': design.accentColor } as React.CSSProperties}>
      {/* Desktop: arrows and Swiper in a row */}
      <div className="hidden md:flex flex-col items-center w-full max-w-5xl px-4">
        <div className="flex flex-row items-center justify-center w-full mt-2">
          <button
            ref={prevRefDesktop}
            className="rounded-full border border-gray-200 w-10 h-10 flex items-center justify-center transition z-10 hover:bg-opacity-80 active:scale-95 mr-4"
            aria-label="Previous"
            style={{
              width: 40,
              height: 40,
              minWidth: 40,
              minHeight: 40,
              aspectRatio: '1 / 1',
              background: design.bgColor === 'transparent' ? 'rgba(255,255,255,0.4)' : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
              boxShadow: design.shadow ? `inset 0 0 8px 0 ${hexToRgba('#000', 0.18)}, inset 0 0 2px 0 ${hexToRgba('#fff', 0.12)}` : 'none',
              border: `1.5px solid ${hexToRgba('#888', 0.22)}`,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ display: 'block', margin: 'auto' }}>
              <polygon points="12.5,3 5.5,10 12.5,17" fill={design.accentColor || '#111'} />
            </svg>
          </button>
          <div className="flex-1">
            <Swiper
              key={String(design.autoAdvance) + '-' + String(paginationReady)}
              onSwiper={setSwiperInstanceDesktop}
              modules={[Navigation, Pagination, A11y, ...(design.autoAdvance ? [Autoplay] : [])]}
              spaceBetween={30}
              slidesPerView={1}
              breakpoints={{
                640: { slidesPerView: 2, spaceBetween: 20 },
                1024: { slidesPerView: 3, spaceBetween: 30 },
              }}
              navigation={{ prevEl: prevRefDesktop.current, nextEl: nextRefDesktop.current }}
              pagination={{
                clickable: true,
                el: paginationRefDesktop.current,
                bulletClass: 'swiper-pagination-bullet',
                bulletActiveClass: 'swiper-pagination-bullet-active',
                renderBullet: function (index, className) {
                  return '<span class="' + className + '" style="margin: 0 4px;"></span>';
                }
              }}
              {...(design.autoAdvance ? { autoplay: {
                delay: (design.slideshowSpeed ?? 4) * 1000,
                disableOnInteraction: false,
              }} : {})}
              className="max-w-5xl w-full"
            >
              {reviews.map((review, index) => (
                <SwiperSlide key={review.id || index}>
                  <div className="flex flex-col items-center justify-between bg-white rounded-3xl w-full px-6 sm:px-6 py-6 shadow max-h-[320px] h-[320px] overflow-y-auto overflow-x-hidden mx-auto text-sm" style={{
                    background: design.bgColor === 'transparent' ? 'none' : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
                    color: design.textColor,
                    border: design.border ? `${design.borderWidth ?? 2}px solid ${design.borderColor ?? '#cccccc'}` : 'none',
                    borderRadius: design.borderRadius,
                    boxShadow: design.shadow ? `inset 0 4px 32px 0 ${hexToRgba(design.shadowColor ?? '#222222', design.shadowIntensity ?? 0.2)}` : 'none',
                  }}>
                    <div className="flex items-center justify-center mb-2 mt-1" style={{ minHeight: 36, width: '100%' }}>
                      {typeof review.star_rating === 'number' && !isNaN(review.star_rating) && renderStars(review.star_rating, 18)}
                    </div>
                    <div className="w-full text-center text-[14px] text-gray-800 mb-4 break-words whitespace-pre-line overflow-x-hidden relative overflow-visible pb-12" style={{ position: 'relative' }}>
                      {design.showQuotes && (
                        <span style={{
                          position: 'absolute',
                          left: '-24px',
                          top: '-32px',
                          fontSize: '64px',
                          color: lightenHex(design.accentColor, 0.7),
                          opacity: 0.3,
                          fontFamily: 'Georgia, Times, "Times New Roman", serif',
                          lineHeight: 1,
                          zIndex: 1,
                          transform: 'rotate(-5deg)',
                        }}>
                          "
                        </span>
                      )}
                      <p className="mb-8 text-[14px] text-center" style={{ color: design.textColor }}>
                        {review.review_content}
                      </p>
                      {design.showQuotes && (
                        <span style={{
                          position: 'absolute',
                          right: '-24px',
                          bottom: '-64px',
                          fontSize: '64px',
                          color: lightenHex(design.accentColor, 0.7),
                          opacity: 0.3,
                          fontFamily: 'Georgia, Times, "Times New Roman", serif',
                          lineHeight: 1,
                          zIndex: 1,
                          transform: 'rotate(5deg)',
                        }}>
                          "
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1 w-full mt-2 mb-8">
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
          <button
            ref={nextRefDesktop}
            className="rounded-full border border-gray-200 w-10 h-10 flex items-center justify-center transition z-10 hover:bg-opacity-80 active:scale-95 ml-4"
            aria-label="Next"
            style={{
              width: 40,
              height: 40,
              minWidth: 40,
              minHeight: 40,
              aspectRatio: '1 / 1',
              background: design.bgColor === 'transparent' ? 'rgba(255,255,255,0.4)' : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
              boxShadow: design.shadow ? `inset 0 0 8px 0 ${hexToRgba('#000', 0.18)}, inset 0 0 2px 0 ${hexToRgba('#fff', 0.12)}` : 'none',
              border: `1.5px solid ${hexToRgba('#888', 0.22)}`,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ display: 'block', margin: 'auto' }}>
              <polygon points="7.5,3 14.5,10 7.5,17" fill={design.accentColor || '#111'} />
            </svg>
          </button>
        </div>
        {/* Pagination dots below cards on desktop */}
        <div className="flex flex-row items-center justify-center w-full mt-12">
          <div ref={paginationRefDesktop} className="swiper-pagination" />
        </div>
      </div>
      {/* Mobile: Swiper with pagination and navigation below */}
      <div className="md:hidden w-full">
        <Swiper
          key={String(design.autoAdvance) + '-' + String(paginationReady)}
          onSwiper={setSwiperInstanceMobile}
          modules={[Navigation, Pagination, A11y, ...(design.autoAdvance ? [Autoplay] : [])]}
          spaceBetween={30}
          slidesPerView={1}
          navigation={{ prevEl: prevRefMobile.current, nextEl: nextRefMobile.current }}
          pagination={{
            clickable: true,
            el: paginationRefMobile.current,
            bulletClass: 'swiper-pagination-bullet',
            bulletActiveClass: 'swiper-pagination-bullet-active',
            renderBullet: function (index, className) {
              return '<span class="' + className + '" style="margin: 0 4px;"></span>';
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
              <div className="flex flex-col items-center justify-between bg-white rounded-3xl w-full px-6 py-6 shadow max-h-[320px] h-[320px] overflow-y-auto overflow-x-hidden mx-auto text-sm" style={{
                background: design.bgColor === 'transparent' ? 'none' : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
                color: design.textColor,
                border: design.border ? `${design.borderWidth ?? 2}px solid ${design.borderColor ?? '#cccccc'}` : 'none',
                borderRadius: design.borderRadius,
                boxShadow: design.shadow ? `inset 0 4px 32px 0 ${hexToRgba(design.shadowColor ?? '#222222', design.shadowIntensity ?? 0.2)}` : 'none',
              }}>
                <div className="flex items-center justify-center mb-2 mt-1" style={{ minHeight: 36, width: '100%' }}>
                  {typeof review.star_rating === 'number' && !isNaN(review.star_rating) && renderStars(review.star_rating, 18)}
                </div>
                <div className="w-full text-center text-[14px] text-gray-800 mb-4 break-words whitespace-pre-line overflow-x-hidden relative overflow-visible pb-12" style={{ position: 'relative' }}>
                  {design.showQuotes && (
                    <span style={{
                      position: 'absolute',
                      left: '-24px',
                      top: '-32px',
                      fontSize: '64px',
                      color: lightenHex(design.accentColor, 0.7),
                      opacity: 0.3,
                      fontFamily: 'Georgia, Times, "Times New Roman", serif',
                      lineHeight: 1,
                      zIndex: 1,
                      transform: 'rotate(-5deg)',
                    }}>
                      "
                    </span>
                  )}
                  <p className="mb-8 text-[14px] text-center" style={{ color: design.textColor }}>
                    {review.review_content}
                  </p>
                  {design.showQuotes && (
                    <span style={{
                      position: 'absolute',
                      right: '-24px',
                      bottom: '-64px',
                      fontSize: '64px',
                      color: lightenHex(design.accentColor, 0.7),
                      opacity: 0.3,
                      fontFamily: 'Georgia, Times, "Times New Roman", serif',
                      lineHeight: 1,
                      zIndex: 1,
                      transform: 'rotate(5deg)',
                    }}>
                      "
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-center gap-1 w-full mt-2 mb-8">
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
        {/* Pagination dots below cards on mobile */}
        <div ref={paginationRefMobile} className="swiper-pagination" />
        {/* Navigation buttons */}
        <div className="flex flex-row items-center justify-between w-full px-4" style={{ marginTop: 24 }}>
          <button
            ref={prevRefMobile}
            className="rounded-full border border-gray-200 w-10 h-10 min-w-10 min-h-10 flex items-center justify-center transition z-10 hover:bg-opacity-80 active:scale-95 flex-shrink-0"
            aria-label="Previous"
            style={{
              background: design.bgColor === 'transparent' ? 'rgba(255,255,255,0.4)' : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
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
              background: design.bgColor === 'transparent' ? 'rgba(255,255,255,0.4)' : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
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
  );
};

// SingleWidget implementation
const SingleWidget: React.FC<{ data: WidgetData }> = ({ data }) => {
  const design = getDesignWithDefaults(data.design);
  const { reviews } = data;
  // Debug output
  console.log('[SingleWidget] Rendered', { reviews, data });
  React.useEffect(() => {
    console.log('[SingleWidget] Rendering mobile Swiper', { reviews });
  }, [reviews]);
  // Desktop refs and state
  const prevRefDesktop = React.useRef(null);
  const nextRefDesktop = React.useRef(null);
  const paginationRefDesktop = React.useRef(null);
  const [swiperInstanceDesktop, setSwiperInstanceDesktop] = React.useState<any>(null);
  // Mobile refs and state
  const prevRefMobile = React.useRef(null);
  const nextRefMobile = React.useRef(null);
  const paginationRefMobile = React.useRef(null);
  const [swiperInstanceMobile, setSwiperInstanceMobile] = React.useState<any>(null);
  const [paginationReady, setPaginationReady] = React.useState(false);
  const [submitHover, setSubmitHover] = useState(false);

  React.useEffect(() => { setPaginationReady(true); }, []);

  // Desktop navigation/pagination
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

  // Mobile navigation/pagination
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

  return (
    <>
      <style>{styles}</style>
      <div className="flex flex-col items-center px-4" style={{ '--pr-accent-color': design.accentColor } as React.CSSProperties}>
        <div className="flex flex-col items-center w-full max-w-4xl px-4">
          <div className="flex flex-col items-center w-full justify-center relative">
            {/* Desktop: arrows and Swiper in a row */}
            <div className="hidden md:flex flex-row items-center justify-center w-full mt-2">
              <div className="flex items-center justify-center flex-shrink-0 mr-4">
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
                      return '<span class="' + className + '"></span>';
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
                      <div className="w-full max-w-full" style={{ position: 'relative', height: '100%' }}>
                        <article
                          className="flex flex-col sm:flex-row items-stretch bg-white rounded-3xl w-full px-0 md:px-0 justify-center flex-1 sm:h-[440px] overflow-hidden relative"
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
                          <div className="flex flex-col justify-between h-full items-center flex-1 px-8 py-4">
                            {/* Stars at the very top of the card */}
                            <div className="flex items-center justify-center mb-2 mt-4" style={{ minHeight: 36, width: '100%' }}>
                              {renderStars(review.star_rating, 20)}
                            </div>
                            {/* Review content and quotes */}
                            <div className="flex flex-col items-center justify-center w-full min-h-[120px] sm:min-h-[180px] pb-12" style={{ position: 'relative' }}>
                              <div className="w-full text-center text-[18px] text-gray-800 mb-4 break-words whitespace-pre-line overflow-x-hidden relative overflow-visible" style={{ position: 'relative' }}>
                                {design.showQuotes && (
                                  <span style={{
                                    position: 'absolute',
                                    left: '-24px',
                                    top: '-32px',
                                    fontSize: '64px',
                                    color: lightenHex(design.accentColor, 0.7),
                                    opacity: 0.3,
                                    fontFamily: 'Georgia, Times, "Times New Roman", serif',
                                    lineHeight: 1,
                                    zIndex: 1,
                                    transform: 'rotate(-5deg)',
                                  }}>
                                    "
                                  </span>
                                )}
                                <p className="mb-8 text-[18px] text-center" style={{ color: design.textColor }}>
                                  {review.review_content}
                                </p>
                                {design.showQuotes && (
                                  <span style={{
                                    position: 'absolute',
                                    right: '-24px',
                                    bottom: '-64px',
                                    fontSize: '64px',
                                    color: lightenHex(design.accentColor, 0.7),
                                    opacity: 0.3,
                                    fontFamily: 'Georgia, Times, "Times New Roman", serif',
                                    lineHeight: 1,
                                    zIndex: 1,
                                    transform: 'rotate(5deg)',
                                  }}>
                                    "
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
                  <div ref={paginationRefDesktop} className="swiper-pagination flex-1" />
                </Swiper>
              </div>
              <div className="flex items-center justify-center flex-shrink-0 ml-4">
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
          </div>
        </div>
        {design.showSubmitReviewButton && data.universalPromptSlug && (
          <div className="w-full max-w-4xl flex justify-end mt-6">
            <a
              href={`/r/${data.universalPromptSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                border: `1.5px solid ${hexToRgba('#888', 0.22)}`,
                background: cardBg,
                color: accent,
                borderRadius: design.borderRadius,
                padding: '8px 20px',
                fontWeight: 500,
                fontSize: 15,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
                boxShadow: design.shadow ? `inset 0 0 8px 0 ${hexToRgba('#000', 0.18)}, inset 0 0 2px 0 ${hexToRgba('#fff', 0.12)}` : 'none',
              }}
              onMouseEnter={() => setSubmitHover(true)}
              onMouseLeave={() => setSubmitHover(false)}
            >
              Submit a review
            </a>
          </div>
        )}
        {/* Mobile: Swiper with pagination and navigation below */}
        <div className="md:hidden w-full">
          <Swiper
            key={String(design.autoAdvance) + '-' + String(paginationReady)}
            onSwiper={setSwiperInstanceMobile}
            modules={[Navigation, Pagination, A11y, ...(design.autoAdvance ? [Autoplay] : [])]}
            spaceBetween={30}
            slidesPerView={1}
            navigation={{ prevEl: prevRefMobile.current, nextEl: nextRefMobile.current }}
            pagination={{
              clickable: true,
              el: paginationRefMobile.current,
              bulletClass: 'swiper-pagination-bullet',
              bulletActiveClass: 'swiper-pagination-bullet-active',
              renderBullet: function (index, className) {
                return '<span class="' + className + '"></span>';
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
                  <article
                    className="flex flex-col items-stretch bg-white rounded-3xl w-full px-0 justify-center flex-1 h-[420px] overflow-hidden relative"
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
                    <div className="flex flex-col justify-between h-full items-center flex-1 px-4 py-4">
                      <div className="flex items-center justify-center mb-2 mt-4" style={{ minHeight: 36, width: '100%' }}>
                        {renderStars(review.star_rating, 20)}
                      </div>
                      <div className="flex flex-col items-center justify-center w-full min-h-[120px] pb-12" style={{ position: 'relative' }}>
                        <div className="w-full text-center text-[18px] text-gray-800 mb-4 break-words whitespace-pre-line overflow-x-hidden relative overflow-visible" style={{ position: 'relative' }}>
                          {design.showQuotes && (
                            <span style={{
                              position: 'absolute',
                              left: '-24px',
                              top: '-32px',
                              fontSize: '64px',
                              color: lightenHex(design.accentColor, 0.7),
                              opacity: 0.3,
                              fontFamily: 'Georgia, Times, \"Times New Roman\", serif',
                              lineHeight: 1,
                              zIndex: 1,
                              transform: 'rotate(-5deg)',
                            }}>
                              "
                            </span>
                          )}
                          <p className="mb-8 text-[18px] text-center" style={{ color: design.textColor }}>
                            {review.review_content}
                          </p>
                          {design.showQuotes && (
                            <span style={{
                              position: 'absolute',
                              right: '-24px',
                              bottom: '-64px',
                              fontSize: '64px',
                              color: lightenHex(design.accentColor, 0.7),
                              opacity: 0.3,
                              fontFamily: 'Georgia, Times, \"Times New Roman\", serif',
                              lineHeight: 1,
                              zIndex: 1,
                              transform: 'rotate(5deg)',
                            }}>
                              "
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
          {/* Pagination dots below cards on mobile */}
          <div ref={paginationRefMobile} className="swiper-pagination" />
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
    </>
  );
};
// COPY END: Single
// PhotoWidget implementation
// COPY START: PhotoWidget
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
                      return '<span class="' + className + '"></span>';
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
                              <div className="w-full text-center text-[18px] text-gray-800 mb-4 break-words whitespace-pre-line overflow-x-hidden relative overflow-visible" style={{ position: 'relative' }}>
                                {design.showQuotes && (
                                  <span style={{
                                    position: 'absolute',
                                    left: '-24px',
                                    top: '-32px',
                                    fontSize: '64px',
                                    color: lightenHex(design.accentColor, 0.7),
                                    opacity: 0.3,
                                    fontFamily: 'Georgia, Times, "Times New Roman", serif',
                                    lineHeight: 1,
                                    zIndex: 1,
                                    transform: 'rotate(-5deg)',
                                  }}>
                                    "
                                  </span>
                                )}
                                <p className="mb-8 text-[18px] text-center" style={{ color: design.textColor }}>
                                  {review.review_content}
                                </p>
                                {design.showQuotes && (
                                  <span style={{
                                    position: 'absolute',
                                    right: '-24px',
                                    bottom: '-64px',
                                    fontSize: '64px',
                                    color: lightenHex(design.accentColor, 0.7),
                                    opacity: 0.3,
                                    fontFamily: 'Georgia, Times, "Times New Roman", serif',
                                    lineHeight: 1,
                                    zIndex: 1,
                                    transform: 'rotate(5deg)',
                                  }}>
                                    "
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
                  <div ref={paginationRefDesktop} className="swiper-pagination flex-1" />
                </Swiper>
              </div>
              <div className="flex items-center justify-center flex-shrink-0 ml-4">
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

            {/* Mobile: Swiper with pagination and navigation below */}
            <div className="sm:hidden w-full relative" style={{ minHeight: 420 }}>
              {/* Pagination element */}
              <div className="absolute left-0 right-0 flex justify-center" style={{ bottom: 20, zIndex: 10 }}>
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
                    return '<span class="' + className + '"></span>';
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
                      <article
                        className="flex flex-col items-stretch bg-white rounded-3xl w-full px-0 justify-center flex-1 h-[420px] overflow-hidden relative"
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
                        <div className="flex flex-col justify-between h-full items-center flex-1 px-4 py-4">
                          <div className="flex items-center justify-center mb-2 mt-4" style={{ minHeight: 36, width: '100%' }}>
                            {renderStars(review.star_rating, 20)}
                          </div>
                          <div className="flex flex-col items-center justify-center w-full min-h-[120px] pb-12" style={{ position: 'relative' }}>
                            <div className="w-full text-center text-[18px] text-gray-800 mb-4 break-words whitespace-pre-line overflow-x-hidden relative overflow-visible" style={{ position: 'relative' }}>
                              {design.showQuotes && (
                                <span style={{
                                  position: 'absolute',
                                  left: '-24px',
                                  top: '-32px',
                                  fontSize: '64px',
                                  color: lightenHex(design.accentColor, 0.7),
                                  opacity: 0.3,
                                  fontFamily: 'Georgia, Times, \"Times New Roman\", serif',
                                  lineHeight: 1,
                                  zIndex: 1,
                                  transform: 'rotate(-5deg)',
                                }}>
                                  "
                                </span>
                              )}
                              <p className="mb-8 text-[18px] text-center" style={{ color: design.textColor }}>
                                {review.review_content}
                              </p>
                              {design.showQuotes && (
                                <span style={{
                                  position: 'absolute',
                                  right: '-24px',
                                  bottom: '-64px',
                                  fontSize: '64px',
                                  color: lightenHex(design.accentColor, 0.7),
                                  opacity: 0.3,
                                  fontFamily: 'Georgia, Times, \"Times New Roman\", serif',
                                  lineHeight: 1,
                                  zIndex: 1,
                                  transform: 'rotate(5deg)',
                                }}>
                                  "
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
  // COPY END: PhotoWidget
};

export { MultiWidget, SingleWidget, PhotoWidget, getDesignWithDefaults, hexToRgba, getRelativeTime, renderStars, lightenHex, injectWidgetResponsiveCSS, injectWidgetNavCSS }; 