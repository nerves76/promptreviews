"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { FaChevronLeft, FaChevronRight, FaCopy, FaCode, FaPlus } from "react-icons/fa";
import { MdArrowBack, MdArrowForward } from "react-icons/md";
import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import WidgetList from "./WidgetList";
import { createBrowserClient } from "@supabase/ssr";
import PageCard from "@/app/components/PageCard";
import AppLoader from "@/app/components/AppLoader";
import TopLoaderOverlay from "@/app/components/TopLoaderOverlay";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import FiveStarSpinner from '@/app/components/FiveStarSpinner';
import { WidgetActions } from './components/WidgetActions';

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

// Static review data for preview
const staticReviews = [
  {
    id: 'preview-review-1',
    review_content: 'Amazing service! The team went above and beyond to deliver exactly what we needed. Highly recommend!',
    first_name: 'John',
    last_name: 'S.',
    reviewer_role: 'Verified Customer',
    created_at: new Date().toISOString(),
    star_rating: 5
  },
  {
    id: 'preview-review-2',
    review_content: 'Excellent service and great quality. Highly recommend to anyone looking for this type of solution.',
    first_name: 'Sarah',
    last_name: 'J.',
    reviewer_role: 'Happy Client',
    created_at: new Date().toISOString(),
    star_rating: 5
  },
  {
    id: 'preview-review-3',
    review_content: 'Outstanding experience from start to finish. The team was professional and delivered exactly what we needed.',
    first_name: 'Mike',
    last_name: 'D.',
    reviewer_role: 'Business Owner',
    created_at: new Date().toISOString(),
    star_rating: 5
  }
];

// Default design state - moved outside component to prevent recreation
const defaultDesign: DesignState = {
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
};

export default function WidgetPage() {
  const [isClient, setIsClient] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<any>(null);
  const [design, setDesign] = useState<DesignState>(defaultDesign);
  const [widgetRendered, setWidgetRendered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Move console log to useEffect to prevent setState during render
  useEffect(() => {
    console.log('=== WIDGET PAGE COMPONENT RENDERING ===');
  }, []);

  const openNewWidgetModal = () => {
    try {
      window.dispatchEvent(new CustomEvent('openNewWidgetForm'));
    } catch (error) {
      console.error('Error opening new widget modal:', error);
      setError('Failed to open widget modal');
    }
  };

  const openStyleModal = () => {
    try {
      if (selectedWidget) {
        window.dispatchEvent(new CustomEvent('openStyleModal'));
      } else {
        alert('Please select a widget to style.');
      }
    } catch (error) {
      console.error('Error opening style modal:', error);
      setError('Failed to open style modal');
    }
  };

  const openReviewModal = () => {
    try {
      if (selectedWidget) {
        window.dispatchEvent(new CustomEvent('openReviewModal'));
      } else {
        alert('Please select a widget to manage reviews.');
      }
    } catch (error) {
      console.error('Error opening review modal:', error);
      setError('Failed to open review modal');
    }
  };

  const getEmbedCode = () => {
    try {
      if (selectedWidget) {
        const embedCode = `<script src="${window.location.origin}/widgets/${selectedWidget.widget_type}/widget-embed.min.js"></script>
<div id="promptreviews-widget" data-widget-id="${selectedWidget.id}"></div>`;
        navigator.clipboard.writeText(embedCode);
        alert('Embed code copied to clipboard!');
      } else {
        alert('Please select a widget to get the embed code.');
      }
    } catch (error) {
      console.error('Error getting embed code:', error);
      setError('Failed to copy embed code');
    }
  };

  useEffect(() => {
    setIsClient(true);
    setIsLoading(false);
  }, []);

  // Memoized render function to prevent recreation
  const renderWidgetContent = useCallback(() => {
    const container = previewContainerRef.current;
    if (!container) {
      console.log('No container found for widget rendering');
      return;
    }
    
    console.log('Attempting to render widget content...');
    console.log('window.PromptReviews:', window.PromptReviews);
    
    if (window.PromptReviews?.renderMultiWidget) {
      const reviewsToRender =
        selectedWidget?.reviews && selectedWidget.reviews.length > 0
          ? selectedWidget.reviews.slice(0, 3)
          : staticReviews;
      
      const widgetData = {
        reviews: reviewsToRender,
        design: design,
        businessSlug: 'example-business'
      };
      
      console.log('Widget data:', widgetData);
      console.log('Selected widget reviews:', selectedWidget?.reviews);
      console.log('Reviews to render:', reviewsToRender);
      if (reviewsToRender && reviewsToRender.length > 0) {
          console.log('First review structure:', reviewsToRender[0]);
      }
      
      try {
        // Mark the container as managed by the widget script
        container.dataset.widgetManaged = 'true';
        window.PromptReviews.renderMultiWidget(container, widgetData);
        console.log('Widget rendered successfully');
        setWidgetRendered(true);
      } catch (error) {
        console.error('Error rendering widget:', error);
        container.innerHTML = '<div class="text-center text-red-600 py-8">Error rendering widget: ' + (error instanceof Error ? error.message : String(error)) + '</div>';
      }
    } else {
      console.error('renderMultiWidget function not found');
      // Show a simple fallback with the data
      container.innerHTML = `
        <div class="text-center py-8 bg-white/90 backdrop-blur-sm rounded-lg">
          <div class="text-red-600 mb-4">Widget function not found</div>
          <div class="text-sm text-gray-600">
            <p>Reviews: ${staticReviews.length}</p>
            <p>Design: ${JSON.stringify(design).substring(0, 100)}...</p>
          </div>
        </div>
      `;
    }
  }, [selectedWidget, design]);

  // Optimized widget rendering effect with debouncing
  useEffect(() => {
    if (!isClient || isLoading) return;

    const renderWidget = () => {
      const container = previewContainerRef.current;
      
      if (!container) {
        return;
      }

      // Clear any existing content safely
      if (container.innerHTML) {
        // If widget script has modified the container, let it handle cleanup
        if (window.PromptReviews?.cleanupWidget) {
          try {
            window.PromptReviews.cleanupWidget(container);
          } catch (error) {
            console.warn('Error during widget cleanup:', error);
          }
        }
        // Clear the container after cleanup
        container.innerHTML = '';
      }
      
      // Check if script is already loaded
      if (window.PromptReviews?.renderMultiWidget) {
        scriptLoadedRef.current = true;
        renderWidgetContent();
        return;
      }
      
      // Only load script once
      if (scriptLoadedRef.current) {
        return;
      }
      
      // Create script element
      const script = document.createElement('script');
      script.src = '/widgets/multi/widget-embed.js';
      script.async = true;
      
      script.onload = () => {
        console.log('Widget script loaded successfully');
        scriptLoadedRef.current = true;
        // Wait a bit for the script to initialize
        renderTimeoutRef.current = setTimeout(() => {
          console.log('Checking for renderMultiWidget function...');
          console.log('window.PromptReviews:', window.PromptReviews);
          renderWidgetContent();
        }, 100);
      };
      
      script.onerror = (error) => {
        console.error('Failed to load widget script:', error);
        container.innerHTML = `
          <div class="text-center py-8 bg-white/90 backdrop-blur-sm rounded-lg">
            <div class="text-red-600 mb-4">Failed to load widget script</div>
            <div class="text-sm text-gray-600">
              <p>Error: ${error}</p>
              <p>Reviews: ${staticReviews.length}</p>
              <p>Design: ${JSON.stringify(design).substring(0, 100)}...</p>
            </div>
          </div>
        `;
      };
      
      document.head.appendChild(script);
    };

    // Clear any existing timeout
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    // Small delay to ensure DOM is ready
    renderTimeoutRef.current = setTimeout(renderWidget, 100);
    
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [isClient, isLoading, renderWidgetContent]);

  // Debounced design change effect to prevent excessive re-rendering
  useEffect(() => {
    if (!isClient || !selectedWidget) return;

    const debounceTimeout = setTimeout(() => {
      const container = previewContainerRef.current;
      if (container && window.PromptReviews?.renderMultiWidget) {
        // Only re-render if the widget is already initialized
        if (container.dataset.widgetInitialized === 'true') {
          console.log('Design changed, re-rendering widget...');
          renderWidgetContent();
        }
      }
    }, 500); // 500ms debounce for design changes

    return () => clearTimeout(debounceTimeout);
  }, [design, selectedWidget, isClient, renderWidgetContent]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      const container = previewContainerRef.current;
      if (container && window.PromptReviews?.cleanupWidget) {
        try {
          // Only cleanup if the widget script managed this container
          if (container.dataset.widgetManaged === 'true') {
            window.PromptReviews.cleanupWidget(container);
            delete container.dataset.widgetManaged;
          }
          
          // Clear any pending timeouts
          if (renderTimeoutRef.current) {
            clearTimeout(renderTimeoutRef.current);
          }
          
          // Reset script loaded flag
          scriptLoadedRef.current = false;
          
          console.log('🧹 Widget page cleanup completed');
        } catch (error) {
          console.warn('Failed to cleanup widget:', error);
        }
      }
    };
  }, []);

  // Add responsive width adjustment handler
  const handleWidthChange = useCallback((newWidth: number) => {
    setDesign(prevDesign => ({
      ...prevDesign,
      width: newWidth
    }));
  }, []);

  // Add effect to handle width changes smoothly
  useEffect(() => {
    if (!isClient || !selectedWidget) return;

    const container = previewContainerRef.current;
    if (container && window.PromptReviews?.renderMultiWidget) {
      // For width changes, we can update more frequently but still debounced
      const widthTimeout = setTimeout(() => {
        if (container.dataset.widgetInitialized === 'true') {
          console.log('Width changed to:', design.width);
          // Update the container width directly for immediate visual feedback
          container.style.maxWidth = `${design.width}px`;
          container.style.width = '100%';
          
          // Then re-render the widget with the new design
          renderWidgetContent();
        }
      }, 200); // Shorter debounce for width changes

      return () => clearTimeout(widthTimeout);
    }
  }, [design.width, selectedWidget, isClient, renderWidgetContent]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FiveStarSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <button
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <div className="space-y-4">
        {/* Widget Preview Section */}
        <div className="p-6 relative">
          <div className="relative mb-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">Widget Preview</h2>
              <p className="mt-2 text-white/80">
                {selectedWidget ? `Editing: ${selectedWidget.name}` : 'Select a widget to see its preview'}
              </p>
            </div>
            <div className="absolute top-1/2 right-0 -translate-y-1/2">
            <WidgetActions
              onEditStyle={openStyleModal}
              onManageReviews={openReviewModal}
              onGetEmbedCode={getEmbedCode}
              selectedWidget={selectedWidget}
            />
            </div>
          </div>
          
          <div className="relative w-full max-w-4xl mx-auto" style={{ minHeight: '600px' }}>
            <div 
              ref={previewContainerRef}
              className="w-full h-full min-h-[600px]"
              style={{
                willChange: 'auto',
                contain: 'layout style paint',
                transform: 'translateZ(0)', // Force hardware acceleration
                overflow: 'visible', // Ensure content isn't clipped
                paddingBottom: '2rem' // Add bottom padding to ensure submit button is visible
              }}
            >
              {/* This container is populated by the widget script, kept empty for React */}
            </div>
            {!widgetRendered && (
              <div className="absolute inset-0 flex items-center justify-center h-full">
                <div className="text-center">
                  <FiveStarSpinner />
                  <p className="mt-4 text-white/80">Loading widget preview...</p>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Widget Management Dashboard */}
        <PageCard className="bg-transparent shadow-none">
          <div className="text-left mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-4xl font-bold text-gray-900 leading-tight">Your widgets</h1>
              <button
                onClick={openNewWidgetModal}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-blue rounded-md hover:bg-slate-blue/90 flex items-center"
              >
                <FaPlus className="mr-2" />
                New Widget
              </button>
            </div>
            <p className="text-gray-600 text-base leading-relaxed max-w-2xl">
              Create and manage your review widgets. Customize their appearance and select which reviews to display.
            </p>
          </div>
          
          {/* Widget List Component */}
          <WidgetList
            onSelectWidget={setSelectedWidget}
            selectedWidgetId={selectedWidget?.id}
            onDesignChange={setDesign}
            design={design}
            onWidgetReviewsChange={() => {
              // Refresh widget list when reviews change
              console.log('Widget reviews changed, refreshing...');
            }}
          />
        </PageCard>
      </div>
    </div>
  );
}

