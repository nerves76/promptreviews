"use client";
import React, { useState, useRef, useEffect } from "react";
import { FaChevronLeft, FaChevronRight, FaCopy, FaCode } from "react-icons/fa";
import { MdArrowBack, MdArrowForward } from "react-icons/md";
import WidgetList from "./WidgetList";
import { createBrowserClient } from "@supabase/ssr";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, A11y, Autoplay } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import PageCard from "@/app/components/PageCard";
import AppLoader from "@/app/components/AppLoader";
import TopLoaderOverlay from "@/app/components/TopLoaderOverlay";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Helper to convert hex to rgba
function hexToRgba(hex: string, alpha: number) {
  let c = hex.replace("#", "");
  if (c.length === 3)
    c = c
      .split("")
      .map((x) => x + x)
      .join("");
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

// Helper to lighten a hex color by blending with white
function lightenHex(hex: string, amount: number = 0.7) {
  let c = hex.replace("#", "");
  if (c.length === 3)
    c = c
      .split("")
      .map((x) => x + x)
      .join("");
  const num = parseInt(c, 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;
  r = Math.round(r + (255 - r) * amount);
  g = Math.round(g + (255 - g) * amount);
  b = Math.round(b + (255 - b) * amount);
  return `rgb(${r},${g},${b})`;
}

// Helper to get relative time string
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

export default function WidgetPage() {
  const [current, setCurrent] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const [copied, setCopied] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [selectedWidget, setSelectedWidget] = useState<any>(null);
  const [widgetReviews, setWidgetReviews] = useState<any[]>([]);
  const [loadingWidget, setLoadingWidget] = useState(false);
  const [design, setDesign] = useState({
    bgColor: "#ffffff",
    textColor: "#22223b",
    accentColor: "slateblue",
    fontSize: 16,
    borderRadius: 16,
    shadow: true,
    bgOpacity: 1,
    autoAdvance: true,
    slideshowSpeed: 4,
    border: true,
    borderWidth: 2,
    lineSpacing: 1.5,
    showQuotes: true,
    quoteFontSize: 16,
    attributionFontSize: 16,
    showRelativeDate: true,
    showGrid: false,
    bodyTextColor: "#22223b",
    nameTextColor: "#22223b",
    roleTextColor: "#22223b",
    sectionBgType: "inherit",
    sectionBgColor: "#ffffff",
    shadowIntensity: 0.2,
    shadowColor: "#222222",
    borderColor: "#cccccc",
  });
  const [currentGroup, setCurrentGroup] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [widgets, setWidgets] = useState<any[]>([]);

  useEffect(() => setIsClient(true), []);

  // Fetch widgets
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    supabase
      .from("widgets")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (data) {
          setWidgets(data);
          // Select first widget if none is selected
          if (!selectedWidget && data.length > 0) {
            setSelectedWidget(data[0]);
          }
        }
        setLoading(false);
      });
  }, []);

  // Select first widget by default
  useEffect(() => {
    if (!selectedWidget && widgets?.length > 0) {
      setSelectedWidget(widgets[0]);
    }
  }, [widgets, selectedWidget]);

  // Fetch reviews for selected widget
  useEffect(() => {
    if (!selectedWidget) return;
    setLoadingWidget(true);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    supabase
      .from("widget_reviews")
      .select(
        "id, review_content, first_name, last_name, reviewer_role, platform, created_at, order_index, star_rating, photo_url",
      )
      .eq("widget_id", selectedWidget.id)
      .order("order_index", { ascending: true })
      .then(({ data, error }) => {
        if (data) setReviews(data);
        setLoadingWidget(false);
      });
  }, [selectedWidget]);

  useEffect(() => {
    if (selectedWidget) return;
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    supabase
      .from("review_submissions")
      .select(
        "id, review_content, reviewer_name, reviewer_role, platform, created_at",
      )
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (data) setReviews(data);
        setLoading(false);
      });
  }, [selectedWidget]);

  useEffect(() => {
    setReviews([]);
  }, [selectedWidget]);

  // Auto-advance logic
  useEffect(() => {
    if (!design.autoAdvance || reviews.length <= 1) return;
    if (current >= reviews.length - 1) return; // Stop at last card
    const timer = setTimeout(
      () => {
        setCurrent((prev) => prev + 1);
      },
      (design.slideshowSpeed ?? 4) * 1000,
    );
    return () => clearTimeout(timer);
  }, [current, design.autoAdvance, design.slideshowSpeed, reviews.length]);

  // Fade-in effect on review change
  useEffect(() => {
    setFadeIn(false);
    const t = setTimeout(() => setFadeIn(true), 30);
    return () => clearTimeout(t);
  }, [current]);

  const embedCode = `<div id="promptreviews-widget" data-client="YOUR_CLIENT_ID"></div>\n<script src="https://yourdomain.com/widget.js" async></script>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
    } catch (err) {
      alert("Could not copy to clipboard. Please copy manually.");
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Schema.org JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "PromptReviews",
    review: reviews.map((r) => ({
      "@type": "Review",
      reviewBody: r.review_content,
      author: {
        "@type": "Person",
        name: r.first_name + " " + r.last_name,
        jobTitle: r.reviewer_role,
      },
    })),
  };

  // Group reviews into sets of 3 for grid mode
  const reviewGroups = [];
  for (let i = 0; i < reviews.length; i += 3) {
    reviewGroups.push(reviews.slice(i, i + 3));
  }

  useEffect(() => {
    const styleId = 'custom-swiper-dot-style';
    let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = `.my-custom-swiper-pagination .swiper-pagination-bullet-active { background: ${design.bgColor} !important; }`;
    return () => {
      if (styleTag) styleTag.remove();
    };
  }, [design.bgColor]);

  if (loading) {
    return <TopLoaderOverlay />;
  }

  if (!isClient) return null;

  return (
    <>
      {/* Widget Preview on Gradient */}
      <div
        className="w-full max-w-full mx-auto mb-12 mt-10 px-2 sm:px-0"
        style={{
          boxSizing: 'border-box',
          minHeight: 400,
          background: design.sectionBgType === 'custom'
            ? design.sectionBgColor
            : 'none',
          transition: 'background 0.3s',
        }}
      >
        <h2 className="text-2xl font-bold text-white mb-4 text-center">
          Live widget preview
        </h2>
        <section
          className="flex flex-col justify-center relative bg-transparent"
          aria-label="Review carousel preview"
          style={{
            background: design.sectionBgType === "custom" ? design.sectionBgColor : "none",
            color: design.textColor,
            border: 'none',
            boxShadow: 'none',
            padding: 0,
            minHeight: 320,
            margin: '0 auto',
          }}
        >
          {loading ? (
            <div
              style={{
                position: "fixed",
                top: -190,
                left: 0,
                width: "100%",
                zIndex: 9999,
              }}
            >
              <AppLoader />
            </div>
          ) : selectedWidget?.widget_type === 'photo' ? (
            <Swiper
              modules={[Navigation, Pagination, A11y, Autoplay]}
              spaceBetween={30}
              slidesPerView={1}
              navigation={{
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
              }}
              pagination={{
                clickable: true,
                el: '.my-custom-swiper-pagination',
              }}
              autoplay={design.autoAdvance ? {
                delay: (design.slideshowSpeed ?? 4) * 1000,
                disableOnInteraction: false,
              } : false}
              onSwiper={setSwiperInstance}
              className="max-w-3xl w-full"
            >
              {reviews.map((review, index) => (
                <SwiperSlide key={review.id || index}>
                  <div style={{ position: 'relative', width: '100%', height: '100%' }} className="h-full">
                    <article
                      className="flex flex-col sm:flex-row items-stretch h-auto sm:h-[320px] bg-white rounded-3xl w-full px-0 md:px-0 justify-center flex-1 shadow"
                      style={{
                        background:
                          design.bgColor === "transparent"
                            ? "none"
                            : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
                        color: design.textColor,
                        minHeight: 320,
                        maxHeight: 320,
                        height: 320,
                        border: design.border ? `${design.borderWidth ?? 2}px solid ${design.borderColor ?? '#cccccc'}` : "none",
                        borderRadius: design.borderRadius,
                        boxShadow: design.shadow ? `inset 0 4px 32px 0 ${hexToRgba(design.shadowColor ?? '#222222', design.shadowIntensity ?? 0.2)}` : 'none',
                        overflow: 'hidden',
                      }}
                      itemScope
                      itemType="https://schema.org/Review"
                    >
                      <div className="flex items-center justify-center bg-gray-100 overflow-hidden w-full sm:w-1/3 min-w-[200px] h-48 sm:h-full">
                        {review.photo_url ? (
                          <img
                            src={review.photo_url}
                            alt="Reviewer photo"
                            className="object-cover w-full h-full"
                            style={{ display: 'block' }}
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-gray-400 bg-gray-100">
                            No Photo
                          </div>
                        )}
                      </div>
                      {/* Testimonial on right (or below on mobile) */}
                      <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 py-4">
                        <p
                          className="text-base md:text-lg mb-2 md:mb-4 px-1 md:px-2 text-left"
                          itemProp="reviewBody"
                          style={{
                            lineHeight: design.lineSpacing,
                            color: design.bodyTextColor,
                          }}
                        >
                          {review.review_content}
                        </p>
                        <div className="flex flex-col items-start gap-1 w-full mt-auto">
                          <span
                            className="font-semibold text-indigo-700"
                            itemProp="author"
                            itemScope
                            itemType="https://schema.org/Person"
                            style={{ fontSize: design.attributionFontSize, color: design.nameTextColor }}
                          >
                            <span itemProp="name">
                              {review.first_name} {review.last_name}
                            </span>
                          </span>
                          <span
                            className="text-xs text-gray-500"
                            itemProp="author"
                            itemScope
                            itemType="https://schema.org/Person"
                            style={{ fontSize: design.attributionFontSize * 0.85, color: design.roleTextColor }}
                          >
                            <span itemProp="jobTitle">
                              {review.reviewer_role}
                            </span>
                          </span>
                          {design.showRelativeDate &&
                            review.created_at &&
                            review.platform && (
                              <span className="text-xs text-gray-400 mt-1">
                                {getRelativeTime(review.created_at)} via {review.platform}
                              </span>
                            )}
                        </div>
                      </div>
                    </article>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : selectedWidget?.widget_type === 'single' ? (
            <>
              <div className="flex flex-col items-center">
                <div className="flex flex-row items-center justify-center gap-8 px-8 md:px-16 w-full max-w-5xl mx-auto">
                  <button
                    type="button"
                    onClick={() => swiperInstance?.slidePrev()}
                    className="rounded-full bg-white/60 backdrop-blur border border-gray-200 w-10 h-10 flex items-center justify-center transition hover:bg-white/80 z-10"
                    aria-label="Previous"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <polygon points="18,4 6,12 18,20" fill={design.accentColor || '#111'} />
                    </svg>
                  </button>
                  <div className="flex-1 flex justify-center">
                    <Swiper
                      modules={[Navigation, Pagination, A11y, Autoplay]}
                      spaceBetween={30}
                      slidesPerView={1}
                      navigation={{
                        nextEl: '.swiper-button-next',
                        prevEl: '.swiper-button-prev',
                      }}
                      pagination={{
                        clickable: true,
                        el: '.my-custom-swiper-pagination',
                      }}
                      autoplay={design.autoAdvance ? {
                        delay: (design.slideshowSpeed ?? 4) * 1000,
                        disableOnInteraction: false,
                      } : false}
                      onSwiper={setSwiperInstance}
                      className="max-w-3xl w-full"
                    >
                      {reviews.map((review, index) => (
                        <SwiperSlide key={review.id || index}>
                          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            <article
                              className="flex flex-col sm:flex-col items-center gap-4 py-6 relative bg-white rounded-3xl w-full px-4 sm:px-[15px] justify-center flex-1 h-auto sm:h-[320px] shadow"
                              style={{
                                background:
                                  design.bgColor === "transparent"
                                    ? "none"
                                    : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
                                color: design.textColor,
                                minHeight: 320,
                                maxHeight: 320,
                                height: 'auto',
                                border: design.border ? `${design.borderWidth ?? 2}px solid ${design.borderColor ?? '#cccccc'}` : "none",
                                borderRadius: design.borderRadius,
                                boxShadow: design.shadow ? `inset 0 4px 32px 0 ${hexToRgba(design.shadowColor ?? '#222222', design.shadowIntensity ?? 0.2)}` : 'none',
                                overflow: 'hidden',
                              }}
                              itemScope
                              itemType="https://schema.org/Review"
                            >
                              {design.showQuotes && (
                                <>
                                  <span
                                    className="absolute left-4 top-4 z-0 pointer-events-none"
                                    style={{ width: 96, height: 96, opacity: 0.5 }}
                                  >
                                    <svg
                                      width="96"
                                      height="96"
                                      viewBox="0 0 96 96"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                      style={{ display: "block" }}
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
                                    className="absolute right-4 bottom-4 z-0 pointer-events-none"
                                    style={{ width: 96, height: 96, opacity: 0.5 }}
                                  >
                                    <svg
                                      width="96"
                                      height="96"
                                      viewBox="0 0 96 96"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                      style={{ display: "block" }}
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
                              <div className="flex items-center justify-center mb-2 mt-1">
                                {typeof (review as any).star_rating === 'number' && !isNaN((review as any).star_rating) ? (
                                  <>
                                    {Array.from({ length: 5 }).map((_, i) => {
                                      const rating = (review as any).star_rating;
                                      const full = i + 1 <= Math.floor(rating);
                                      const half = !full && i + 0.5 <= rating;
                                      const gradientId = `half-star-gradient-${i}`;
                                      return (
                                        <svg
                                          key={i}
                                          width="16"
                                          height="16"
                                          viewBox="0 0 20 20"
                                          fill={full ? '#FBBF24' : half ? `url(#${gradientId})` : '#E5E7EB'}
                                          stroke="#FBBF24"
                                          className="inline-block mx-0.5"
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
                                    })}
                                  </>
                                ) : null}
                              </div>
                              <p
                                className={`text-lg mb-2 md:mb-4 px-1 md:px-2 text-center ${selectedWidget?.widget_type === 'multi' ? '' : 'text-base md:text-[20px]'}`}
                                itemProp="reviewBody"
                                style={{
                                  lineHeight: design.lineSpacing,
                                  fontSize: selectedWidget?.widget_type === 'multi' ? 14 : undefined,
                                  color: design.bodyTextColor,
                                }}
                              >
                                {review.review_content}
                              </p>
                              <div className="flex flex-col items-center gap-1 w-full mt-auto">
                                <span
                                  className="font-semibold text-indigo-700"
                                  itemProp="author"
                                  itemScope
                                  itemType="https://schema.org/Person"
                                  style={{ fontSize: design.attributionFontSize, color: design.nameTextColor }}
                                >
                                  <span itemProp="name">
                                    {review.first_name} {review.last_name}
                                  </span>
                                </span>
                                <span
                                  className="text-xs text-gray-500"
                                  itemProp="author"
                                  itemScope
                                  itemType="https://schema.org/Person"
                                  style={{ fontSize: design.attributionFontSize * 0.85, color: design.roleTextColor }}
                                >
                                  <span itemProp="jobTitle">
                                    {review.reviewer_role}
                                  </span>
                                </span>
                                {design.showRelativeDate &&
                                  review.created_at &&
                                  review.platform && (
                                    <span className="text-xs text-gray-400 mt-1">
                                      {getRelativeTime(review.created_at)} via {review.platform}
                                    </span>
                                  )}
                              </div>
                            </article>
                          </div>
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  </div>
                  <button
                    type="button"
                    onClick={() => swiperInstance?.slideNext()}
                    className="rounded-full bg-white/60 backdrop-blur border border-gray-200 w-10 h-10 flex items-center justify-center transition hover:bg-white/80 z-10"
                    aria-label="Next"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <polygon points="6,4 18,12 6,20" fill={design.accentColor || '#111'} />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="my-custom-swiper-pagination flex justify-center mt-6" />
            </>
          ) : (
            <>
              <div className="flex flex-col items-center">
                <div className="flex flex-row items-center justify-center gap-8 px-8 md:px-16 w-full max-w-6xl mx-auto">
                  <button
                    type="button"
                    onClick={() => swiperInstance?.slidePrev()}
                    className="rounded-full bg-white/60 backdrop-blur border border-gray-200 w-10 h-10 flex items-center justify-center transition hover:bg-white/80 z-10"
                    aria-label="Previous"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <polygon points="18,4 6,12 18,20" fill={design.accentColor || '#111'} />
                    </svg>
                  </button>
                  <div className="flex-1 flex justify-center">
                    <Swiper
                      modules={[Navigation, Pagination, A11y, Autoplay]}
                      spaceBetween={30}
                      slidesPerView={3}
                      navigation={{
                        nextEl: '.swiper-button-next',
                        prevEl: '.swiper-button-prev',
                      }}
                      pagination={{
                        clickable: true,
                        el: '.my-custom-swiper-pagination',
                      }}
                      autoplay={design.autoAdvance ? {
                        delay: (design.slideshowSpeed ?? 4) * 1000,
                        disableOnInteraction: false,
                      } : false}
                      onSwiper={setSwiperInstance}
                      className="max-w-5xl w-full"
                      breakpoints={{
                        320: {
                          slidesPerView: 1,
                          spaceBetween: 20
                        },
                        640: {
                          slidesPerView: 2,
                          spaceBetween: 20
                        },
                        1024: {
                          slidesPerView: 3,
                          spaceBetween: 30
                        }
                      }}
                    >
                      {reviews.map((review, index) => (
                        <SwiperSlide key={review.id || index}>
                          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            <article
                              className="flex flex-col items-center gap-4 py-6 relative bg-white rounded-3xl w-full px-4 md:px-[15px] justify-center flex-1"
                              style={{
                                background:
                                  design.bgColor === "transparent"
                                    ? "none"
                                    : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
                                color: design.textColor,
                                minHeight: 320,
                                maxHeight: 320,
                                height: 320,
                                border: design.border ? `${design.borderWidth ?? 2}px solid ${design.borderColor ?? '#cccccc'}` : "none",
                                borderRadius: design.borderRadius,
                                boxShadow: design.shadow ? `inset 0 4px 32px 0 ${hexToRgba(design.shadowColor ?? '#222222', design.shadowIntensity ?? 0.2)}` : 'none',
                                overflow: 'hidden',
                              }}
                              itemScope
                              itemType="https://schema.org/Review"
                            >
                              <div className="flex items-center justify-center mb-2 mt-1">
                                {typeof (review as any).star_rating === 'number' && !isNaN((review as any).star_rating) ? (
                                  <>
                                    {Array.from({ length: 5 }).map((_, i) => {
                                      const rating = (review as any).star_rating;
                                      const full = i + 1 <= Math.floor(rating);
                                      const half = !full && i + 0.5 <= rating;
                                      const gradientId = `half-star-gradient-${i}`;
                                      return (
                                        <svg
                                          key={i}
                                          width="16"
                                          height="16"
                                          viewBox="0 0 20 20"
                                          fill={full ? '#FBBF24' : half ? `url(#${gradientId})` : '#E5E7EB'}
                                          stroke="#FBBF24"
                                          className="inline-block mx-0.5"
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
                                    })}
                                  </>
                                ) : null}
                              </div>
                              <p
                                className={`text-lg mb-2 md:mb-4 px-1 md:px-2 text-center ${selectedWidget?.widget_type === 'multi' ? '' : 'text-base md:text-[20px]'}`}
                                itemProp="reviewBody"
                                style={{
                                  lineHeight: design.lineSpacing,
                                  fontSize: selectedWidget?.widget_type === 'multi' ? 14 : undefined,
                                  color: design.bodyTextColor,
                                }}
                              >
                                {review.review_content}
                              </p>
                              <div className="flex flex-col items-center gap-1 w-full mt-auto">
                                <span
                                  className="font-semibold text-indigo-700"
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
                                  className="text-xs text-gray-500"
                                  itemProp="author"
                                  itemScope
                                  itemType="https://schema.org/Person"
                                  style={{ fontSize: design.attributionFontSize * 0.85, color: design.roleTextColor }}
                                >
                                  <span itemProp="jobTitle">
                                    {review.reviewer_role}
                                  </span>
                                </span>
                                {design.showRelativeDate &&
                                  review.created_at &&
                                  review.platform && (
                                    <span className="text-xs text-gray-400 mt-1">
                                      {getRelativeTime(review.created_at)} via {review.platform}
                                    </span>
                                  )}
                              </div>
                            </article>
                          </div>
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  </div>
                  <button
                    type="button"
                    onClick={() => swiperInstance?.slideNext()}
                    className="rounded-full bg-white/60 backdrop-blur border border-gray-200 w-10 h-10 flex items-center justify-center transition hover:bg-white/80 z-10"
                    aria-label="Next"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <polygon points="6,4 18,12 6,20" fill={design.accentColor || '#111'} />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="my-custom-swiper-pagination flex justify-center mt-6" />
            </>
          )}
          <div id="carousel-live" className="sr-only" aria-live="polite" />
        </section>
      </div>
      {/* Main Card Below */}
      <PageCard icon={<FaCode className="w-9 h-9 text-[#1A237E]" />}>
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-4xl font-bold text-[#1A237E]">Your widgets</h1>
          <button
            className="px-4 py-2 bg-dustyPlum text-pureWhite rounded hover:bg-lavenderHaze hover:text-dustyPlum transition-colors font-semibold"
            onClick={() => {
              // Open the new widget form in WidgetList via a custom event
              const event = new CustomEvent("openNewWidgetForm");
              window.dispatchEvent(event);
            }}
          >
            + New widget
          </button>
        </div>
        <p className="mt-2 text-gray-500 text-sm max-w-md mb-8">
          Create up to 3 widgets.  Choose which reviews you want to add and select the most impactful lines to include in your widget. Use "Style" to change look and feel.
        </p>
        {/* Widget Management Section */}
        <WidgetList
          onSelectWidget={setSelectedWidget}
          selectedWidgetId={selectedWidget?.id}
          onDesignChange={setDesign}
          design={design}
          onWidgetReviewsChange={() => {
            if (!selectedWidget) return;
            const supabase = createBrowserClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            );
            supabase
              .from("widget_reviews")
              .select(
                "id, review_content, first_name, last_name, reviewer_role, platform, created_at, order_index, star_rating, photo_url",
              )
              .eq("widget_id", selectedWidget.id)
              .order("order_index", { ascending: true })
              .then(({ data, error }) => {
                if (data) setReviews(data);
                setLoading(false);
              });
          }}
        />
        <hr className="my-10" />
        {/* JSON-LD for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </PageCard>
    </>
  );
}
