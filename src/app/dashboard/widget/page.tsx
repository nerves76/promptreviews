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
import MultiWidget from "./components/widgets/multi/backup/MultiWidget";

// Add DesignState type definition
type DesignState = {
  bgType: "none" | "solid";
  bgColor: string;
  textColor: string;
  accentColor: string;
  bodyTextColor: string;
  nameTextColor: string;
  roleTextColor: string;
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
    accentColor: "#6a5acd",
    bodyTextColor: "#22223b",
    nameTextColor: "#1a237e",
    roleTextColor: "#6b7280",
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
  const previewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setIsClient(true), []);

  // Effect to load the embed script based on widget type
  useEffect(() => {
    if (!selectedWidget) return;
    
    const widgetType = selectedWidget.widget_type || 'multi';
    const scriptId = `promptreviews-embed-script-${widgetType}`;
    
    // Remove any existing scripts for other widget types
    const existingScripts = document.querySelectorAll('[id^="promptreviews-embed-script-"]');
    existingScripts.forEach(script => {
      if (script.id !== scriptId) {
        script.remove();
      }
    });
    
    // Check if the correct script is already loaded
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `/widgets/${widgetType}/widget-embed.js`;
    script.async = true;
    script.onload = () => {
      console.log(`Loaded ${widgetType} widget script`);
    };
    script.onerror = () => {
      console.error(`Failed to load ${widgetType} widget script`);
    };
    document.body.appendChild(script);
  }, [selectedWidget?.widget_type]);

  // Effect to render/re-render the widget when data changes
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container || !selectedWidget || typeof window === 'undefined') return;

    console.log('Widget rendering effect triggered:', {
      selectedWidget,
      widgetType: selectedWidget.widget_type,
      reviewsCount: reviews.length,
      design
    });

    const render = () => {
      const widgetType = selectedWidget.widget_type || 'multi';
      const renderFunction = widgetType === 'single' ? 
        window.PromptReviews?.renderSingleWidget : 
        window.PromptReviews?.renderMultiWidget;
      
      console.log('Render function check:', {
        widgetType,
        renderFunction: !!renderFunction,
        PromptReviews: !!window.PromptReviews
      });
      
      if (renderFunction) {
        const widgetData = {
          reviews,
          design,
          businessSlug: universalPromptSlug || undefined
        };
        console.log('Calling render function with data:', widgetData);
        renderFunction(container, widgetData);
      } else {
        console.log('Render function not available, retrying in 100ms...');
        setTimeout(render, 100);
      }
    };
    render();
  }, [selectedWidget?.id, selectedWidget?.widget_type, reviews, design, universalPromptSlug]);

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

  // Generate proper embed code with actual widget ID - moved to useEffect to avoid SSR issues
  const [embedCode, setEmbedCode] = useState<string>("");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const widgetType = selectedWidget?.widget_type || 'multi';
      // Use minified version for production embeds (better performance)
      const scriptUrl = `${window.location.origin}/widgets/${widgetType}/widget-embed.min.js`;
      const code = selectedWidget 
        ? `<!-- PromptReviews.app Widget Type: ${widgetType} -->\n<div class="promptreviews-widget" data-widget="${selectedWidget.id}" data-widget-type="${widgetType}"></div>\n<script src="${scriptUrl}" async></script>`
        : `<!-- PromptReviews.app Widget Type: ${widgetType} -->\n<div class="promptreviews-widget" data-widget="YOUR_WIDGET_ID" data-widget-type="${widgetType}"></div>\n<script src="${scriptUrl}" async></script>`;
      setEmbedCode(code);
    }
  }, [selectedWidget]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
    } catch (err) {
      alert("Could not copy to clipboard. Please copy manually.");
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

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

  // Add debugging for design state changes
  useEffect(() => {
    console.log("Dashboard design state changed:", design);
  }, [design]);

  // Add debugging for loading states
  useEffect(() => {
    console.log("Widget page loading states:", { loading, isClient });
  }, [loading, isClient]);

  if (loading) {
    console.log("Widget page: showing loading state");
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AppLoader />
      </div>
    );
  }

  if (!isClient) {
    console.log("Widget page: showing client loading state");
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Widget Preview Area */}
      <div className="relative w-full min-h-[600px] flex flex-col items-center justify-center py-12">
        {/* Site signature gradient background behind the widget preview */}
        <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
          <div className="w-full h-full bg-gradient-to-br from-[#6a5acd] via-indigo-400 to-blue-400 opacity-30 blur-2xl" />
        </div>
        <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center">
          {/* Widget preview label above the widget, now smaller and white */}
          <div className="mb-4 text-base font-normal text-white">Widget preview</div>
          {/* Widget preview container */}
          <div ref={previewContainerRef} className="w-full max-w-5xl flex justify-center items-center min-h-[400px]">
            {/* The embedded widget will be rendered here by a useEffect hook */}
          </div>
        </div>
      </div>

      {/* Rest of your dashboard UI */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.location.href = 'https://promptreviews.app/contact';
                    }
                  }}
                  className="px-4 py-2 bg-dustyPlum text-pureWhite rounded hover:bg-lavenderHaze hover:text-dustyPlum transition-colors font-semibold"
                >
                  Contact Us
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Card Below */}
        <PageCard 
          icon={<FaCode className="w-9 h-9 text-[#1A237E]" />}
          topRightAction={
            <button
              className="px-4 py-2 bg-[#1A237E] text-white rounded hover:bg-opacity-90 transition-colors font-semibold whitespace-nowrap"
              onClick={() => {
                if (widgets.length >= 3) {
                  setShowMaxWidgetsModal(true);
                } else {
                  // Open the new widget form in WidgetList via a custom event
                  if (typeof window !== 'undefined') {
                    const event = new CustomEvent("openNewWidgetForm");
                    window.dispatchEvent(event);
                  }
                }
              }}
            >
              + New widget
            </button>
          }
        >
          <div className="text-left pt-4 mb-6">
            <h1 className="text-4xl font-bold text-[#1A237E]">Your widgets</h1>
            <p className="mt-2 text-gray-500 text-sm max-w-md">
              Create up to 3 different widgets to showcase your reviews. Style to match your brand.
            </p>
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
      </div>
    </div>
  );
}

