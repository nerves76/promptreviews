"use client";
import React, { useState, useRef, useEffect } from "react";
import { FaChevronLeft, FaChevronRight, FaCopy, FaCode } from "react-icons/fa";
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
    accentColor: "#6c47ff",
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
  });
  const [currentGroup, setCurrentGroup] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => setIsClient(true), []);

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
        "id, review_content, reviewer_name, reviewer_role, platform, created_at, order_index",
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

  // Auto-advance logic
  useEffect(() => {
    if (!design.autoAdvance || reviews.length <= 1) return;
    const timer = setTimeout(
      () => {
        setCurrent((prev) => (prev + 1) % reviews.length);
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
        name: r.reviewer_name,
        jobTitle: r.reviewer_role,
      },
    })),
  };

  // Group reviews into sets of 3 for grid mode
  const reviewGroups = [];
  for (let i = 0; i < reviews.length; i += 3) {
    reviewGroups.push(reviews.slice(i, i + 3));
  }

  if (loading) {
    return <TopLoaderOverlay />;
  }

  if (!isClient) return null;

  return (
    <>
      {/* Widget Preview on Gradient */}
      <div
        className="w-full mx-auto mb-12 mt-10 px-2 sm:px-4 md:px-8"
        style={{ maxWidth: design.showGrid ? 1000 : 800 }}
      >
        <h2 className="text-2xl font-bold text-white mb-4 text-center">
          Live widget preview
        </h2>
        <section
          className={`flex flex-col justify-center relative${design.showGrid ? " bg-transparent shadow-none border-none p-0" : ""}`}
          aria-label="Review carousel preview"
          style={
            design.showGrid
              ? {
                  background: "none",
                  color: design.textColor,
                  border: "none",
                  boxShadow: "none",
                  padding: 0,
                  minHeight: 320,
                  margin: "0 auto",
                }
              : {
                  background:
                    design.bgColor === "transparent"
                      ? "none"
                      : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
                  color: design.textColor,
                  borderRadius: design.borderRadius,
                  boxShadow: design.shadow
                    ? "0 4px 24px 0 rgba(80, 60, 180, 0.10)"
                    : "none",
                  padding: 48,
                  minHeight: 320,
                  margin: "0 auto",
                  border: design.border
                    ? `${design.borderWidth ?? 2}px solid ${design.accentColor}`
                    : "none",
                }
          }
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
          ) : isClient && design.showGrid ? (
            <div
              className="relative w-full"
              style={{ minHeight: 220, padding: 0, overflow: "hidden" }}
            >
              <Swiper
                key={swiperInstance ? "nav-ready" : "nav-not-ready"}
                modules={[Navigation, Pagination, A11y, Autoplay]}
                slidesPerView={Math.min(3, reviews.length)}
                spaceBetween={32}
                pagination={
                  reviews.length > 1
                    ? { clickable: true, el: ".custom-swiper-pagination" }
                    : false
                }
                loop={reviews.length > 3}
                autoplay={
                  design.autoAdvance && reviews.length > 1
                    ? {
                        delay: (design.slideshowSpeed ?? 4) * 1000,
                        disableOnInteraction: false,
                      }
                    : false
                }
                style={{ paddingBottom: 48 }}
                breakpoints={{
                  0: { slidesPerView: Math.min(1, reviews.length) },
                  640: { slidesPerView: Math.min(1, reviews.length) },
                  768: { slidesPerView: Math.min(2, reviews.length) },
                  1024: { slidesPerView: Math.min(3, reviews.length) },
                }}
                onSwiper={setSwiperInstance}
              >
                {reviews.map((review) => (
                  <SwiperSlide key={review.id}>
                    <article
                      className={`flex flex-col items-center gap-4 py-6 relative${design.showQuotes ? " pt-24" : ""}`}
                      style={{
                        background: "none",
                        color: design.textColor,
                        minHeight: 360,
                        border: "none",
                        borderRadius: design.borderRadius,
                        boxShadow: "none",
                      }}
                      itemScope
                      itemType="https://schema.org/Review"
                    >
                      {design.showQuotes && (
                        <span
                          className="absolute left-1/2 top-8 -translate-x-1/2 z-0 pointer-events-none"
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
                              x="20"
                              y="76"
                              fontSize="96"
                              fill={lightenHex(design.accentColor, 0.7)}
                              fontFamily="serif"
                            >
                              “
                            </text>
                          </svg>
                        </span>
                      )}
                      <p
                        className="text-lg mb-2 md:mb-4 px-2 md:px-4 text-center"
                        itemProp="reviewBody"
                        style={{
                          lineHeight: design.lineSpacing,
                          fontSize: design.quoteFontSize,
                          color: design.textColor,
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
                          style={{ fontSize: design.attributionFontSize }}
                        >
                          <span itemProp="name">{review.reviewer_name}</span>
                        </span>
                        <span
                          className="text-xs text-gray-500"
                          itemProp="author"
                          itemScope
                          itemType="https://schema.org/Person"
                          style={{
                            fontSize: design.attributionFontSize * 0.85,
                          }}
                        >
                          <span itemProp="jobTitle">
                            {review.reviewer_role}
                          </span>
                        </span>
                        {design.showRelativeDate &&
                          review.created_at &&
                          review.platform && (
                            <span className="text-xs text-gray-400 mt-1">
                              {getRelativeTime(review.created_at)} via{" "}
                              {review.platform}
                            </span>
                          )}
                      </div>
                    </article>
                  </SwiperSlide>
                ))}
                <div
                  className="w-full flex justify-center mt-8 pointer-events-auto"
                  style={{ minHeight: 40 }}
                >
                  <button
                    onClick={() => swiperInstance && swiperInstance.slidePrev()}
                    aria-label="Previous reviews"
                    className="custom-prev w-10 h-10 aspect-square bg-white rounded-full shadow hover:bg-gray-100 focus:outline-none cursor-pointer flex items-center justify-center pointer-events-auto"
                    style={{
                      boxShadow: "0 4px 24px 0 rgba(80, 60, 180, 0.10)",
                    }}
                  >
                    <FaChevronLeft className="w-4 h-4 text-[#1A237E]" />
                  </button>
                  <div className="custom-swiper-pagination flex justify-center gap-2 pointer-events-auto mx-5"></div>
                  <button
                    onClick={() => swiperInstance && swiperInstance.slideNext()}
                    aria-label="Next reviews"
                    className="custom-next w-10 h-10 aspect-square bg-white rounded-full shadow hover:bg-gray-100 focus:outline-none cursor-pointer flex items-center justify-center pointer-events-auto"
                    style={{
                      boxShadow: "0 4px 24px 0 rgba(80, 60, 180, 0.10)",
                    }}
                  >
                    <FaChevronRight className="w-4 h-4 text-[#1A237E]" />
                  </button>
                </div>
              </Swiper>
              <style jsx global>{`
                .swiper-button-next,
                .swiper-button-prev {
                  color: #4f46e5;
                  z-index: 20;
                  display: flex !important;
                  align-items: center;
                  justify-content: center;
                  width: 40px;
                  height: 40px;
                  background: #fff;
                  border-radius: 50%;
                  box-shadow: 0 2px 8px rgba(80, 60, 180, 0.1);
                  transition: background 0.2s;
                  cursor: pointer;
                  pointer-events: auto !important;
                }
                .swiper-button-next:hover,
                .swiper-button-prev:hover {
                  background: #f3f4f6;
                }
                .swiper-pagination-bullet {
                  background: #a5b4fc;
                  opacity: 1;
                }
                .swiper-pagination-bullet-active {
                  background: #4f46e5;
                }
                .swiper {
                  overflow: hidden !important;
                }
              `}</style>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full">
              <article
                className={`flex flex-col items-center gap-4 py-6 relative${design.showQuotes ? " pt-24" : ""}`}
                style={{
                  background:
                    design.bgColor === "transparent"
                      ? "none"
                      : hexToRgba(design.bgColor, design.bgOpacity ?? 1),
                  color: design.textColor,
                  minHeight: 300,
                  border: "none",
                  borderRadius: design.borderRadius,
                  boxShadow: "none",
                }}
                itemScope
                itemType="https://schema.org/Review"
              >
                {design.showQuotes && (
                  <span
                    className="absolute left-1/2 top-8 -translate-x-1/2 z-0 pointer-events-none"
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
                        x="20"
                        y="76"
                        fontSize="96"
                        fill={lightenHex(design.accentColor, 0.7)}
                        fontFamily="serif"
                      >
                        “
                      </text>
                    </svg>
                  </span>
                )}
                <p
                  className="text-lg mb-2 md:mb-4 px-2 md:px-8 text-center"
                  itemProp="reviewBody"
                  style={{
                    lineHeight: design.lineSpacing,
                    fontSize: 20,
                    color: design.textColor,
                  }}
                >
                  {reviews[current]?.review_content}
                </p>
                <div className="flex flex-col items-center gap-1 w-full mt-auto">
                  <span
                    className="font-semibold text-indigo-700"
                    itemProp="author"
                    itemScope
                    itemType="https://schema.org/Person"
                    style={{ fontSize: design.attributionFontSize }}
                  >
                    <span itemProp="name">
                      {reviews[current]?.reviewer_name}
                    </span>
                  </span>
                  <span
                    className="text-xs text-gray-500"
                    itemProp="author"
                    itemScope
                    itemType="https://schema.org/Person"
                    style={{ fontSize: design.attributionFontSize * 0.85 }}
                  >
                    <span itemProp="jobTitle">
                      {reviews[current]?.reviewer_role}
                    </span>
                  </span>
                  {design.showRelativeDate &&
                    reviews[current]?.created_at &&
                    reviews[current]?.platform && (
                      <span className="text-xs text-gray-400 mt-1">
                        {getRelativeTime(reviews[current].created_at)} via{" "}
                        {reviews[current].platform}
                      </span>
                    )}
                </div>
              </article>
            </div>
          )}
          <div id="carousel-live" className="sr-only" aria-live="polite" />
        </section>
        {!design.showGrid && reviews.length > 1 && (
          <div
            className="w-full flex items-center justify-center gap-0 mt-8 pointer-events-auto"
            style={{ minHeight: 40 }}
          >
            <button
              onClick={() =>
                setCurrent((current - 1 + reviews.length) % reviews.length)
              }
              aria-label="Previous review"
              className="w-10 h-10 aspect-square bg-white rounded-full shadow hover:bg-gray-100 focus:outline-none cursor-pointer flex items-center justify-center pointer-events-auto"
              style={{ boxShadow: "0 4px 24px 0 rgba(80, 60, 180, 0.10)" }}
            >
              <FaChevronLeft className="w-4 h-4 text-[#1A237E]" />
            </button>
            <div className="flex justify-center gap-2 pointer-events-auto mx-5">
              {reviews.map((_, idx) => (
                <span
                  key={idx}
                  className={`w-2.5 h-2.5 rounded-full ${idx === current ? "bg-indigo-500" : "bg-indigo-200"}`}
                />
              ))}
            </div>
            <button
              onClick={() => setCurrent((current + 1) % reviews.length)}
              aria-label="Next review"
              className="w-10 h-10 aspect-square bg-white rounded-full shadow hover:bg-gray-100 focus:outline-none cursor-pointer flex items-center justify-center pointer-events-auto"
              style={{ boxShadow: "0 4px 24px 0 rgba(80, 60, 180, 0.10)" }}
            >
              <FaChevronRight className="w-4 h-4 text-[#1A237E]" />
            </button>
          </div>
        )}
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
          Create up to 3 widgets. Add up to 8 reviews per widget. Edit your
          reviews to fit by selecting the most impactful lines and removing the
          rest. Widgets are accessibly designed and SEO friendly.
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
                "id, review_content, reviewer_name, reviewer_role, platform, created_at, order_index",
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
