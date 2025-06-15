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
import { MultiWidget, SingleWidget, PhotoWidget, getDesignWithDefaults, hexToRgba, getRelativeTime, renderStars, lightenHex, injectWidgetNavCSS } from '../../../widget-embed/index';

// Add DesignState type definition
type DesignState = {
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
};

export default function WidgetPage() {
  const [current, setCurrent] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showMaxWidgetsModal, setShowMaxWidgetsModal] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [selectedWidget, setSelectedWidget] = useState<any>(null);
  const [widgetReviews, setWidgetReviews] = useState<any[]>([]);
  const [loadingWidget, setLoadingWidget] = useState(false);
  const [design, setDesign] = useState<DesignState>({
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
    font: "Inter",
    showSubmitReviewButton: true,
  });
  const [currentGroup, setCurrentGroup] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [widgets, setWidgets] = useState<any[]>([]);
  const [universalPromptSlug, setUniversalPromptSlug] = useState<string | null>(null);

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

  useEffect(() => {
    injectWidgetNavCSS();
  }, []);

  // Fetch universal prompt page slug when selectedWidget changes
  useEffect(() => {
    async function fetchUniversalPromptSlug() {
      if (!selectedWidget?.account_id) return;
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const { data, error } = await supabase
        .from("prompt_pages")
        .select("slug")
        .eq("account_id", selectedWidget.account_id)
        .eq("is_universal", true)
        .single();
      if (data?.slug) setUniversalPromptSlug(data.slug);
      else setUniversalPromptSlug(null);
    }
    fetchUniversalPromptSlug();
  }, [selectedWidget]);

  if (loading) {
    return <TopLoaderOverlay />;
  }

  if (!isClient) return null;

  return (
    <>
      {showMaxWidgetsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowMaxWidgetsModal(false)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-red-500 hover:text-red-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-[#1A237E] mb-4">Max widgets reached!</h2>
            <p className="text-gray-600 mb-6">You must really love widgets. Contact us and we may be able to help!</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => window.location.href = 'https://promptreviews.app/contact'}
                className="px-4 py-2 bg-dustyPlum text-pureWhite rounded hover:bg-lavenderHaze hover:text-dustyPlum transition-colors font-semibold"
              >
                Contact Us
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Widget Preview on Gradient */}
      <div
        className="w-full max-w-full mx-auto mb-0 mt-12 px-2 sm:px-0"
        style={{
          boxSizing: 'border-box',
          minHeight: 320,
          background: design.sectionBgType === 'custom'
            ? design.sectionBgColor
            : 'none',
          transition: 'background 0.3s',
        }}
      >
        <h2 className="text-lg font-semibold text-white mb-4 text-center">
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
            transition: 'min-height 0.3s',
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
          ) : selectedWidget?.widget_type === 'multi' ? (
            <MultiWidget data={{ ...selectedWidget, reviews, design, universalPromptSlug }} />
          ) : selectedWidget?.widget_type === 'single' ? (
            <SingleWidget data={{ ...selectedWidget, reviews, design, universalPromptSlug }} />
          ) : selectedWidget?.widget_type === 'photo' ? (
            <PhotoWidget data={{ ...selectedWidget, reviews, design, universalPromptSlug }} />
          ) : null}
          <div id="carousel-live" className="sr-only" aria-live="polite" />
        </section>
      </div>
      {/* Main Card Below */}
      <PageCard icon={<FaCode className="w-9 h-9 text-[#1A237E]" />}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-2">
          <div>
            <h1 className="text-4xl font-bold text-[#1A237E]">Your widgets</h1>
            <p className="mt-2 text-gray-500 text-sm max-w-md">
              Create up to 3 different widgets to showcase your reviews. Style to match your brand.
            </p>
          </div>
          <button
            className="px-4 py-2 bg-[#1A237E] text-white rounded hover:bg-opacity-90 transition-colors font-semibold whitespace-nowrap"
            onClick={() => {
              if (widgets.length >= 3) {
                setShowMaxWidgetsModal(true);
              } else {
                // Open the new widget form in WidgetList via a custom event
                const event = new CustomEvent("openNewWidgetForm");
                window.dispatchEvent(event);
              }
            }}
          >
            + New widget
          </button>
        </div>
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
        {/* JSON-LD for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </PageCard>
    </>
  );
}
