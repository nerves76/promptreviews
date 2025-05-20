'use client';
import React, { useState, useRef, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaCopy, FaCode } from 'react-icons/fa';
import WidgetList from './WidgetList';
import { createBrowserClient } from '@supabase/ssr';

// Mock reviews for preview/demo
const mockReviews = [
  {
    id: 1,
    review: 'PromptReviews made it so easy to collect feedback from my clients. Highly recommended!',
    name: 'Jane Doe',
    role: 'Business Owner',
  },
  {
    id: 2,
    review: 'The widget was simple to install and looks great on my site.',
    name: 'John Smith',
    role: 'Marketing Director',
  },
  {
    id: 3,
    review: 'I love how customizable the reviews carousel is. My customers trust us more now.',
    name: 'Emily Chen',
    role: 'Customer',
  },
];

// Helper to convert hex to rgba
function hexToRgba(hex: string, alpha: number) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
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
    bgColor: '#ffffff',
    textColor: '#22223b',
    accentColor: '#6c47ff',
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
  });

  // Fetch reviews for selected widget
  useEffect(() => {
    if (!selectedWidget) return;
    setLoadingWidget(true);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase
      .from('widgets')
      .select('id, name, reviews')
      .eq('id', selectedWidget.id)
      .single()
      .then(async ({ data, error }) => {
        if (data && data.reviews && Array.isArray(data.reviews)) {
          // Optionally, fetch full review details if only IDs are stored
          setWidgetReviews(data.reviews);
        } else {
          setWidgetReviews([]);
        }
        setLoadingWidget(false);
      });
  }, [selectedWidget]);

  // For now, use widgetReviews if available, else mockReviews
  const reviews = widgetReviews.length > 0 ? widgetReviews : mockReviews;
  const total = reviews.length;

  // Auto-advance logic
  useEffect(() => {
    if (!design.autoAdvance || total <= 1) return;
    const timer = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, (design.slideshowSpeed ?? 4) * 1000);
    return () => clearTimeout(timer);
  }, [current, design.autoAdvance, design.slideshowSpeed, total]);

  // Fade-in effect on review change
  useEffect(() => {
    setFadeIn(false);
    const t = setTimeout(() => setFadeIn(true), 30);
    return () => clearTimeout(t);
  }, [current]);

  // Reset timer on manual navigation
  const goTo = (idx: number) => {
    setCurrent((idx + total) % total);
    // Announce for screen readers
    const live = document.getElementById('carousel-live');
    if (live) live.textContent = `Showing review ${((idx + total) % total) + 1} of ${total}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  };

  const embedCode = `<div id="promptreviews-widget" data-client="YOUR_CLIENT_ID"></div>\n<script src="https://yourdomain.com/widget.js" async></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Schema.org JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': 'PromptReviews',
    'review': reviews.map(r => ({
      '@type': 'Review',
      'reviewBody': r.review,
      'author': {
        '@type': 'Person',
        'name': r.name,
        'jobTitle': r.role,
      },
    })),
  };

  return (
    <div>
      {/* Widget Preview on Gradient */}
      <div className="max-w-3xl mx-auto mb-12">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Live widget preview</h2>
        <section
          className="flex flex-col justify-center relative"
          aria-label="Review carousel preview"
          style={{
            background: hexToRgba(design.bgColor, design.bgOpacity ?? 1),
            color: design.textColor,
            borderRadius: design.borderRadius,
            boxShadow: design.shadow ? '0 4px 24px 0 rgba(80, 60, 180, 0.10)' : 'none',
            padding: 48,
            minHeight: 320,
            maxWidth: 800,
            margin: '0 auto',
            border: design.border ? `${design.borderWidth ?? 2}px solid ${design.accentColor}` : 'none',
            fontSize: design.fontSize,
          }}
        >
          {loadingWidget ? (
            <div className="text-center py-8 text-gray-500">Loading widget…</div>
          ) : (
            <div
              className="relative flex items-center justify-center"
              tabIndex={0}
              onKeyDown={handleKeyDown}
              aria-roledescription="carousel"
              aria-label="Reviews carousel"
              ref={carouselRef}
            >
              <button
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-indigo-700 text-white rounded-full p-2 shadow hover:bg-indigo-800 focus:outline-none"
                onClick={() => goTo(current - 1)}
                aria-label="Previous review"
              >
                <FaChevronLeft />
              </button>
              <div
                className="w-full max-w-xl mx-auto px-6"
                role="group"
                aria-roledescription="slide"
                aria-label={`Review ${current + 1} of ${total}`}
                style={{
                  opacity: fadeIn ? 1 : 0,
                  transition: 'opacity 0.5s',
                  position: 'relative',
                }}
              >
                {design.showQuotes && (
                  <>
                    <span
                      aria-hidden="true"
                      className="select-none pointer-events-none"
                      style={{
                        position: 'absolute',
                        top: -32,
                        left: -24,
                        fontSize: 96,
                        color: design.textColor,
                        opacity: 0.08,
                        fontWeight: 900,
                        zIndex: 0,
                      }}
                    >
                      “
                    </span>
                    <span
                      aria-hidden="true"
                      className="select-none pointer-events-none"
                      style={{
                        position: 'absolute',
                        bottom: -32,
                        right: -24,
                        fontSize: 96,
                        color: design.textColor,
                        opacity: 0.08,
                        fontWeight: 900,
                        zIndex: 0,
                      }}
                    >
                      ”
                    </span>
                  </>
                )}
                <article
                  className="text-center flex flex-col items-center gap-4 py-6"
                  itemScope
                  itemType="https://schema.org/Review"
                >
                  <p
                    className="text-lg text-gray-800 mb-2 md:mb-4 px-2 md:px-8"
                    itemProp="reviewBody"
                    style={{ lineHeight: design.lineSpacing }}
                  >
                    {reviews[current].review}
                  </p>
                  <div className="mt-2 md:mt-4 flex flex-col items-center gap-1">
                    <span className="font-semibold text-indigo-700" itemProp="author" itemScope itemType="https://schema.org/Person">
                      <span itemProp="name">{reviews[current].name}</span>
                    </span>
                    <span className="text-sm text-gray-500" itemProp="author" itemScope itemType="https://schema.org/Person">
                      <span itemProp="jobTitle">{reviews[current].role}</span>
                    </span>
                  </div>
                </article>
              </div>
              <button
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-indigo-700 text-white rounded-full p-2 shadow hover:bg-indigo-800 focus:outline-none"
                onClick={() => goTo(current + 1)}
                aria-label="Next review"
              >
                <FaChevronRight />
              </button>
            </div>
          )}
          <div
            className="absolute left-1/2 -translate-x-1/2 flex justify-center gap-2 w-full"
            aria-label="Slide indicators"
            style={{ bottom: '20px' }}
          >
            {reviews.map((_, idx) => (
              <button
                key={idx}
                className={`w-3 h-3 rounded-full ${idx === current ? 'bg-indigo-500' : 'bg-gray-300'} focus:outline-none`}
                aria-label={`Go to review ${idx + 1}`}
                aria-current={idx === current ? 'true' : undefined}
                onClick={() => goTo(idx)}
              />
            ))}
          </div>
          <div id="carousel-live" className="sr-only" aria-live="polite" />
        </section>
      </div>
      {/* Main Card Below */}
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8 relative">
        <div className="absolute -top-6 -left-6 z-10 bg-white rounded-full shadow p-3 flex items-center justify-center">
          <FaCode className="w-9 h-9 text-indigo-500" />
        </div>
        <h1 className="text-4xl font-bold text-[#452F9F] mb-2">Your Widgets</h1>
        <p className="mt-2 text-gray-500 text-sm max-w-md mb-8">
          Create up to 3 widgets. Add up to 8 reviews per widget. Edit your reviews to fit by selecting the most impactful lines and removing the rest. Widgets are accessibly designed and SEO friendly.
        </p>
        {/* Widget Management Section */}
        <WidgetList onSelectWidget={setSelectedWidget} selectedWidgetId={selectedWidget?.id} onDesignChange={setDesign} />
        <hr className="my-10" />
        {/* JSON-LD for SEO */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </div>
    </div>
  );
} 