'use client';

import Icon from '@/components/Icon';
import LocationPicker from '@/components/GoogleBusinessProfile/LocationPicker';
import OverviewStats from '@/components/GoogleBusinessProfile/OverviewStats';
import PostingFrequencyChart from '@/components/GoogleBusinessProfile/PostingFrequencyChart';
import BusinessHealthMetrics, { OptimizationOpportunity } from '@/components/GoogleBusinessProfile/BusinessHealthMetrics';
import { useWorkManagerIntegration } from '@/hooks/useWorkManagerIntegration';
import type { GoogleBusinessLocation } from '../../types/google-business';

interface OverviewTabProps {
  // Access state
  hasGBPAccess: boolean;
  gbpAccessMessage: string;

  // Connection state
  isConnected: boolean;
  scopedLocations: GoogleBusinessLocation[];
  isLoadingPlatforms: boolean;

  // Location selection
  selectedLocationId: string;
  resolvedSelectedLocation: GoogleBusinessLocation | undefined;
  onLocationChange: (locationId: string) => void;

  // Overview data
  overviewData: any;
  overviewLoading: boolean;
  overviewError: string | null;
  onRefreshOverview: (locationId: string) => void;

  // Export
  isExportingPDF: boolean;
  onExportPDF: () => void;

  // Quick actions
  onQuickAction: (action: string, data?: any) => void;
}

export function OverviewTab({
  hasGBPAccess,
  gbpAccessMessage,
  isConnected,
  scopedLocations,
  isLoadingPlatforms,
  selectedLocationId,
  resolvedSelectedLocation,
  onLocationChange,
  overviewData,
  overviewLoading,
  overviewError,
  onRefreshOverview,
  isExportingPDF,
  onExportPDF,
  onQuickAction,
}: OverviewTabProps) {
  // Work Manager integration
  const { addSuggestionToWorkManager, isAddingToWorkManager } = useWorkManagerIntegration();

  const handleAddToWorkManager = async (suggestion: OptimizationOpportunity) => {
    await addSuggestionToWorkManager({
      id: suggestion.id,
      title: suggestion.title,
      description: suggestion.description,
      priority: suggestion.priority,
    });
  };

  // Generate 12 months of empty data as fallback
  const getEmptyMonthlyData = () => {
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      months.push({
        month: monthName,
        fiveStar: 0,
        fourStar: 0,
        threeStar: 0,
        twoStar: 0,
        oneStar: 0,
        noRating: 0
      });
    }
    return months;
  };

  return (
    <div className="space-y-6">
      {/* GBP Access Message for Growers */}
      {!hasGBPAccess && gbpAccessMessage && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            {gbpAccessMessage}
            <button
              onClick={() => window.open('/dashboard/plan', '_blank')}
              className="ml-2 text-yellow-900 underline hover:no-underline"
            >
              Upgrade your plan
            </button>
            {' '}to connect your Google Business Profile.
          </p>
        </div>
      )}

      {/* Always show the impressive charts and stats */}
      <div id="overview-content" className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 pdf-hide">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Overview</h2>
              <p className="text-sm text-gray-600 mt-1">
                Monitor reviews, profile health, and engagement for your Google Business locations.
              </p>
            </div>
            {/* Export Button - Show only when connected and has data */}
            {isConnected && scopedLocations.length > 0 && (
              <button
                onClick={onExportPDF}
                disabled={isExportingPDF || overviewLoading}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isExportingPDF || overviewLoading
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'bg-slate-blue text-white hover:bg-blue-600'
                }`}
              >
                {isExportingPDF ? (
                  <>
                    <Icon name="FaSpinner" className="w-4 h-4 animate-spin" />
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <Icon name="MdDownload" className="w-4 h-4" />
                    <span>Download PDF</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Locations:</p>
            {scopedLocations.length <= 1 ? (
              <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                Google Business Profile: {scopedLocations[0]?.name || 'No locations connected'}
              </div>
            ) : (
              <LocationPicker
                className="bg-gray-50 rounded-lg p-4"
                mode="single"
                locations={scopedLocations}
                selectedId={resolvedSelectedLocation?.id}
                onSelect={(id: string | null) => id && onLocationChange(id)}
                isLoading={isLoadingPlatforms || (isConnected && scopedLocations.length === 0)}
                disabled={!isConnected || scopedLocations.length === 0}
                placeholder="Select a location"
                emptyState={isConnected ? (
                  <div className="px-4 py-3 border border-dashed border-gray-300 rounded-md text-sm text-gray-600 bg-gray-50">
                    No Google Business locations found. Fetch your locations to get started.
                  </div>
                ) : (
                  <div className="px-4 py-3 border border-dashed border-gray-300 rounded-md text-sm text-gray-600 bg-gray-50">
                    Connect your Google Business Profile to load locations.
                  </div>
                )}
              />
            )}
          </div>
        </div>

        {/* Error State */}
        {overviewError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center space-x-2 text-red-800 mb-2">
              <Icon name="FaExclamationTriangle" className="w-4 h-4" />
              <span className="text-sm font-medium">Error Loading Overview</span>
            </div>
            <p className="text-sm text-red-700">{overviewError}</p>
            <button
              onClick={() => selectedLocationId && onRefreshOverview(selectedLocationId)}
              className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Overview Stats - Show actual data or zero state for errors */}
        {!overviewError && (
          <OverviewStats
            totalReviews={overviewData?.reviewTrends?.totalReviews || 0}
            reviewTrend={overviewData?.reviewTrends?.reviewTrend || 0}
            averageRating={overviewData?.reviewTrends?.averageRating || 0}
            monthlyReviewData={overviewData?.reviewTrends?.monthlyReviewData || getEmptyMonthlyData()}
            isLoading={overviewLoading}
          />
        )}

        {/* Posting Frequency Chart */}
        {!overviewError && (
          <PostingFrequencyChart
            postsData={overviewData?.postsData || []}
            isLoading={overviewLoading}
          />
        )}

        <BusinessHealthMetrics
          locationId={selectedLocationId || 'demo'}
          profileData={overviewData?.profileData || {
            completeness: 92,
            photosCount: 47,
            hoursComplete: true,
            phoneComplete: true,
            websiteComplete: true,
            categoryComplete: true,
            categoriesUsed: 3,
            maxCategories: 9,
            servicesCount: 8,
            servicesWithDescriptions: 6,
            businessDescriptionLength: 525,
            businessDescriptionMaxLength: 750,
            seoScore: 7,
            photosByCategory: {
              'LOGO': 1,
              'COVER': 2,
              'INTERIOR': 12,
              'EXTERIOR': 8,
              'TEAM': 4,
              'PRODUCT': 15
            }
          }}
          engagementData={overviewData?.engagementData || {
            unrespondedReviews: 3,
            totalReviews: 15,
            totalQuestions: 12,
            unansweredQuestions: 2,
            recentPosts: 1,
            recentPhotos: 0,
            lastPostDate: '2024-07-15',
            lastPhotoDate: '2024-06-28'
          }}
          performanceData={overviewData?.performanceData || {
            monthlyViews: 0,
            viewsTrend: 0,
            topSearchQueries: [],
            customerActions: {
              websiteClicks: 0,
              phoneCalls: 0,
              directionRequests: 0,
              photoViews: 0
            }
          }}
          optimizationOpportunities={overviewData?.optimizationOpportunities || [
            { id: '1', priority: 'high', title: 'Upload more photos', description: 'Your profile needs 2+ photos this month. Current: 0/2 photos uploaded.' },
            { id: '2', priority: 'low', title: 'Optimize business description', description: 'Add 225 more characters to maximize your 750-character description for better SEO.' },
            { id: '3', priority: 'high', title: 'Respond to 3 reviews', description: 'You have 3 unresponded reviews that need attention to improve customer relations.' },
            { id: '4', priority: 'medium', title: 'Add more service categories', description: 'Use 6 more of your available 9 categories to improve discoverability.' }
          ]}
          isLoading={overviewLoading}
          onQuickAction={onQuickAction}
          onAddToWorkManager={handleAddToWorkManager}
          isAddingToWorkManager={isAddingToWorkManager}
        />

        {/* Loading State */}
        {overviewLoading && !overviewData && (
          <div className="space-y-6">
            <OverviewStats
              totalReviews={0}
              reviewTrend={0}
              averageRating={0}
              monthlyReviewData={[]}
              isLoading={true}
            />
            <PostingFrequencyChart
              postsData={[]}
              isLoading={true}
            />
            <BusinessHealthMetrics
              locationId=""
              profileData={{} as any}
              engagementData={{} as any}
              performanceData={{} as any}
              optimizationOpportunities={[]}
              isLoading={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
