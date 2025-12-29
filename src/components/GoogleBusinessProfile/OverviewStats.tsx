/**
 * OverviewStats Component
 * 
 * Header statistics component displaying review progress, total reviews, and average star rating.
 * Includes monthly review chart similar to the user's reference image.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/Icon';
import { GBPHelpBubble } from '@/components/ui/HelpBubble';

interface MonthlyReviewData {
  month: string;
  fiveStar: number;
  fourStar: number;
  threeStar: number;
  twoStar: number;
  oneStar: number;
  noRating: number;
}

interface OverviewStatsProps {
  totalReviews: number;
  reviewTrend: number;
  averageRating: number;
  monthlyReviewData: MonthlyReviewData[];
  isLoading?: boolean;
  onLoadData?: () => void;
  dataLoaded?: boolean;
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
      { threshold: 0.1 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [hasAnimated]);
  
  return { ref, isVisible };
}

export default function OverviewStats({
  totalReviews,
  reviewTrend,
  averageRating,
  monthlyReviewData,
  isLoading = false,
  onLoadData,
  dataLoaded = false
}: OverviewStatsProps) {
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    x: number;
    y: number;
    data: MonthlyReviewData;
    totalReviews: number;
  } | null>(null);
  
  // Animation setup
  const { ref: animationRef, isVisible } = useIntersectionObserver();

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltip && !(event.target as Element).closest('.chart-bar')) {
        setTooltip(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [tooltip]);
  const animatedTotalReviews = useCountUp(totalReviews, 2000, isVisible);
  const animatedReviewTrend = useCountUp(Math.abs(reviewTrend), 1500, isVisible);
  const animatedAverageRating = useCountUp(averageRating * 10, 2500, isVisible) / 10;
  
  // Calculate max reviews for chart scaling with better minimum scale
  const monthlyTotals = monthlyReviewData.map(data => 
    data.fiveStar + data.fourStar + data.threeStar + data.twoStar + data.oneStar
  );
  const actualMaxReviews = Math.max(...monthlyTotals, 1);
  
  // Use a minimum scale that makes sense - at least 10 reviews for better proportions
  // This way, if you have 1-2 reviews per month, the bars won't fill the entire height
  const maxReviews = Math.max(actualMaxReviews, 10);

  // Get rating percentage for circular progress
  const ratingPercentage = (animatedAverageRating / 5) * 100;

  // Calculate circumference for circular progress
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (ratingPercentage / 100) * circumference;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Review Progress Skeleton */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
        
        {/* Stats Skeletons */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="h-24 w-24 bg-gray-200 rounded-full mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={animationRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Review Progress Chart */}
      <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-start gap-1">
              <h2 className="text-xl font-bold text-slate-blue">Review progress</h2>
              <div className="flex-shrink-0 mt-0.5">
                <GBPHelpBubble
                  metric="metrics/monthly-patterns"
                  tooltip="Understanding review patterns"
                  size="sm"
                />
              </div>
            </div>
            <p className="text-sm text-gray-500">Last 12 months</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Load Data Button - Always visible when onLoadData is provided */}
            {onLoadData && (
              <button
                onClick={onLoadData}
                disabled={isLoading}
                className={`flex items-center space-x-2 px-3 py-1.5 text-sm rounded-md border relative overflow-hidden transition-all duration-300 ${
                  isLoading
                    ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed'
                    : `bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 shine-button`
                }`}
                style={{ zIndex: 10 }}
              >
                {isLoading ? (
                  <>
                    <Icon name="FaSpinner" className="w-3 h-3 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <Icon name="FaRedo" className="w-3 h-3" />
                    <span>Load data</span>
                  </>
                )}
              </button>
            )}
            
            {/* Legend */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">5 Star</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-gray-600">4 Star</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <span className="text-gray-600">3 Star</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                <span className="text-gray-600">2 Star</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">1 Star</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-gray-600">No rating</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="h-40">
          <div className="flex items-end justify-between h-full space-x-2">
            {monthlyReviewData.map((data, index) => {
              const totalMonthReviews = data.fiveStar + data.fourStar + data.threeStar + data.twoStar + data.oneStar;
              const chartHeight = maxReviews > 0 ? (totalMonthReviews / maxReviews) * 100 : 0;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  {/* Stacked Bar */}
                  <div 
                    className="chart-bar w-full max-w-12 relative bg-gray-100 rounded-t cursor-pointer hover:bg-gray-200 transition-colors"
                    style={{ height: '120px' }}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const totalMonthReviews = data.fiveStar + data.fourStar + data.threeStar + data.twoStar + data.oneStar;
                      setTooltip({
                        show: true,
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10,
                        data,
                        totalReviews: totalMonthReviews
                      });
                    }}
                  >
                    {totalMonthReviews > 0 && (
                      <div 
                        className={`absolute bottom-0 w-full rounded-t overflow-hidden transition-all duration-1000 ease-out ${
                          isVisible ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{ 
                          height: isVisible ? `${chartHeight}%` : '0%',
                          transitionDelay: `${index * 100}ms`
                        }}
                      >
                        {/* Stack bars from bottom to top */}
                        <div className="relative h-full">
                          {/* 5 Star */}
                          <div 
                            className={`bg-green-500 absolute bottom-0 w-full transition-all duration-800 ease-out ${
                              isVisible ? 'opacity-100' : 'opacity-0'
                            }`}
                            style={{ 
                              height: isVisible ? `${totalMonthReviews > 0 ? (data.fiveStar / totalMonthReviews) * 100 : 0}%` : '0%',
                              transitionDelay: `${index * 100 + 200}ms`
                            }}
                          ></div>
                          {/* 4 Star */}
                          <div 
                            className={`bg-green-400 absolute w-full transition-all duration-800 ease-out ${
                              isVisible ? 'opacity-100' : 'opacity-0'
                            }`}
                            style={{ 
                              bottom: isVisible ? `${totalMonthReviews > 0 ? (data.fiveStar / totalMonthReviews) * 100 : 0}%` : '0%',
                              height: isVisible ? `${totalMonthReviews > 0 ? (data.fourStar / totalMonthReviews) * 100 : 0}%` : '0%',
                              transitionDelay: `${index * 100 + 300}ms`
                            }}
                          ></div>
                          {/* 3 Star */}
                          <div 
                            className={`bg-yellow-400 absolute w-full transition-all duration-800 ease-out ${
                              isVisible ? 'opacity-100' : 'opacity-0'
                            }`}
                            style={{ 
                              bottom: isVisible ? `${totalMonthReviews > 0 ? ((data.fiveStar + data.fourStar) / totalMonthReviews) * 100 : 0}%` : '0%',
                              height: isVisible ? `${totalMonthReviews > 0 ? (data.threeStar / totalMonthReviews) * 100 : 0}%` : '0%',
                              transitionDelay: `${index * 100 + 400}ms`
                            }}
                          ></div>
                          {/* 2 Star */}
                          <div 
                            className={`bg-orange-400 absolute w-full transition-all duration-800 ease-out ${
                              isVisible ? 'opacity-100' : 'opacity-0'
                            }`}
                            style={{ 
                              bottom: isVisible ? `${totalMonthReviews > 0 ? ((data.fiveStar + data.fourStar + data.threeStar) / totalMonthReviews) * 100 : 0}%` : '0%',
                              height: isVisible ? `${totalMonthReviews > 0 ? (data.twoStar / totalMonthReviews) * 100 : 0}%` : '0%',
                              transitionDelay: `${index * 100 + 500}ms`
                            }}
                          ></div>
                          {/* 1 Star */}
                          <div 
                            className={`bg-red-500 absolute w-full transition-all duration-800 ease-out ${
                              isVisible ? 'opacity-100' : 'opacity-0'
                            }`}
                            style={{ 
                              bottom: isVisible ? `${totalMonthReviews > 0 ? ((data.fiveStar + data.fourStar + data.threeStar + data.twoStar) / totalMonthReviews) * 100 : 0}%` : '0%',
                              height: isVisible ? `${totalMonthReviews > 0 ? (data.oneStar / totalMonthReviews) * 100 : 0}%` : '0%',
                              transitionDelay: `${index * 100 + 600}ms`
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Month Label */}
                  <div className="text-xs text-gray-600 mt-2 text-center">
                    {data.month}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Chart Scale Indicator */}
          {maxReviews > actualMaxReviews && (
            <div className="text-xs text-gray-500 text-center mt-2">
              Chart scaled to {maxReviews} reviews max for better visibility
            </div>
          )}
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div 
            className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform: 'translateX(-50%) translateY(-100%)'
            }}
          >
            <div className="font-semibold text-gray-900 mb-2">
              {tooltip.data.month} - {tooltip.totalReviews} review{tooltip.totalReviews !== 1 ? 's' : ''}
            </div>
            <div className="space-y-1">
              {tooltip.data.fiveStar > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">5 Star</span>
                  </div>
                  <span className="font-medium">{tooltip.data.fiveStar}</span>
                </div>
              )}
              {tooltip.data.fourStar > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-gray-600">4 Star</span>
                  </div>
                  <span className="font-medium">{tooltip.data.fourStar}</span>
                </div>
              )}
              {tooltip.data.threeStar > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span className="text-gray-600">3 Star</span>
                  </div>
                  <span className="font-medium">{tooltip.data.threeStar}</span>
                </div>
              )}
              {tooltip.data.twoStar > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                    <span className="text-gray-600">2 Star</span>
                  </div>
                  <span className="font-medium">{tooltip.data.twoStar}</span>
                </div>
              )}
              {tooltip.data.oneStar > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-gray-600">1 Star</span>
                  </div>
                  <span className="font-medium">{tooltip.data.oneStar}</span>
                </div>
              )}
            </div>
            {/* Close button */}
            <button
              onClick={() => setTooltip(null)}
              className="absolute -top-2 -right-2 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
            >
              <Icon name="FaTimes" className="w-3 h-3 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {/* Right Side Stats */}
      <div className="space-y-6">
        {/* Total Reviews */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-start gap-1">
                <h3 className="text-lg font-semibold text-slate-blue">Total reviews</h3>
                <div className="flex-shrink-0 mt-0.5">
                  <GBPHelpBubble
                    metric="metrics/total-reviews"
                    tooltip="Learn about review importance"
                    size="sm"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">All time</p>
            </div>
            <Icon name="FaStar" className="w-6 h-6 text-slate-blue" />
          </div>
          <div className="flex items-end space-x-2">
            <span className="text-3xl font-bold text-gray-900">{animatedTotalReviews.toLocaleString()}</span>
            {reviewTrend !== 0 && (
              <span className={`text-sm font-medium flex items-center ${
                reviewTrend > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                <Icon
                  name={reviewTrend > 0 ? "MdArrowUpward" : "MdArrowDownward"}
                  className="w-3 h-3 mr-1"
                />
                {reviewTrend > 0 ? '+' : ''}{animatedReviewTrend} last 30 days
                <div className="inline-flex flex-shrink-0 ml-1">
                  <GBPHelpBubble
                    metric="metrics/review-trends"
                    tooltip="Review velocity impact"
                    size="sm"
                  />
                </div>
              </span>
            )}
          </div>
        </div>

        {/* Average Star Rating */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-start gap-1">
                <h3 className="text-lg font-semibold text-slate-blue">Average Star Rating</h3>
                <div className="flex-shrink-0 mt-0.5">
                  <GBPHelpBubble
                    metric="metrics/average-rating"
                    tooltip="Impact of star ratings"
                    size="sm"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">All time</p>
            </div>
            <Icon name="FaStar" className="w-6 h-6 text-slate-blue" />
          </div>
          
          {/* Circular Progress */}
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  className="text-gray-200"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="text-green-500 transition-all duration-2000 ease-out"
                  style={{ transitionDelay: isVisible ? '500ms' : '0ms' }}
                  strokeLinecap="round"
                />
              </svg>
              {/* Rating Number */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">
                  {animatedAverageRating.toFixed(1)}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">Avg. star rating</p>
          </div>
        </div>
      </div>
    </div>
  );
}