'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import OverviewStats from '@/components/GoogleBusinessProfile/OverviewStats';
import BusinessHealthMetrics from '@/components/GoogleBusinessProfile/BusinessHealthMetrics';

const RESIZE_EVENT_TYPE = 'google-business-optimizer:resize';
const REQUEST_RESIZE_EVENT_TYPE = 'google-business-optimizer:request-resize';
const READY_EVENT_TYPE = 'google-business-optimizer:ready';

interface GoogleBusinessOptimizerEmbedProps {
  allowedOrigins: string[];
}

function sanitizeOrigins(origins: string[]): string[] {
  return origins
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter((origin) => origin.length > 0)
    .filter((origin) => origin.startsWith('https://') || origin.startsWith('http://'));
}

function computeDocumentHeight(container: HTMLElement | null): number {
  const body = document.body;
  const html = document.documentElement;

  const measurements = [
    body?.scrollHeight ?? 0,
    body?.offsetHeight ?? 0,
    html?.clientHeight ?? 0,
    html?.scrollHeight ?? 0,
    html?.offsetHeight ?? 0,
    container?.scrollHeight ?? 0,
    container?.offsetHeight ?? 0,
  ];

  return Math.max(...measurements);
}

export default function GoogleBusinessOptimizerEmbed({
  allowedOrigins,
}: GoogleBusinessOptimizerEmbedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [targetOrigins, setTargetOrigins] = useState<string[]>([]);
  const allowedSetRef = useRef<Set<string>>(new Set());

  // Resolve the target origins when the component is mounted client-side
  useEffect(() => {
    const sanitized = sanitizeOrigins(allowedOrigins);
    let resolvedAllowedOrigins = new Set(sanitized);
    let resolvedTargets = sanitized;

    if (typeof document !== 'undefined' && document.referrer) {
      try {
        const referrerOrigin = new URL(document.referrer).origin;
        if (resolvedAllowedOrigins.size === 0) {
          console.warn(
            'Google Biz Optimizer embed: EMBED_ALLOWED_ORIGINS is not configured. Falling back to document.referrer. Configure EMBED_ALLOWED_ORIGINS to lock this down.',
          );
          resolvedTargets = [referrerOrigin];
          resolvedAllowedOrigins = new Set([referrerOrigin]);
        } else if (resolvedAllowedOrigins.has(referrerOrigin)) {
          resolvedTargets = [referrerOrigin];
        }
      } catch (error) {
        console.warn('Google Biz Optimizer embed: unable to parse document.referrer', error);
      }
    }

    allowedSetRef.current = resolvedAllowedOrigins;
    setTargetOrigins(resolvedTargets);
  }, [allowedOrigins]);

  useEffect(() => {
    if (targetOrigins.length === 0) {
      return;
    }

    targetOrigins.forEach((origin) => {
      window.parent.postMessage({ type: READY_EVENT_TYPE }, origin);
    });
  }, [targetOrigins]);

  useEffect(() => {
    if (!containerRef.current || targetOrigins.length === 0) {
      return;
    }

    let lastHeight = 0;
    let throttleTimeout: ReturnType<typeof setTimeout> | null = null;
    let pendingForce = false;

    const sendHeight = (force = false) => {
      if (!containerRef.current) return;
      const height = computeDocumentHeight(containerRef.current);
      if (!force && Math.abs(height - lastHeight) < 4) {
        return;
      }
      lastHeight = height;
      targetOrigins.forEach((origin) => {
        window.parent.postMessage({ type: RESIZE_EVENT_TYPE, height }, origin);
      });
    };

    const scheduleHeight = (force = false) => {
      if (throttleTimeout) {
        pendingForce = pendingForce || force;
        return;
      }

      pendingForce = force;
      throttleTimeout = setTimeout(() => {
        throttleTimeout = null;
        const forceNext = pendingForce;
        pendingForce = false;
        sendHeight(forceNext);
      }, 180);
    };

    const handleMessage = (event: MessageEvent) => {
      if (allowedSetRef.current.size > 0 && !allowedSetRef.current.has(event.origin)) {
        return;
      }

      if (event.data?.type === REQUEST_RESIZE_EVENT_TYPE) {
        sendHeight(true);
      }
    };

    const handleLoad = () => sendHeight(true);

    window.addEventListener('message', handleMessage);
    window.addEventListener('load', handleLoad);

    let resizeCleanup: (() => void) | null = null;

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        scheduleHeight(false);
      });

      observer.observe(containerRef.current);
      resizeCleanup = () => observer.disconnect();
    } else {
      console.warn('Google Biz Optimizer embed: ResizeObserver not supported, falling back to window resize events.');
      const fallbackResizeHandler = () => scheduleHeight(false);
      window.addEventListener('resize', fallbackResizeHandler);
      resizeCleanup = () => window.removeEventListener('resize', fallbackResizeHandler);
      scheduleHeight(true);
    }

    const initialTimers = [0, 150, 500, 1200].map((delay) =>
      setTimeout(() => sendHeight(true), delay),
    );

    return () => {
      resizeCleanup?.();
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('load', handleLoad);
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
      initialTimers.forEach((timer) => clearTimeout(timer));
    };
  }, [targetOrigins]);

  const overviewStatsData = useMemo(
    () => ({
      totalReviews: 247,
      reviewTrend: 23,
      averageRating: 4.7,
      monthlyReviewData: [
        { month: 'Oct', fiveStar: 18, fourStar: 3, threeStar: 1, twoStar: 0, oneStar: 0, noRating: 0 },
        { month: 'Nov', fiveStar: 19, fourStar: 4, threeStar: 1, twoStar: 0, oneStar: 0, noRating: 0 },
        { month: 'Dec', fiveStar: 21, fourStar: 5, threeStar: 2, twoStar: 0, oneStar: 1, noRating: 0 },
        { month: 'Jan', fiveStar: 24, fourStar: 6, threeStar: 2, twoStar: 0, oneStar: 0, noRating: 0 },
        { month: 'Feb', fiveStar: 27, fourStar: 5, threeStar: 1, twoStar: 1, oneStar: 0, noRating: 0 },
        { month: 'Mar', fiveStar: 31, fourStar: 6, threeStar: 2, twoStar: 0, oneStar: 0, noRating: 0 },
      ],
    }),
    [],
  );

  const businessHealthData = useMemo(
    () => ({
      profileData: {
        categoriesUsed: 3,
        maxCategories: 9,
        servicesCount: 12,
        servicesWithDescriptions: 9,
        businessDescriptionLength: 640,
        businessDescriptionMaxLength: 750,
        seoScore: 82,
        photosByCategory: {
          LOGO: 1,
          COVER: 2,
          INTERIOR: 14,
          EXTERIOR: 9,
          TEAM: 4,
          PRODUCT: 16,
        },
        businessAttributes: 12,
        productsCount: 6,
      },
      engagementData: {
        unrespondedReviews: 8,
        totalReviews: 247,
        totalQuestions: 17,
        unansweredQuestions: 2,
        recentPosts: 2,
        recentPhotos: 5,
        lastPostDate: '3 days ago',
        lastPhotoDate: '1 week ago',
      },
      performanceData: {
        monthlyViews: 12400,
        viewsTrend: 12,
        topSearchQueries: ['artisan bread near me', 'downtown seattle bakery', 'gluten free cupcakes'],
        customerActions: {
          websiteClicks: 420,
          phoneCalls: 138,
          directionRequests: 352,
          photoViews: 18400,
        },
      },
      opportunities: [
        {
          id: 'respond-reviews',
          priority: 'high',
          title: 'Reply to 8 new reviews',
          description: 'Keep response time under 12 hours to protect your customer experience badge.',
        },
        {
          id: 'add-services',
          priority: 'medium',
          title: 'Publish 3 seasonal services',
          description: 'Highlight catering, wreath workshops, and private events for holiday discovery.',
        },
        {
          id: 'post-update',
          priority: 'medium',
          title: 'Share a March specials post',
          description: 'Posts weekly keep you in the Updates carousel and boost discovery searches.',
        },
        {
          id: 'upload-photos',
          priority: 'low',
          title: 'Add 6 fresh product photos',
          description: 'Profiles with current photos see 35% more site visits on average.',
        },
      ],
    }),
    [],
  );

  const opportunityItems = useMemo(
    () => [
      {
        title: 'Reply to 8 unanswered reviews',
        impact: '+15% conversion lift',
        detail: 'Keep responses under 24 hours to stay in Google’s top performers cohort.',
      },
      {
        title: 'Add 5 seasonal photos',
        impact: '+9% discovery searches',
        detail: 'Fresh photography boosts engagement and unlocks new keyword clusters.',
      },
      {
        title: 'Publish a March promo post',
        impact: '+12% directions requests',
        detail: 'Campaign posts keep you visible in the “Updates” carousel for 7 days.',
      },
    ],
    [],
  );

  return (
    <div
      ref={containerRef}
      className="min-h-screen w-full bg-slate-50 text-slate-800"
    >
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                Viewing Example Dashboard
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-gray-900">Sarah&apos;s Boutique Bakery</h1>
              <p className="text-sm text-gray-600">Downtown Seattle · Main Street</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-emerald-600">Momentum this quarter</p>
              <p className="text-lg font-semibold text-emerald-700">+124 reviews acquired</p>
              <p className="text-xs text-emerald-600/80">Embed the Optimizer to preview live results for your own locations.</p>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Overview</h2>
                <p className="text-sm text-gray-600">
                  Monitor reviews, profile health, and engagement for your Google Business locations.
                </p>
              </div>
              <button
                className="flex items-center gap-2 rounded-full border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-500"
                type="button"
                disabled
              >
                <Icon name="MdDownload" className="h-4 w-4" />
                Download PDF (full app)
              </button>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Locations</p>
              <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                Google Business Profile: Sarah&apos;s Boutique Bakery · Main Street
              </div>
            </div>
          </div>
        </section>

        <OverviewStats
          totalReviews={overviewStatsData.totalReviews}
          reviewTrend={overviewStatsData.reviewTrend}
          averageRating={overviewStatsData.averageRating}
          monthlyReviewData={overviewStatsData.monthlyReviewData}
        />

        <BusinessHealthMetrics
          locationId="example-location"
          profileData={businessHealthData.profileData}
          engagementData={businessHealthData.engagementData}
          performanceData={businessHealthData.performanceData}
          optimizationOpportunities={businessHealthData.opportunities}
        />
      </main>
    </div>
  );
}
