/**
 * BusinessHealthMetrics Component
 * 
 * Main metrics dashboard showing profile completeness, customer engagement,
 * business performance, and optimization opportunities in a 4-section grid layout.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Icon, { IconName } from '@/components/Icon';

interface ProfileData {
  categoriesUsed: number;
  maxCategories: number;
  servicesCount: number;
  servicesWithDescriptions: number;
  businessDescriptionLength: number;
  businessDescriptionMaxLength: number;
  seoScore: number;
  photosByCategory: Record<string, number>;
}

interface EngagementData {
  unrespondedReviews: number;
  totalQuestions: number;
  unansweredQuestions: number;
  recentPosts: number;
  recentPhotos?: number;
  lastPostDate?: string;
  lastPhotoDate?: string;
}

interface PerformanceData {
  monthlyViews: number;
  viewsTrend: number;
  topSearchQueries: string[];
  customerActions: {
    websiteClicks: number;
    phoneCalls: number;
    directionRequests: number;
    photoViews: number;
  };
}

interface OptimizationOpportunity {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionUrl?: string;
}

interface BusinessHealthMetricsProps {
  locationId: string;
  profileData: ProfileData;
  engagementData: EngagementData;
  performanceData: PerformanceData;
  optimizationOpportunities: OptimizationOpportunity[];
  isLoading?: boolean;
  onQuickAction?: (action: string, data?: any) => void;
}

// Custom hook for counting animation
function useCountUp(end: number, duration: number = 2000, shouldAnimate: boolean = false) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (!shouldAnimate) {
      setCount(end);
      return;
    }
    
    let startTime: number;
    let animationFrame: number;
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration, shouldAnimate]);
  
  return count;
}

// Custom hook for intersection observer
function useIntersectionObserver() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsVisible(true);
          setHasAnimated(true);
        }
      },
      { 
        threshold: 0.3,
        rootMargin: '-10% 0px -20% 0px' // Trigger when element is 10% from top and 20% from bottom
      }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [hasAnimated]);
  
  return { ref, isVisible };
}

export default function BusinessHealthMetrics({
  locationId,
  profileData,
  engagementData,
  performanceData,
  optimizationOpportunities,
  isLoading = false,
  onQuickAction
}: BusinessHealthMetricsProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  

  // Calculate completion percentages
  // For categories, we consider 5 to be excellent (100%), since not all businesses have 10 relevant categories
  const categoryCompletion = profileData?.categoriesUsed 
    ? Math.min((profileData.categoriesUsed / 5) * 100, 100)
    : 0;
  
  // For services count, based on SEO best practices:
  // 5-10 services = good baseline (80%)
  // 10-20 services = ideal (100%)
  // More than 20 = still 100% (but only if meaningful)
  const serviceCountScore = profileData?.servicesCount 
    ? profileData.servicesCount < 5 
      ? (profileData.servicesCount / 5) * 80  // 0-5 services = 0-80%
      : profileData.servicesCount < 10 
      ? 80 + ((profileData.servicesCount - 5) / 5) * 20  // 5-10 services = 80-100%
      : 100  // 10+ services = 100%
    : 0;
    
  const serviceDescriptionCompletion = profileData?.servicesCount && profileData?.servicesCount > 0 
    ? (profileData.servicesWithDescriptions / profileData.servicesCount) * 100 
    : 0;
  const businessDescriptionCompletion = profileData?.businessDescriptionLength && profileData?.businessDescriptionMaxLength
    ? (profileData.businessDescriptionLength / profileData.businessDescriptionMaxLength) * 100 
    : 0;

  // Photo categories with expected counts
  const expectedPhotos = {
    'LOGO': 1,
    'COVER': 1,
    'INTERIOR': 3,
    'EXTERIOR': 3,
    'TEAM': 2,
    'PRODUCT': 5
  };

  const totalExpectedPhotos = Object.values(expectedPhotos).reduce((sum, count) => sum + count, 0);
  const totalActualPhotos = profileData?.photosByCategory ? Object.values(profileData.photosByCategory).reduce((sum, count) => sum + count, 0) : 0;
  const photoCompletion = (totalActualPhotos / totalExpectedPhotos) * 100;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const ProgressBar = ({ percentage, className = "bg-slate-blue", animate = false }: { percentage: number; className?: string; animate?: boolean }) => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className={`h-2 rounded-full transition-all duration-[2000ms] ease-out ${className}`}
        style={{ width: animate ? `${Math.min(percentage, 100)}%` : '0%' }}
      ></div>
    </div>
  );

  const MetricCard = ({ title, icon, children, actions }: { 
    title: string; 
    icon: IconName; 
    children: React.ReactNode | ((cardIsVisible: boolean) => React.ReactNode); 
    actions?: React.ReactNode;
  }) => {
    const { ref: cardRef, isVisible: cardIsVisible } = useIntersectionObserver();
    
    return (
      <div ref={cardRef} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <Icon name={icon} className="w-6 h-6 text-slate-blue" />
            </div>
            <h3 className="text-lg font-semibold text-slate-blue">{title}</h3>
          </div>
          {actions}
        </div>
        {/* Pass cardIsVisible to children through React.cloneElement if children need animation */}
        {typeof children === 'function' ? children(cardIsVisible) : children}
      </div>
    );
  };

  // Check if we have meaningful data to show
  const hasProfileData = profileData && (profileData.categoriesUsed > 0 || profileData.servicesCount > 0);
  // Always show engagement data if we have the engagementData object, even if all values are 0
  // This is important so users can see their current photo/post frequency (even if it's 0/2 or 0/4)
  const hasEngagementData = !!engagementData;

  // Debug logging to see what data we're receiving
  const hasPerformanceData = performanceData && (performanceData.monthlyViews > 0 || performanceData.topSearchQueries?.length > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Profile Optimization */}
      <MetricCard 
        title="Profile Optimization" 
        icon="FaStore"
        actions={
          hasProfileData ? (
            <button
              onClick={() => onQuickAction?.('edit-business-info')}
              className="text-slate-blue hover:text-slate-700 text-sm font-medium"
            >
              Edit Info →
            </button>
          ) : null
        }
      >
        {(cardIsVisible) => hasProfileData ? (
          <div className="space-y-4">
            {/* Categories */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Categories Used</span>
                <span className="text-sm text-gray-600">
                  {profileData?.categoriesUsed || 0}/{profileData?.maxCategories || 0}
                </span>
              </div>
              <ProgressBar percentage={categoryCompletion} animate={cardIsVisible} />
            </div>

            {/* Services */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Services</span>
                <span className="text-sm text-gray-600">{profileData?.servicesCount || 0} total</span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Service count score</span>
                    <span className="text-xs text-gray-600">
                      {Math.round(serviceCountScore)}% {profileData?.servicesCount >= 10 ? '(Ideal)' : profileData?.servicesCount >= 5 ? '(Good)' : '(Add more)'}
                    </span>
                  </div>
                  <ProgressBar percentage={serviceCountScore} className="bg-blue-500" animate={cardIsVisible} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">With descriptions</span>
                    <span className="text-xs text-gray-600">
                      {profileData?.servicesWithDescriptions || 0}/{profileData?.servicesCount || 0}
                    </span>
                  </div>
                  <ProgressBar percentage={serviceDescriptionCompletion} className="bg-green-500" animate={cardIsVisible} />
                </div>
              </div>
              {(profileData?.servicesCount || 0) < 5 && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                  💡 <strong>Tip:</strong> Add 5-10 services for good baseline visibility, 10-20 for competitive industries.
                </div>
              )}
            </div>

            {/* Business Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Business Description</span>
                <span className="text-sm text-gray-600">
                  {profileData?.businessDescriptionLength || 0}/{profileData?.businessDescriptionMaxLength || 0}
                </span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">SEO Score</span>
                <span className="text-xs font-medium text-gray-900">{profileData?.seoScore || 0}/10</span>
              </div>
              <ProgressBar percentage={businessDescriptionCompletion} className="bg-purple-500" animate={cardIsVisible} />
              {(profileData?.businessDescriptionLength || 0) < 250 && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                  💡 <strong>Tip:</strong> Users only see the first 250 characters before "Read more". 
                  Aim for 250+ characters to maximize visibility.
                </div>
              )}
            </div>

            {/* Recent Photos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Photo Activity</span>
                <span className="text-sm text-gray-600">
                  {engagementData?.recentPhotos || 0}/2 this month
                </span>
              </div>
              <ProgressBar percentage={((engagementData?.recentPhotos || 0) / 2) * 100} className="bg-blue-500" animate={cardIsVisible} />
              {(engagementData?.recentPhotos || 0) < 2 && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                  💡 <strong>Goal:</strong> Upload 2+ photos per month to stay active and improve search ranking.
                  <button
                    onClick={() => onQuickAction?.('manage-photos')}
                    className="ml-2 text-blue-800 hover:text-blue-900 font-medium underline"
                  >
                    Upload Photos
                  </button>
                </div>
              )}
              {engagementData?.lastPhotoDate && (
                <div className="mt-1 text-xs text-gray-500">
                  Last photo: {new Date(engagementData.lastPhotoDate).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Monthly Posts */}
            {engagementData && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Monthly Posts</span>
                  <span className="text-sm text-gray-600">
                    {engagementData.recentPosts}/4 this month
                  </span>
                </div>
                <ProgressBar percentage={(engagementData.recentPosts / 4) * 100} className="bg-green-500" animate={cardIsVisible} />
                {engagementData.recentPosts < 4 && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                    💡 <strong>Goal:</strong> Post 4+ times per month for consistent engagement and better visibility.
                    <button
                      onClick={() => onQuickAction?.('create-post')}
                      className="ml-2 text-green-800 hover:text-green-900 font-medium underline"
                    >
                      Create Post
                    </button>
                  </div>
                )}
                {engagementData.lastPostDate && (
                  <div className="mt-1 text-xs text-gray-500">
                    Last post: {new Date(engagementData.lastPostDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Icon name="FaExclamationTriangle" className="w-8 h-8 text-orange-500 mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">Business Info Not Available</h3>
            <p className="text-xs text-gray-500 mb-3">
              Additional Google Business Profile permissions required to access detailed business information.
            </p>
            <button
              onClick={() => onQuickAction?.('edit-business-info')}
              className="text-xs text-slate-blue hover:text-slate-700 font-medium"
            >
              Check Business Info Tab →
            </button>
          </div>
        )}
      </MetricCard>

      {/* Customer Engagement */}
      <MetricCard 
        title="Customer Engagement" 
        icon="FaUsers"
        actions={
          <button
            onClick={() => onQuickAction?.('manage-reviews')}
            className="text-slate-blue hover:text-slate-700 text-sm font-medium"
          >
            Manage →
          </button>
        }
      >
        {(cardIsVisible) => {
          
          return (
            <div className="space-y-4">
            {/* Unresponded Reviews */}
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Icon name="FaExclamationTriangle" className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-red-800">Reviews Need Response</span>
              </div>
              <span className="text-lg font-bold text-red-600">{engagementData.unrespondedReviews}</span>
            </div>

            {/* Q&A */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{engagementData.totalQuestions}</div>
                <div className="text-xs text-gray-600">Total Q&A</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{engagementData.unansweredQuestions}</div>
                <div className="text-xs text-gray-600">Unanswered</div>
              </div>
            </div>
          </div>
          );
        }}
      </MetricCard>

      {/* Business Performance - Only show if we have performance data */}
      {hasPerformanceData && (
        <MetricCard title="Business Performance" icon="FaChartLine">
          {(cardIsVisible) => {
            
            return (
            <div className="space-y-4">


          {/* Monthly Views */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Profile Views</span>
              <div className="flex items-center space-x-1">
                {performanceData.viewsTrend !== 0 && (
                                <Icon
                name={performanceData.viewsTrend > 0 ? "FaCaretUp" : "FaCaretDown"}
                className={`w-3 h-3 ${performanceData.viewsTrend > 0 ? 'text-green-500' : 'text-red-500'}`}
              />
                )}
                <span className="text-sm text-gray-600">this month</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {performanceData.monthlyViews === 0 ? 'Not Available' : performanceData.monthlyViews.toLocaleString()}
            </div>
          </div>

          {/* Customer Actions */}
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue-600">
                {performanceData.customerActions.websiteClicks === 0 ? 'N/A' : performanceData.customerActions.websiteClicks}
              </div>
              <div className="text-xs text-gray-600">Website clicks</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-600">
                {performanceData.customerActions.phoneCalls === 0 ? 'N/A' : performanceData.customerActions.phoneCalls}
              </div>
              <div className="text-xs text-gray-600">Phone calls</div>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded">
              <div className="text-lg font-bold text-purple-600">
                {performanceData.customerActions.directionRequests === 0 ? 'N/A' : performanceData.customerActions.directionRequests}
              </div>
              <div className="text-xs text-gray-600">Directions</div>
            </div>
            <div className="text-center p-2 bg-orange-50 rounded">
              <div className="text-lg font-bold text-orange-600">
                {performanceData.customerActions.photoViews === 0 ? 'N/A' : performanceData.customerActions.photoViews}
              </div>
              <div className="text-xs text-gray-600">Photo views</div>
            </div>
          </div>

          {/* Top Search Queries */}
          {performanceData.topSearchQueries.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Top Search Queries</div>
              <div className="space-y-1">
                {performanceData.topSearchQueries.slice(0, 3).map((query, index) => (
                  <div key={index} className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                    {query}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
            );
          }}
      </MetricCard>
      )}

      {/* Optimization Opportunities - Full Width */}
      <div className="lg:col-span-2">
        <MetricCard title="Optimization Opportunities" icon="FaLightbulb">
          {(cardIsVisible) => (
            <div className="space-y-3">
            {optimizationOpportunities.length === 0 ? (
              <div className="text-center py-4">
                <Icon name="FaCheck" className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">All optimizations complete!</p>
              </div>
            ) : (
              optimizationOpportunities.map((opportunity, index) => (
                <div 
                  key={opportunity.id}
                  className={`p-3 rounded-lg border-l-4 transform transition-all duration-[1200ms] ease-out ${
                    cardIsVisible 
                      ? 'translate-x-0 opacity-100' 
                      : 'translate-x-12 opacity-0'
                  } ${
                    opportunity.priority === 'high' ? 'border-red-500 bg-red-50' :
                    opportunity.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  }`}
                  style={{
                    transitionDelay: cardIsVisible ? `${index * 300}ms` : '0ms'
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900">{opportunity.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          opportunity.priority === 'high' ? 'bg-red-100 text-red-700' :
                          opportunity.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {opportunity.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{opportunity.description}</p>
                    </div>
                    {opportunity.actionUrl && (
                      <button
                        onClick={() => onQuickAction?.('navigate', { url: opportunity.actionUrl })}
                        className="ml-2 text-slate-blue hover:text-slate-700"
                      >
                        <Icon name="FaArrowRight" className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
        </div>
        )}
      </MetricCard>
      </div>
    </div>
  );
}