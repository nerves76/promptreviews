import React, { useRef } from 'react';
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
  showQuotes: false,
  showRelativeDate: false,
  showGrid: false,
  width: 1000,
  sectionBgType: "none",
  sectionBgColor: "#ffffff",
  shadowIntensity: 0.2,
  shadowColor: "#222222",
  borderColor: "#cccccc",
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
function renderStars(rating: number) {
  if (typeof rating !== 'number' || isNaN(rating)) return null;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const full = i <= Math.floor(rating);
    const half = !full && i - 0.5 <= rating;
    const gradientId = `half-star-gradient-${i}-${Math.random()}`;
    stars.push(
      <svg
        key={i}
        width="16"
        height="16"
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
      .pr-widget-card { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 24px 16px; position: relative; min-height: 320px; max-height: 320px; height: auto; overflow: hidden; }
      .pr-widget-photo-card { display: flex; flex-direction: column; align-items: stretch; min-height: 320px; max-height: 320px; height: 320px; overflow: hidden; }
      .pr-widget-photo-img { display: flex; align-items: center; justify-content: center; background-color: #f3f4f6; overflow: hidden; width: 100%; min-width: 200px; height: 192px; }
      .pr-widget-photo-content { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 16px; }
      @media (min-width: 640px) {
        .pr-widget-photo-card { flex-direction: row; height: 320px; }
        .pr-widget-photo-img { width: 33.333333%; height: 100%; }
        .pr-widget-photo-content { padding: 32px; }
      }
      .pr-widget-stars { display: flex; align-items: center; justify-content: center; margin-bottom: 8px; margin-top: 4px; }
      .pr-widget-review-body { margin-bottom: 16px; padding: 0 8px; text-align: center; }
      .pr-widget-photo-body { margin-bottom: 16px; padding: 0 8px; text-align: left; }
      .pr-widget-author { display: flex; flex-direction: column; align-items: center; gap: 4px; width: 100%; margin-top: auto; }
      .pr-widget-photo-author { align-items: flex-start; }
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
    `;
    document.head.appendChild(style);
  }
}

// Entry point
async function init() {
  const container = document.getElementById('promptreviews-widget');
  if (!container) {
    console.error('Widget container not found');
    return;
  }

  // Set container styles
  container.classList.add('pr-widget-root');
  container.style.width = '100%';
  container.style.maxWidth = '1200px';
  container.style.margin = '0 auto';
  container.style.position = 'relative';

  // Wait for CSS to load
  await injectSwiperCSS();
  injectSwiperNavCSS();
  injectWidgetResponsiveCSS();
  injectWidgetNavCSS();

  const widgetId = container.getAttribute('data-widget');
  if (!widgetId) {
    console.error('Widget ID not found');
    return;
  }

  const data = await fetchWidgetData(widgetId);
  if (!data) {
    console.error('Failed to fetch widget data');
    return;
  }

  ReactDOM.createRoot(container).render(<WidgetRenderer data={data} />);
}

// Start the widget
init(); 

const MultiWidget: React.FC<{ data: WidgetData }> = ({ data }) => {
  const design = getDesignWithDefaults(data.design);
  const { reviews } = data;
  const prevRef = React.useRef<HTMLButtonElement>(null);
  const nextRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => { injectWidgetNavCSS(); }, []);
  return (
    <>
      <div className="pr-widget-nav-row">
        <button ref={prevRef} className="pr-widget-nav-btn" aria-label="Previous">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <polygon points="15,4 5,10 15,16" />
          </svg>
        </button>
        <div className="pr-widget-nav-center">
          <Swiper
            modules={[Navigation, Pagination, A11y, Autoplay]}
            spaceBetween={30}
            slidesPerView={3}
            navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
            pagination={{ clickable: true, el: '.pr-widget-pagination' }}
            autoplay={design.autoAdvance ? {
              delay: (design.slideshowSpeed ?? 4) * 1000,
              disableOnInteraction: false,
            } : false}
            breakpoints={{
              320: { slidesPerView: 1, spaceBetween: 20 },
              640: { slidesPerView: 2, spaceBetween: 20 },
              1024: { slidesPerView: 3, spaceBetween: 30 },
            }}
            style={{ maxWidth: '1000px', width: '100%' }}
            onInit={(swiper) => {
              // @ts-ignore
              swiper.params.navigation.prevEl = prevRef.current;
              // @ts-ignore
              swiper.params.navigation.nextEl = nextRef.current;
              swiper.navigation.init();
              swiper.navigation.update();
            }}
          >
            {reviews.map((review, index) => (
              <SwiperSlide key={review.id || index}>
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <article
                    className="pr-widget-card"
                    style={{
                      background: design.bgColor === 'transparent' ? 'none' : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
                      color: design.textColor,
                      border: design.border ? `${design.borderWidth ?? 2}px solid ${design.borderColor ?? '#cccccc'}` : 'none',
                      borderRadius: `${design.borderRadius}px`,
                      boxShadow: design.shadow ? `inset 0 4px 32px 0 ${hexToRgba(design.shadowColor ?? '#222222', design.shadowIntensity ?? 0.2)}` : 'none',
                    }}
                    itemScope
                    itemType="https://schema.org/Review"
                  >
                    <div className="pr-widget-stars">
                      {typeof review.star_rating === 'number' && renderStars(review.star_rating)}
                    </div>
                    <p
                      className="pr-widget-review-body"
                      style={{ fontSize: '14px', lineHeight: design.lineSpacing, color: design.bodyTextColor }}
                      itemProp="reviewBody"
                    >
                      {review.review_content}
                    </p>
                    <div className="pr-widget-author">
                      <span style={{ fontWeight: '600', fontSize: `${design.attributionFontSize * 0.85}px`, color: design.nameTextColor }} itemProp="author" itemScope itemType="https://schema.org/Person">
                        <span itemProp="name">{review.first_name} {review.last_name}</span>
                      </span>
                      <span style={{ fontSize: `${design.attributionFontSize * 0.85}px`, color: design.roleTextColor }} itemProp="author" itemScope itemType="https://schema.org/Person">
                        <span itemProp="jobTitle">{review.reviewer_role}</span>
                      </span>
                      {review.created_at && (
                        <span style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                          {getRelativeTime(review.created_at)}
                          {review.platform ? ` via ${review.platform}` : ''}
                        </span>
                      )}
                    </div>
                  </article>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        <button ref={nextRef} className="pr-widget-nav-btn" aria-label="Next">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <polygon points="5,4 15,10 5,16" />
          </svg>
        </button>
      </div>
      <div className="pr-widget-pagination" />
    </>
  );
};

const SingleWidget: React.FC<{ data: WidgetData }> = ({ data }) => {
  const design = getDesignWithDefaults(data.design);
  const { reviews } = data;
  const prevRef = React.useRef<HTMLButtonElement>(null);
  const nextRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => { injectWidgetNavCSS(); }, []);
  return (
    <>
      <div className="pr-widget-nav-row">
        <button ref={prevRef} className="pr-widget-nav-btn" aria-label="Previous">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <polygon points="15,4 5,10 15,16" />
          </svg>
        </button>
        <div className="pr-widget-nav-center">
          <Swiper
            modules={[Navigation, Pagination, A11y, Autoplay]}
            spaceBetween={30}
            slidesPerView={1}
            navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
            pagination={{ clickable: true, el: '.pr-widget-pagination' }}
            autoplay={design.autoAdvance ? {
              delay: (design.slideshowSpeed ?? 4) * 1000,
              disableOnInteraction: false,
            } : false}
            style={{ maxWidth: '800px', width: '100%' }}
            onInit={(swiper) => {
              // @ts-ignore
              swiper.params.navigation.prevEl = prevRef.current;
              // @ts-ignore
              swiper.params.navigation.nextEl = nextRef.current;
              swiper.navigation.init();
              swiper.navigation.update();
            }}
          >
            {reviews.map((review, index) => (
              <SwiperSlide key={review.id || index}>
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <article
                    className="pr-widget-card"
                    style={{
                      background: design.bgColor === 'transparent' ? 'none' : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
                      color: design.textColor,
                      border: design.border ? `${design.borderWidth ?? 2}px solid ${design.borderColor ?? '#cccccc'}` : 'none',
                      borderRadius: `${design.borderRadius}px`,
                      boxShadow: design.shadow ? `inset 0 4px 32px 0 ${hexToRgba(design.shadowColor ?? '#222222', design.shadowIntensity ?? 0.2)}` : 'none',
                    }}
                    itemScope
                    itemType="https://schema.org/Review"
                  >
                    {design.showQuotes && (
                      <>
                        <span
                          style={{
                            position: 'absolute',
                            left: '16px',
                            top: '16px',
                            zIndex: 0,
                            pointerEvents: 'none',
                            width: '96px',
                            height: '96px',
                            opacity: 0.5
                          }}
                        >
                          <svg
                            width="96"
                            height="96"
                            viewBox="0 0 96 96"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{ display: 'block' }}
                          >
                            <text
                              y="76"
                              fontSize="96"
                              fill={lightenHex(design.accentColor, 0.7)}
                              fontFamily="serif"
                            >
                              {'\u201C'}
                            </text>
                          </svg>
                        </span>
                        <span
                          style={{
                            position: 'absolute',
                            right: '16px',
                            bottom: '16px',
                            zIndex: 0,
                            pointerEvents: 'none',
                            width: '96px',
                            height: '96px',
                            opacity: 0.5
                          }}
                        >
                          <svg
                            width="96"
                            height="96"
                            viewBox="0 0 96 96"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{ display: 'block' }}
                          >
                            <text
                              y="76"
                              fontSize="96"
                              fill={lightenHex(design.accentColor, 0.7)}
                              fontFamily="serif"
                            >
                              {'\u201D'}
                            </text>
                          </svg>
                        </span>
                      </>
                    )}
                    <div className="pr-widget-stars">
                      {typeof review.star_rating === 'number' && renderStars(review.star_rating)}
                    </div>
                    <p
                      className="pr-widget-review-body"
                      style={{
                        fontSize: `${design.quoteFontSize}px`,
                        lineHeight: design.lineSpacing,
                        color: design.bodyTextColor,
                      }}
                      itemProp="reviewBody"
                    >
                      {review.review_content}
                    </p>
                    <div className="pr-widget-author">
                      <span
                        style={{ 
                          fontWeight: '600',
                          fontSize: `${design.attributionFontSize}px`,
                          color: design.nameTextColor
                        }}
                        itemProp="author"
                        itemScope
                        itemType="https://schema.org/Person"
                      >
                        <span itemProp="name">
                          {review.first_name} {review.last_name}
                        </span>
                      </span>
                      <span
                        style={{ 
                          fontSize: `${design.attributionFontSize * 0.85}px`,
                          color: design.roleTextColor
                        }}
                        itemProp="author"
                        itemScope
                        itemType="https://schema.org/Person"
                      >
                        <span itemProp="jobTitle">
                          {review.reviewer_role}
                        </span>
                      </span>
                      {review.created_at && (
                        <span style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                          {getRelativeTime(review.created_at)}
                          {review.platform ? ` via ${review.platform}` : ''}
                        </span>
                      )}
                    </div>
                  </article>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        <div className="pr-widget-pagination" />
      </div>
    </>
  );
};

const PhotoWidget: React.FC<{ data: WidgetData }> = ({ data }) => {
  const design = getDesignWithDefaults(data.design);
  const { reviews } = data;
  const prevRef = React.useRef<HTMLButtonElement>(null);
  const nextRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => { injectWidgetNavCSS(); }, []);
  return (
    <>
      <div className="pr-widget-nav-row">
        <button ref={prevRef} className="pr-widget-nav-btn" aria-label="Previous">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <polygon points="15,4 5,10 15,16" />
          </svg>
        </button>
        <div className="pr-widget-nav-center">
          <Swiper
            modules={[Navigation, Pagination, A11y, Autoplay]}
            spaceBetween={30}
            slidesPerView={1}
            navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
            pagination={{ clickable: true, el: '.pr-widget-pagination' }}
            autoplay={design.autoAdvance ? {
              delay: (design.slideshowSpeed ?? 4) * 1000,
              disableOnInteraction: false,
            } : false}
            style={{ maxWidth: '800px', width: '100%' }}
            onInit={(swiper) => {
              // @ts-ignore
              swiper.params.navigation.prevEl = prevRef.current;
              // @ts-ignore
              swiper.params.navigation.nextEl = nextRef.current;
              swiper.navigation.init();
              swiper.navigation.update();
            }}
          >
            {reviews.map((review, index) => (
              <SwiperSlide key={review.id || index}>
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <article
                    className="pr-widget-photo-card"
                    style={{
                      background: design.bgColor === 'transparent' ? 'none' : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
                      color: design.textColor,
                      border: design.border ? `${design.borderWidth ?? 2}px solid ${design.borderColor ?? '#cccccc'}` : 'none',
                      borderRadius: `${design.borderRadius}px`,
                      boxShadow: design.shadow ? `inset 0 4px 32px 0 ${hexToRgba(design.shadowColor ?? '#222222', design.shadowIntensity ?? 0.2)}` : 'none',
                    }}
                    itemScope
                    itemType="https://schema.org/Review"
                  >
                    <div className="pr-widget-photo-img">
                      {review.photo_url ? (
                        <img
                          src={review.photo_url}
                          alt="Reviewer photo"
                          style={{
                            objectFit: 'cover',
                            width: '100%',
                            height: '100%',
                            display: 'block'
                          }}
                        />
                      ) : (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%',
                          color: '#9ca3af',
                          backgroundColor: '#f3f4f6'
                        }}>
                          No Photo
                        </div>
                      )}
                    </div>
                    <div className="pr-widget-photo-content">
                      <p
                        className="pr-widget-photo-body"
                        style={{
                          fontSize: '16px',
                          marginBottom: '16px',
                          padding: '0 8px',
                          textAlign: 'left',
                          lineHeight: design.lineSpacing,
                          color: design.bodyTextColor,
                        }}
                        itemProp="reviewBody"
                      >
                        {review.review_content}
                      </p>
                      <div className="pr-widget-author pr-widget-photo-author">
                        <span
                          style={{ 
                            fontWeight: '600',
                            fontSize: `${design.attributionFontSize}px`,
                            color: design.nameTextColor
                          }}
                          itemProp="author"
                          itemScope
                          itemType="https://schema.org/Person"
                        >
                          <span itemProp="name">
                            {review.first_name} {review.last_name}
                          </span>
                        </span>
                        <span
                          style={{ 
                            fontSize: `${design.attributionFontSize * 0.85}px`,
                            color: design.roleTextColor
                          }}
                          itemProp="author"
                          itemScope
                          itemType="https://schema.org/Person"
                        >
                          <span itemProp="jobTitle">
                            {review.reviewer_role}
                          </span>
                        </span>
                        {review.created_at && (
                          <span style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                            {getRelativeTime(review.created_at)}
                            {review.platform ? ` via ${review.platform}` : ''}
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
        <div className="pr-widget-pagination" />
      </div>
    </>
  );
}; 