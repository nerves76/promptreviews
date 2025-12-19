'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import OverviewStats from '@/components/GoogleBusinessProfile/OverviewStats';
import PostingFrequencyChart from '@/components/GoogleBusinessProfile/PostingFrequencyChart';
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

interface LeadFormData {
  email: string;
  businessName: string;
  googleMapsUrl: string;
}

interface SessionData {
  token: string;
  expiresAt: string;
  sessionId: string;
  leadId?: string;
}

interface AvailableLocation {
  id?: string;
  name: string;
  legacyName?: string;
  canonicalName?: string;
  rawName?: string;
  title?: string;
  address?: Record<string, any> | null;
  placeId?: string;
  accountName?: string;
}

export default function GoogleBusinessOptimizerEmbed({
  allowedOrigins,
}: GoogleBusinessOptimizerEmbedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [targetOrigins, setTargetOrigins] = useState<string[]>([]);
  const allowedSetRef = useRef<Set<string>>(new Set());

  // Capture tracking parameters from URL and embed context
  const [trackingParams, setTrackingParams] = useState<{
    source?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    embedUrl?: string;
    embedDomain?: string;
    embedPath?: string;
  }>({});

  // Initialize states - always start with dashboard
  const [showLeadForm, setShowLeadForm] = useState(false); // Always start with dashboard/preview
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [leadFormData, setLeadFormData] = useState<LeadFormData>({
    email: '',
    businessName: '',
    googleMapsUrl: ''
  });
  const [googleBusinessData, setGoogleBusinessData] = useState<any>(null);
  const [isLoadingBusinessData, setIsLoadingBusinessData] = useState(false);
  const [availableLocations, setAvailableLocations] = useState<AvailableLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<AvailableLocation | null>(null);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [locationGroupDiagnostics, setLocationGroupDiagnostics] = useState<any[]>([]);
  const [awaitingLocationChoice, setAwaitingLocationChoice] = useState(false);
  const manualLocationSelectionRef = useRef(false);
  // Cache the original locations list to prevent loss on detail fetches
  const cachedLocationsRef = useRef<AvailableLocation[]>([]);

  // Extract tracking parameters and embed context on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const params: any = {};

      // Capture manual source parameter if provided
      if (urlParams.get('source')) {
        params.source = urlParams.get('source');
      }

      // Capture standard UTM parameters if provided
      if (urlParams.get('utm_source')) {
        params.utmSource = urlParams.get('utm_source');
      }
      if (urlParams.get('utm_medium')) {
        params.utmMedium = urlParams.get('utm_medium');
      }
      if (urlParams.get('utm_campaign')) {
        params.utmCampaign = urlParams.get('utm_campaign');
      }

      // AUTOMATIC EMBED SOURCE DETECTION
      // Capture the parent page URL where this iframe is embedded
      if (document.referrer) {
        params.embedUrl = document.referrer;

        try {
          const referrerUrl = new URL(document.referrer);
          params.embedDomain = referrerUrl.hostname;
          params.embedPath = referrerUrl.pathname;

          // If no manual source was provided, auto-generate one from the embed location
          if (!params.source) {
            // Create a readable source from domain and path
            // e.g., "example.com/blog/seo-tips" becomes "example-com-blog-seo-tips"
            const autoSource = `${referrerUrl.hostname}${referrerUrl.pathname}`
              .replace(/^www\./, '') // Remove www
              .replace(/\.[^.]+$/, '') // Remove TLD for cleaner sources
              .replace(/[^a-zA-Z0-9]+/g, '-') // Replace non-alphanumeric with dashes
              .replace(/^-+|-+$/g, '') // Trim dashes from start/end
              .toLowerCase()
              .substring(0, 50); // Limit length

            params.source = autoSource || 'unknown-embed';
            console.log('🤖 Auto-detected embed source:', params.source);
          }
        } catch (e) {
          console.error('Failed to parse referrer URL:', e);
          params.embedDomain = 'unknown';
          params.embedPath = '/';
          if (!params.source) {
            params.source = 'unknown-embed';
          }
        }
      } else {
        // No referrer means direct access or same-origin
        params.embedUrl = 'direct-access';
        params.embedDomain = window.location.hostname;
        params.embedPath = window.location.pathname;
        if (!params.source) {
          params.source = 'direct-access';
        }
      }

      setTrackingParams(params);

      // Log for debugging
      console.log('📍 Embed tracking captured:', {
        manualSource: params.source,
        autoDetected: {
          embedUrl: params.embedUrl,
          embedDomain: params.embedDomain,
          embedPath: params.embedPath
        },
        utmParams: {
          utm_source: params.utmSource,
          utm_medium: params.utmMedium,
          utm_campaign: params.utmCampaign
        }
      });
    }
  }, []);

  const previewLocations = useMemo<AvailableLocation[]>(
    () => [
      {
        id: 'locations/main-street',
        name: "Barth's Oobleck Supply — Main Lab",
        title: "Barth's Oobleck Supply — Main Lab",
        address: { addressLines: ['123 Non-Newtonian Ave'], locality: 'Portland', administrativeArea: 'OR' },
      },
      {
        id: 'locations/pike-place',
        name: "Barth's Oobleck Supply — Outreach Center",
        title: "Barth's Oobleck Supply — Outreach Center",
        address: { addressLines: ['89 Viscosity Way'], locality: 'Portland', administrativeArea: 'OR' },
      },
      {
        id: 'locations/capitol-hill',
        name: "Barth's Oobleck Supply — Retail Depot",
        title: "Barth's Oobleck Supply — Retail Depot",
        address: { addressLines: ['412 Polymer Blvd'], locality: 'Portland', administrativeArea: 'OR' },
      },
    ],
    [],
  );

  const previewLocationShowcase = useMemo(
    () => ({
      'locations/main-street': {
        hero: {
          locationLabel: 'Industrial Research Campus · Main Lab',
          momentum: '+124 viscosity lab reviews',
        },
        overviewStats: {
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
        },
        health: {
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
            topSearchQueries: ['non-newtonian fluid lab', 'oobleck viscosity demo', 'STEM lab experiences'],
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
              title: 'Reply to 8 new lab reviews',
              description: 'Respond within 12 hours to keep your lab safety badge active.',
            },
            {
              id: 'add-services',
              priority: 'medium',
              title: 'Publish 3 new experiment kits',
              description: 'Highlight classroom kits, maker-space bundles, and STEM week demos for spring demand.',
            },
            {
              id: 'post-update',
              priority: 'medium',
              title: 'Share a March lab demo post',
              description: 'Weekly experiment demos keep you in Google Updates and boost discovery searches.',
            },
            {
              id: 'upload-photos',
              priority: 'low',
              title: 'Add 6 fresh experiment photos',
              description: 'Profiles with current lab photos see 35% more site visits on average.',
            },
          ],
        },
      },
      'locations/pike-place': {
        hero: {
          locationLabel: 'Education Outreach Hub · Traveling Experiments',
          momentum: '+89 classroom reviews',
        },
        overviewStats: {
          totalReviews: 186,
          reviewTrend: 17,
          averageRating: 4.6,
          monthlyReviewData: [
            { month: 'Oct', fiveStar: 14, fourStar: 3, threeStar: 1, twoStar: 0, oneStar: 0, noRating: 0 },
            { month: 'Nov', fiveStar: 15, fourStar: 4, threeStar: 1, twoStar: 0, oneStar: 0, noRating: 0 },
            { month: 'Dec', fiveStar: 18, fourStar: 4, threeStar: 1, twoStar: 1, oneStar: 0, noRating: 0 },
            { month: 'Jan', fiveStar: 20, fourStar: 5, threeStar: 2, twoStar: 0, oneStar: 0, noRating: 0 },
            { month: 'Feb', fiveStar: 22, fourStar: 5, threeStar: 1, twoStar: 0, oneStar: 0, noRating: 0 },
            { month: 'Mar', fiveStar: 25, fourStar: 5, threeStar: 1, twoStar: 0, oneStar: 0, noRating: 0 },
          ],
        },
        health: {
          profileData: {
            categoriesUsed: 4,
            maxCategories: 9,
            servicesCount: 10,
            servicesWithDescriptions: 8,
            businessDescriptionLength: 590,
            businessDescriptionMaxLength: 750,
            seoScore: 79,
            photosByCategory: {
              LOGO: 1,
              COVER: 2,
              INTERIOR: 10,
              EXTERIOR: 8,
              TEAM: 5,
              PRODUCT: 13,
            },
            businessAttributes: 10,
            productsCount: 5,
          },
          engagementData: {
            unrespondedReviews: 5,
            totalReviews: 186,
            totalQuestions: 12,
            unansweredQuestions: 1,
            recentPosts: 3,
            recentPhotos: 4,
            lastPostDate: '2 days ago',
            lastPhotoDate: '5 days ago',
          },
          performanceData: {
            monthlyViews: 15600,
            viewsTrend: 18,
            topSearchQueries: ['science assembly seattle', 'school field trip science', 'traveling stem lab'],
            customerActions: {
              websiteClicks: 510,
              phoneCalls: 162,
              directionRequests: 410,
              photoViews: 20600,
            },
          },
          opportunities: [
            {
              id: 'respond-reviews',
              priority: 'high',
              title: 'Reply to 5 new teacher reviews',
              description: 'Educators mention excited students—acknowledge the outcomes and invite them back.',
            },
            {
              id: 'add-photos',
              priority: 'medium',
              title: 'Showcase classroom workshops',
              description: 'Add photos of school demos to capture district interest this semester.',
            },
            {
              id: 'post-tour',
              priority: 'medium',
              title: 'Promote mobile science tour',
              description: 'Create a Google Post highlighting your upcoming museum and school visits.',
            },
            {
              id: 'activate-attributes',
              priority: 'low',
              title: 'Enable field-trip friendly attributes',
              description: 'Add accessibility and supervision details to improve school discovery.',
            },
          ],
        },
      },
      'locations/capitol-hill': {
        hero: {
          locationLabel: 'Retail Depot · DIY Supply Hub',
          momentum: '+98 hobbyist reviews',
        },
        overviewStats: {
          totalReviews: 163,
          reviewTrend: 29,
          averageRating: 4.8,
          monthlyReviewData: [
            { month: 'Oct', fiveStar: 16, fourStar: 2, threeStar: 0, twoStar: 0, oneStar: 0, noRating: 0 },
            { month: 'Nov', fiveStar: 17, fourStar: 3, threeStar: 1, twoStar: 0, oneStar: 0, noRating: 0 },
            { month: 'Dec', fiveStar: 20, fourStar: 3, threeStar: 1, twoStar: 0, oneStar: 0, noRating: 0 },
            { month: 'Jan', fiveStar: 23, fourStar: 4, threeStar: 1, twoStar: 0, oneStar: 0, noRating: 0 },
            { month: 'Feb', fiveStar: 25, fourStar: 4, threeStar: 1, twoStar: 0, oneStar: 0, noRating: 0 },
            { month: 'Mar', fiveStar: 28, fourStar: 4, threeStar: 1, twoStar: 0, oneStar: 0, noRating: 0 },
          ],
        },
        health: {
          profileData: {
            categoriesUsed: 2,
            maxCategories: 9,
            servicesCount: 14,
            servicesWithDescriptions: 12,
            businessDescriptionLength: 720,
            businessDescriptionMaxLength: 750,
            seoScore: 88,
            photosByCategory: {
              LOGO: 1,
              COVER: 2,
              INTERIOR: 16,
              EXTERIOR: 7,
              TEAM: 5,
              PRODUCT: 18,
            },
            businessAttributes: 14,
            productsCount: 7,
          },
          engagementData: {
            unrespondedReviews: 3,
            totalReviews: 163,
            totalQuestions: 9,
            unansweredQuestions: 1,
            recentPosts: 4,
            recentPhotos: 7,
            lastPostDate: '1 day ago',
            lastPhotoDate: '4 days ago',
          },
          performanceData: {
            monthlyViews: 11200,
            viewsTrend: 26,
            topSearchQueries: ['buy oobleck supplies', 'science fair kit store', 'STEM slime kit'],
            customerActions: {
              websiteClicks: 378,
              phoneCalls: 142,
              directionRequests: 298,
              photoViews: 16100,
            },
          },
          opportunities: [
            {
              id: 'respond-reviews',
              priority: 'medium',
              title: 'Thank 3 loyal repeat buyers',
              description: 'Personal replies to recurring makers unlock your loyalty badge.',
            },
            {
              id: 'add-vegan-services',
              priority: 'high',
              title: 'Highlight STEM subscription kits',
              description: '“STEM kit” searches are up 34%. Add full detail for your monthly kits.',
            },
            {
              id: 'schedule-posts',
              priority: 'medium',
              title: 'Schedule weekend workshop posts',
              description: 'Keep weekend DIY posts queued to stay visible during peak retail hours.',
            },
            {
              id: 'fresh-photos',
              priority: 'low',
              title: 'Upload DIY project photos',
              description: 'New project photos keep you ranking for “science fair kit” searches.',
            },
          ],
        },
      },
    }),
    [],
  );

  const selectedPreviewData = useMemo(() => {
    if (!selectedLocation) {
      return undefined;
    }

    const key = selectedLocation.id || selectedLocation.name;
    return previewLocationShowcase[key as keyof typeof previewLocationShowcase];
  }, [selectedLocation, previewLocationShowcase]);


    
const overviewStatsData = useMemo(() => {
    const fallbackMonthlyData = [
      { month: 'Oct', fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0, noRating: 0 },
      { month: 'Nov', fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0, noRating: 0 },
      { month: 'Dec', fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0, noRating: 0 },
      { month: 'Jan', fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0, noRating: 0 },
      { month: 'Feb', fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0, noRating: 0 },
      { month: 'Mar', fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0, noRating: 0 },
    ];

    if (googleBusinessData) {
      const reviewTrends = googleBusinessData.reviewTrends;
      return {
        hasRealData: true,
        reviewsAvailable: googleBusinessData.reviewsAvailable,
        totalReviews: reviewTrends?.totalReviews || 0,
        reviewTrend: reviewTrends?.reviewTrend || 0,
        averageRating: reviewTrends?.averageRating || 0,
        monthlyReviewData: reviewTrends?.monthlyReviewData || fallbackMonthlyData,
      };
    }

    if (sessionData && googleBusinessData === null && !isLoadingBusinessData) {
      return {
        hasRealData: false,
        noDataAvailable: true,
        totalReviews: 0,
        reviewTrend: 0,
        averageRating: 0,
        monthlyReviewData: [
          { month: 'Oct', fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0, noRating: 0 },
          { month: 'Nov', fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0, noRating: 0 },
          { month: 'Dec', fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0, noRating: 0 },
          { month: 'Jan', fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0, noRating: 0 },
          { month: 'Feb', fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0, noRating: 0 },
          { month: 'Mar', fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0, noRating: 0 },
        ],
      };
    }

    if (selectedPreviewData?.overviewStats) {
      return {
        hasRealData: false,
        isPreview: true,
        totalReviews: selectedPreviewData.overviewStats.totalReviews,
        reviewTrend: selectedPreviewData.overviewStats.reviewTrend,
        averageRating: selectedPreviewData.overviewStats.averageRating,
        monthlyReviewData: selectedPreviewData.overviewStats.monthlyReviewData,
      };
    }

    return {
      hasRealData: false,
      isPreview: true,
      totalReviews: 0,
      reviewTrend: 0,
      averageRating: 0,
      monthlyReviewData: fallbackMonthlyData,
    };
  }, [googleBusinessData, sessionData, isLoadingBusinessData, selectedPreviewData]);

  const businessHealthData = useMemo(() => {
    if (googleBusinessData) {
      return {
        profileData: googleBusinessData.profileData || {
          categoriesUsed: 0,
          maxCategories: 0,
          servicesCount: 0,
          servicesWithDescriptions: 0,
          businessDescriptionLength: 0,
          businessDescriptionMaxLength: 750,
          seoScore: 0,
          photosByCategory: {},
          businessAttributes: 0,
          productsCount: 0,
        },
        engagementData: googleBusinessData.engagementData || {
          unrespondedReviews: 0,
          totalReviews: 0,
          totalQuestions: 0,
          unansweredQuestions: 0,
          recentPosts: 0,
          recentPhotos: 0,
          lastPostDate: undefined,
          lastPhotoDate: undefined,
        },
        performanceData: googleBusinessData.performanceData || {
          monthlyViews: 0,
          viewsTrend: 0,
          topSearchQueries: [],
          customerActions: {
            websiteClicks: 0,
            phoneCalls: 0,
            directionRequests: 0,
            photoViews: 0,
          },
        },
        opportunities: googleBusinessData.optimizationOpportunities || [],
      };
    }

    if (selectedPreviewData?.health) {
      return selectedPreviewData.health;
    }

    return {
      profileData: {
        categoriesUsed: 0,
        maxCategories: 0,
        servicesCount: 0,
        servicesWithDescriptions: 0,
        businessDescriptionLength: 0,
        businessDescriptionMaxLength: 750,
        seoScore: 0,
        photosByCategory: {},
      },
      engagementData: {
        unrespondedReviews: 0,
        totalReviews: 0,
        totalQuestions: 0,
        unansweredQuestions: 0,
        recentPosts: 0,
        recentPhotos: 0,
      },
      performanceData: {
        monthlyViews: 0,
        viewsTrend: 0,
        topSearchQueries: [],
        customerActions: {
          websiteClicks: 0,
          phoneCalls: 0,
          directionRequests: 0,
          photoViews: 0,
        },
      },
      opportunities: [],
    };
  }, [googleBusinessData, selectedPreviewData]);

  // Lead Capture Form Component
  const renderLeadForm = () => (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-blue-100 text-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Glassmorphic container */}
        <div className="bg-white/80 backdrop-blur-lg border border-white/20 rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center">
              <Icon name="MdDownload" className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Google Business Optimizer
            </h1>
            <p className="text-sm text-gray-600">
              Get personalized insights to boost your Google Business Profile performance
            </p>
          </div>

          {/* Error Message */}
          {formError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {formError}
            </div>
          )}

          {/* Google Connection Required */}
          <div className="space-y-6">
            {/* Explanation */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                To analyze your business performance and provide personalized recommendations,
                we need to connect to your Google Business Profile.
              </p>
            </div>

            {/* Google Sign In Button - Primary CTA */}
            <button
              type="button"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-6 rounded-2xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              onClick={() => {
                setIsLoading(true);
                // Initiate Google OAuth flow with session token and tracking params
                const params = new URLSearchParams();
                if (sessionData?.token) params.set('token', sessionData.token);
                if (sessionData?.leadId) params.set('leadId', sessionData.leadId);

                // Pass ALL tracking parameters through OAuth flow
                if (trackingParams.source) params.set('source', trackingParams.source);
                if (trackingParams.embedUrl) params.set('embed_url', trackingParams.embedUrl);
                if (trackingParams.embedDomain) params.set('embed_domain', trackingParams.embedDomain);
                if (trackingParams.embedPath) params.set('embed_path', trackingParams.embedPath);
                if (trackingParams.utmSource) params.set('utm_source', trackingParams.utmSource);
                if (trackingParams.utmMedium) params.set('utm_medium', trackingParams.utmMedium);
                if (trackingParams.utmCampaign) params.set('utm_campaign', trackingParams.utmCampaign);

                // Use absolute URL and redirect parent window if in iframe
                // Google OAuth blocks iframe loading, so we need to redirect the top window
                const baseUrl = window.location.origin || 'https://app.promptreviews.app';
                const oauthUrl = `${baseUrl}/api/embed/auth/google-business?${params.toString()}`;

                // Check if we're in an iframe and redirect appropriately
                const isInIframe = window.self !== window.top;
                if (isInIframe) {
                  // Redirect the parent/top window for OAuth (escapes the iframe)
                  window.top!.location.href = oauthUrl;
                } else {
                  window.location.href = oauthUrl;
                }
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Connecting...
                </div>
              ) : (
                <>
                  <Icon name="FaGoogle" className="h-5 w-5" />
                  Connect Google Business Profile
                </>
              )}
            </button>

            {/* What we access */}
            <div className="bg-blue-50 rounded-xl p-4 text-xs text-blue-800">
              <p className="font-semibold mb-2">What we'll analyze:</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Your business profile information</li>
                <li>• Review ratings and response rates</li>
                <li>• Profile completeness and optimization</li>
                <li>• Customer engagement metrics</li>
              </ul>
            </div>
          </div>

          {/* Privacy Note */}
          <p className="text-xs text-gray-500 text-center mt-6">
            We respect your privacy. Your information is used only to generate your personalized business analysis.
          </p>
        </div>
      </div>
    </div>
  );

  // Dashboard Component (shown after lead capture)
  const renderDashboard = () => {
    const isPreviewMode = !sessionData;
    const reviewsUnavailable = Boolean(googleBusinessData && googleBusinessData.reviewsAvailable === false);
    const insightsUnavailable = Boolean(googleBusinessData && googleBusinessData.insightsAvailable === false);

    // Handle download report
    const handleDownloadReport = async () => {
      if (!googleBusinessData || !sessionData) {
        setDownloadError('Unable to generate report. Please try again.');
        return;
      }

      setIsDownloadingReport(true);
      setDownloadError(null);

      try {
        // Call the API to generate PDF report
        const response = await fetch('/api/embed/optimizer/generate-report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: sessionData.sessionId,
            businessData: googleBusinessData,
            leadData: leadFormData,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate report');
        }

        const blob = await response.blob();

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${googleBusinessData.businessInfo?.name || 'business'}-optimization-report.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Error downloading report:', error);
        setDownloadError('Failed to generate report. Please try again.');
      } finally {
        setIsDownloadingReport(false);
      }
    };

    // Handle disconnect
    const handleDisconnect = () => {
      // Clear all session data from localStorage
      localStorage.removeItem('google-biz-optimizer-token');
      localStorage.removeItem('google-biz-optimizer-expiry');
      localStorage.removeItem('google-biz-optimizer-session-id');
      localStorage.removeItem('google-biz-optimizer-lead-id');

      // Reset state
      setSessionData(null);
      setGoogleBusinessData(null);
      setSelectedLocation(null);
      setAvailableLocations([]);
      setShowLocationSelector(false);
      setFormError(null);

    setLocationGroupDiagnostics([]);
    setAwaitingLocationChoice(false);

    console.log('🔌 Disconnected from Google Business Profile');
  };

    return (
      <div className="min-h-screen w-full bg-slate-50 text-slate-800">
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">


          {awaitingLocationChoice && (
            <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900 shadow-sm">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold">Select a location to load your metrics.</p>
                  <p className="text-blue-800">Choose the location from the list below to see live Google Business data and download your report.</p>
                </div>
              </div>
            </section>
          )}

          {sessionData && (
            <div className="flex justify-end">
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium px-4 py-2 rounded-lg border border-red-200 hover:border-red-300 bg-white hover:bg-red-50 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Disconnect Google Account
              </button>
            </div>
          )}

          {/* Preview Banner for non-authenticated users */}
          {isPreviewMode && (
            <section className="rounded-lg border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100 p-6 shadow-lg">
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 flex-shrink-0" style={{ transform: 'scaleX(-1)' }}>
                  <img
                    src="https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/prompty-teaching-about-your-business.png"
                    alt="Prompty mascot"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between flex-1">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      Get Your Free Report
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Learn how to optimize your Google Business Profile for better visibility in search.
                    </p>
                  </div>
                  <button
                  onClick={() => {
                    // Go directly to Google OAuth with tracking params
                    const params = new URLSearchParams();

                    // Pass ALL tracking parameters
                    if (trackingParams.source) params.set('source', trackingParams.source);
                    if (trackingParams.embedUrl) params.set('embed_url', trackingParams.embedUrl);
                    if (trackingParams.embedDomain) params.set('embed_domain', trackingParams.embedDomain);
                    if (trackingParams.embedPath) params.set('embed_path', trackingParams.embedPath);
                    if (trackingParams.utmSource) params.set('utm_source', trackingParams.utmSource);
                    if (trackingParams.utmMedium) params.set('utm_medium', trackingParams.utmMedium);
                    if (trackingParams.utmCampaign) params.set('utm_campaign', trackingParams.utmCampaign);

                    // Use absolute URL and redirect parent window if in iframe
                    const baseUrl = window.location.origin || 'https://app.promptreviews.app';
                    const oauthUrl = `${baseUrl}/api/embed/auth/google-business${params.toString() ? '?' + params.toString() : ''}`;

                    // Check if we're in an iframe and redirect appropriately
                    const isInIframe = window.self !== window.top;
                    if (isInIframe) {
                      window.top!.location.href = oauthUrl;
                    } else {
                      window.location.href = oauthUrl;
                    }
                  }}
                  className="flex items-center gap-2 rounded-full bg-white text-gray-700 border border-gray-300 px-6 py-3 text-sm font-medium hover:bg-gray-50 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>Connect with Google</span>
                </button>
                </div>
              </div>
            </section>
          )}

          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                {isPreviewMode ? 'Sample Business Analysis' : (googleBusinessData ? 'Live Business Analysis' : 'Your Business Analysis')}
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-800">
                {isPreviewMode
                  ? (selectedLocation?.title || "Barth's Oobleck Supply")
                  : (googleBusinessData?.businessInfo?.name || leadFormData.businessName || 'Your Business')}
              </h1>
              <p className="text-sm text-gray-600">
                {isPreviewMode
                  ? (selectedPreviewData?.hero.locationLabel || 'Preview Analysis')
                  : (
                      googleBusinessData?.businessInfo?.categories && Array.isArray(googleBusinessData.businessInfo.categories) && googleBusinessData.businessInfo.categories.length > 0
                        ? (typeof googleBusinessData.businessInfo.categories[0] === 'string'
                            ? googleBusinessData.businessInfo.categories[0]
                            : googleBusinessData.businessInfo.categories[0]?.displayName || 'Business Analysis')
                        : 'Business Analysis'
                    )}
              </p>
              {googleBusinessData && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600">Connected to Google Business Profile</span>
                </div>
              )}
            </div>

          {/* Location Selector - Always show when we have locations */}
            {(availableLocations.length > 0 || cachedLocationsRef.current.length > 0) && (
              <div className="mt-6">
                {!showLocationSelector && selectedLocation && (
                  <div className="flex flex-col gap-2 rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        <span className="font-semibold text-slate-800">Selected location:</span>{' '}
                        {selectedLocation.title || selectedLocation.name}
                        {selectedLocation.address && (
                          <span className="text-xs text-gray-500 ml-2">
                            • {selectedLocation.address.addressLines?.[0] || selectedLocation.address.locality}
                          </span>
                        )}
                      </div>
                      {(availableLocations.length > 1 || cachedLocationsRef.current.length > 1) && (
                        <button
                          type="button"
                          onClick={() => {
                            manualLocationSelectionRef.current = true;
                            setShowLocationSelector(true);
                          }}
                          className="rounded-full border border-blue-500 px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-500/10 transition-colors"
                        >
                          Change Location ({availableLocations.length || cachedLocationsRef.current.length})
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {showLocationSelector && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-sm font-semibold text-slate-800 mb-3">
                      Select a Google Business Profile Location
                    </h3>
                    <div className="space-y-2">
                      {availableLocations.map((location, index) => (
                        <button
                          key={location.name || index}
                          onClick={() => {
                            console.log('🏢 Location selected:', location.name, location.title);
                            manualLocationSelectionRef.current = false;
                            setSelectedLocation(location);
                            setShowLocationSelector(false);
                            if (sessionData) {
                              setIsLoadingBusinessData(true);
                            }
                            setAwaitingLocationChoice(false);
                          }}
                          className={`w-full text-left p-3 rounded-md transition-colors border ${
                            selectedLocation?.name === location.name || selectedLocation?.canonicalName === location.canonicalName
                              ? 'bg-blue-100 border-blue-400'
                              : 'bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                          }`}
                        >
                          <div className="font-medium text-slate-800">{location.title}</div>
                          {location.accountName && (
                            <div className="text-xs text-gray-500 mt-1">Group: {location.accountName}</div>
                          )}
                          {location.address && (
                            <div className="text-sm text-gray-600 mt-1">
                              {location.address.addressLines?.join(', ')}
                              {location.address.locality && `, ${location.address.locality}`}
                              {location.address.administrativeArea && `, ${location.address.administrativeArea}`}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {sessionData && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="flex justify-end">
                  <div className="flex flex-col items-end gap-2">
                    <button
                      className="flex items-center gap-2 rounded-full border border-solid border-blue-500 bg-blue-500 text-white px-4 py-2 text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      type="button"
                      onClick={handleDownloadReport}
                      disabled={isDownloadingReport}
                    >
                      <Icon name="MdDownload" className="h-4 w-4" />
                      {isDownloadingReport ? 'Generating Report...' : 'Download Full Report'}
                    </button>
                    {downloadError && (
                      <p className="text-sm text-red-600 text-right">{downloadError}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {sessionData && googleBusinessData?.businessInfo && (
                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Business Information</p>
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">Business:</span> {googleBusinessData.businessInfo.name || leadFormData.businessName || 'Not specified'}
                      </div>
                      <div>
                        <span className="font-medium">Main Category:</span> {
                          Array.isArray(googleBusinessData.businessInfo.categories) && googleBusinessData.businessInfo.categories.length > 0
                            ? (typeof googleBusinessData.businessInfo.categories[0] === 'string'
                                ? googleBusinessData.businessInfo.categories[0]
                                : googleBusinessData.businessInfo.categories[0]?.displayName || 'Not specified')
                            : 'Not specified'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}
          </section>

        {(isLoadingBusinessData || showLocationSelector) ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-center gap-3">
              {!showLocationSelector && (
                <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              )}
              <p className="text-gray-600">
                {showLocationSelector ? 'Please select a location above to continue' : 'Loading your business data...'}
              </p>
            </div>
          </div>
        ) : reviewsUnavailable ? (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <Icon name="FaExclamationTriangle" className="h-6 w-6 text-yellow-600" />
              <div>
                <h3 className="text-base font-semibold text-slate-800">Reviews unavailable for this listing</h3>
                <p className="mt-1 text-sm text-yellow-900 max-w-xl">
                  Google didn’t return review metrics for this profile. This can happen when a business doesn’t have reviews yet or when the Google account hasn’t granted review access. You can still explore the profile details and other insights below.
                </p>
              </div>
            </div>
          </div>
        ) : overviewStatsData.noDataAvailable ? (
          // Show "no data available" state when connected but no metrics
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <Icon name="FaExclamationTriangle" className="h-8 w-8 text-amber-600" />
              <h3 className="text-lg font-semibold text-slate-800">No Review Data Available</h3>
              <p className="text-sm text-gray-600 max-w-md">
                We couldn't retrieve review metrics for this location. This could be because:
              </p>
              <ul className="text-sm text-gray-600 text-left space-y-1">
                <li>• The location hasn't received any reviews yet</li>
                <li>• Google Business Profile permissions are limited</li>
                <li>• The location was recently created or claimed</li>
              </ul>
              {availableLocations.length > 1 && (
                <button
                  onClick={() => {
                    manualLocationSelectionRef.current = true;
                    setShowLocationSelector(true);
                  }}
                  className="mt-3 rounded-full border border-amber-600 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  Try Another Location
                </button>
              )}
            </div>
          </div>
        ) : (
          <OverviewStats
            totalReviews={overviewStatsData.totalReviews}
            reviewTrend={overviewStatsData.reviewTrend}
            averageRating={overviewStatsData.averageRating}
            monthlyReviewData={overviewStatsData.monthlyReviewData}
          />
        )}

        {/* Posting Frequency Chart */}
        {!isLoadingBusinessData && !showLocationSelector && (
          <PostingFrequencyChart
            postsData={googleBusinessData?.postsData || []}
            isLoading={isLoadingBusinessData}
          />
        )}

        {insightsUnavailable && (
          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-6 shadow-sm text-sm text-blue-900">
            <div className="flex items-start gap-3">
              <Icon name="FaInfoCircle" className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="text-base font-semibold text-slate-800">No performance insights from Google</h3>
                <p className="mt-1">
                  Google didn't return view or action metrics for this listing. This is common for newly verified profiles. We'll keep checking each time you reconnect.
                </p>
              </div>
            </div>
          </div>
        )}

        <BusinessHealthMetrics
          locationId={selectedLocation?.id || selectedLocation?.name || 'example-location'}
          profileData={businessHealthData.profileData}
          engagementData={businessHealthData.engagementData}
          performanceData={businessHealthData.performanceData}
          optimizationOpportunities={businessHealthData.opportunities}
          isLoading={isLoadingBusinessData}
        />

        {/* Session Info Footer - Only show when authenticated */}
        {sessionData && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            <div className="flex items-center justify-between">
              <span>Session active until: {new Date(sessionData.expiresAt).toLocaleString()}</span>
              <button
                onClick={() => {
                  localStorage.removeItem('google-biz-optimizer-token');
                  localStorage.removeItem('google-biz-optimizer-expiry');
                  localStorage.removeItem('google-biz-optimizer-session-id');
                  setSessionData(null);
                  setShowLeadForm(true);
                  setAwaitingLocationChoice(false);
                  setLocationGroupDiagnostics([]);
                }}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Start New Analysis
              </button>
            </div>
          </div>
        )}

        {/* Preview Mode CTA Footer */}
        {isPreviewMode && (
          <section className="mt-8 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-center text-white shadow-xl">
            <h3 className="text-2xl font-bold mb-3">Ready to Optimize Your Business?</h3>
            <p className="text-lg mb-6 text-white/90">
              Get your personalized Google Business Profile analysis with 10+ specific recommendations
            </p>
            <button
              onClick={() => {
                setShowLeadForm(true);
                setAwaitingLocationChoice(false);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-white text-gray-900 px-8 py-3 text-base font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg"
            >
              <Icon name="MdDownload" className="h-5 w-5 text-gray-900" />
              <span className="text-gray-900">Get My Free Report Now</span>
            </button>
            <p className="mt-4 text-sm text-white/80">
              No credit card required • 100% Free • Instant PDF download
            </p>
          </section>
        )}
      </main>
    </div>
    );
  };

  // Simple logic: show form if showLeadForm is true, otherwise show dashboard
  return (
    <div ref={containerRef}>
      {showLeadForm ? renderLeadForm() : renderDashboard()}
    </div>
  );
}
