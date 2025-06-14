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

// --- PhotoWidget component ---
// (Paste the full PhotoWidget component here)

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
      {/* ...full PhotoWidget JSX as provided... */}
    </>
  );
};

export default PhotoWidget; 