"use client";
import React, { useState, useRef, useEffect, Component, ErrorInfo, ReactNode } from "react";
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
import SingleWidget from "./components/widgets/single/SingleWidget";
import PhotoWidget from "./components/widgets/photo/PhotoWidget";

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

interface WidgetContainer extends HTMLDivElement {
  _cleanup?: () => void;
}

// Error boundary component
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class WidgetErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Widget Error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-semibold">Widget Error</h3>
          <p className="text-red-600 text-sm mt-2">
            {this.state.error?.message || 'An error occurred while loading the widget'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

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
  const previewContainerRef = useRef<WidgetContainer>(null);
  const [widgetVersion, setWidgetVersion] = useState(1);

  // Add refs to track script load state
  const swiperLoadedRef = useRef(false);
  const widgetScriptLoadedRef = useRef(false);

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

  // Cleanup function for widget
  const cleanupWidget = () => {
    if (previewContainerRef.current) {
      previewContainerRef.current.innerHTML = '';
    }
    // Remove any existing widget scripts
    const widgetScript = document.getElementById('pr-multi-widget-script');
    if (widgetScript) {
      widgetScript.remove();
    }
  };

  // Helper to wait for Swiper to be available globally
  function waitForGlobalSwiper(callback: () => void, maxAttempts = 20) {
    let attempts = 0;
    function check() {
      if (typeof window !== 'undefined' && typeof window.Swiper !== 'undefined') {
        callback();
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(check, 100);
      } else {
        console.error('Swiper failed to load globally after maximum attempts');
      }
    }
    check();
  }

  // Initialize vanilla JS widget when selected widget or design changes
  useEffect(() => {
    if (!selectedWidget) return;

    // Only load Swiper and widget scripts once
    if (!swiperLoadedRef.current) {
      const swiperCSS = document.createElement('link');
      swiperCSS.rel = 'stylesheet';
      swiperCSS.href = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css';
      document.head.appendChild(swiperCSS);

      const widgetCSS = document.createElement('link');
      widgetCSS.rel = 'stylesheet';
      widgetCSS.href = '/widgets/multi/widget-embed.css';
      document.head.appendChild(widgetCSS);

      const swiperScript = document.createElement('script');
      swiperScript.src = 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js';
      swiperScript.async = true;
      swiperScript.onload = () => {
        swiperLoadedRef.current = true;
        maybeLoadWidgetScript();
      };
      document.body.appendChild(swiperScript);

      // Cleanup scripts and CSS on unmount
      return () => {
        swiperCSS.remove();
        swiperLoadedRef.current = false;
        widgetScriptLoadedRef.current = false;
      };
    } else {
      maybeLoadWidgetScript();
    }

    function maybeLoadWidgetScript() {
      if (!widgetScriptLoadedRef.current) {
        if (!document.getElementById('pr-multi-widget-script')) {
          const script = document.createElement('script');
          script.id = 'pr-multi-widget-script';
          script.src = '/widgets/multi/widget-embed.js';
          script.async = true;
          script.onload = () => {
            widgetScriptLoadedRef.current = true;
            waitForGlobalSwiper(renderWidget);
          };
          document.body.appendChild(script);
        } else {
          widgetScriptLoadedRef.current = true;
          waitForGlobalSwiper(renderWidget);
        }
      } else {
        waitForGlobalSwiper(renderWidget);
      }
    }

    function renderWidget() {
      // Force full cleanup of the preview container before every render
      if (previewContainerRef.current) {
        previewContainerRef.current.innerHTML = '';
      }
      // Cleanup any existing widget
      cleanupWidget();
      // Create a container for the widget
      const widgetContainer = document.createElement('div');
      widgetContainer.className = 'promptreviews-widget';
      widgetContainer.setAttribute('data-widget-type', 'multi');
      widgetContainer.setAttribute('data-widget', selectedWidget.id);
      previewContainerRef.current?.appendChild(widgetContainer);

      // Map reviews to expected shape for vanilla widget
      const mappedReviews = (reviews || [])
        .filter(r => r && ((r.reviewer_name || r.name || r.first_name || r.last_name || (r.reviewer && (r.reviewer.name || r.reviewer.first_name || r.reviewer.last_name))) && (r.review_content || r.content)))
        .map(r => ({
          ...r,
          name: r.name || r.reviewer_name ||
            ((r.first_name || r.reviewer_first_name || '') +
             ((r.last_name || r.reviewer_last_name) ? ' ' + (r.last_name || r.reviewer_last_name) : '')) ||
            (r.reviewer && (r.reviewer.name || ((r.reviewer.first_name || '') + ((r.reviewer.last_name) ? ' ' + r.reviewer.last_name : '')))) ||
            'Anonymous',
          content: r.content || r.review_content || '',
          rating: r.rating || r.star_rating || 5,
          role: r.role || r.reviewer_role || '',
          date: r.date || r.created_at || new Date().toISOString()
        }));
      // Handle empty reviews gracefully
      if (!mappedReviews.length) {
        widgetContainer.innerHTML = '<div class="text-center text-gray-400 py-12">No reviews to display.</div>';
        return;
      }

      // Wait for next tick to ensure DOM is updated
      try {
        window.PromptReviews.renderMultiWidget(widgetContainer, {
          ...selectedWidget,
          design,
          reviews: mappedReviews,
          businessSlug: universalPromptSlug
        });
      } catch (error: unknown) {
        console.error('Error rendering widget:', error);
        widgetContainer.innerHTML = `
          <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 class="text-red-800 font-semibold">Widget Error</h3>
            <p class="text-red-600 text-sm mt-2">${error instanceof Error ? error.message : 'An unknown error occurred'}</p>
          </div>
        `;
      }
    }

    // For design/review changes, just re-render the widget
    // (scripts are only loaded once)
  }, [selectedWidget, design, reviews, universalPromptSlug]);

  // This effect handles the rendering of the multi-widget preview
  useEffect(() => {
    console.log("Multi-widget render effect triggered. WidgetVersion:", widgetVersion);
    if (selectedWidget?.widget_type !== 'multi' || !previewContainerRef.current) {
      console.log("Condition not met, aborting render.");
      return;
    }

    const container = previewContainerRef.current;
    
    // Ensure container is empty before rendering
    if (container) {
      container.innerHTML = '';
    }

    let isCancelled = false;
    
    console.log("Proceeding with widget render...");

    // Dynamically load the widget script
    const scriptId = 'multi-widget-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    
    const onScriptLoad = () => {
      if (isCancelled) return;
      console.log("Widget script loaded/exists.");

      if (window.PromptReviews && typeof window.PromptReviews.renderMultiWidget === 'function') {
        console.log("renderMultiWidget function found. Preparing data...");
        const widgetData = {
          reviews: reviews.map(r => ({
            content: r.review_content,
            name: r.first_name ? `${r.first_name} ${r.last_name || ''}`.trim() : r.reviewer_name,
            role: r.reviewer_role,
            date: r.created_at,
            rating: r.star_rating
          })),
          design: { ...design },
          businessSlug: universalPromptSlug
        };
        console.log("Calling renderMultiWidget with data:", widgetData);
        window.PromptReviews.renderMultiWidget(container, widgetData);
        console.log("renderMultiWidget called.");
      } else {
        console.error('renderMultiWidget function not found on window.PromptReviews after script load.');
      }
    };

    if (!script) {
      console.log("Script not found, creating new script element.");
      script = document.createElement('script');
      script.id = scriptId;
      // Add a cache-busting query parameter using the widgetVersion
      script.src = `/widgets/multi/widget-embed.js?v=${widgetVersion}`;
      script.async = true;
      script.onload = onScriptLoad;
      script.onerror = () => console.error('Failed to load multi-widget script.');
      document.body.appendChild(script);
    } else {
      console.log("Script found, reloading.");
      // If script exists, remove and re-add to force re-execution
      script.remove();
      const newScript = document.createElement('script');
      newScript.id = scriptId;
      newScript.src = `/widgets/multi/widget-embed.js?v=${widgetVersion}`;
      newScript.async = true;
      newScript.onload = onScriptLoad;
      newScript.onerror = () => console.error('Failed to re-load multi-widget script.');
      document.body.appendChild(newScript);
    }

    return () => {
      isCancelled = true;
      console.log("Cleanup function for multi-widget effect.");
      if (container && typeof container._cleanup === 'function') {
        console.log("Calling container-specific cleanup.");
        container._cleanup();
      }
    };
  }, [selectedWidget, reviews, design, universalPromptSlug, widgetVersion]);

  const renderWidgetPreview = () => {
    if (!selectedWidget || !reviews.length) return null;

    const widgetData = {
      reviews,
      design
    };

    return (
      <WidgetErrorBoundary>
        {selectedWidget.widget_type === 'single' && <SingleWidget data={widgetData} />}
        {selectedWidget.widget_type === 'photo' && <PhotoWidget data={widgetData} />}
        {selectedWidget.widget_type === 'multi' && (
          <div 
            id="promptreviews-widget" 
            data-reviews={JSON.stringify(reviews)}
            data-design={JSON.stringify(design)}
            className="w-full h-full"
          />
        )}
      </WidgetErrorBoundary>
    );
  };

  if (loading) {
    return <TopLoaderOverlay />;
  }

  if (!isClient) return null;

  return (
    <div className="min-h-screen">
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
          <div ref={previewContainerRef} className="w-full flex justify-center items-center min-h-[400px]" />
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
                  onClick={() => window.location.href = 'https://promptreviews.app/contact'}
                  className="px-4 py-2 bg-dustyPlum text-pureWhite rounded hover:bg-lavenderHaze hover:text-dustyPlum transition-colors font-semibold"
                >
                  Contact Us
                </button>
              </div>
            </div>
          </div>
        )}

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
        <div className="mt-8">
          {renderWidgetPreview()}
        </div>
      </div>

      {/* Move the old React widget preview to the bottom of the page */}
      <div className="w-full max-w-full mx-auto mb-0 mt-12 px-2 sm:px-0">
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
          ) : null}
          <div id="carousel-live" className="sr-only" aria-live="polite" />
        </section>
      </div>
    </div>
  );
}

