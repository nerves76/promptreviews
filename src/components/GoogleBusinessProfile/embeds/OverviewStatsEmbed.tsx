/**
 * OverviewStats Embed Component
 * 
 * Displays review trends over time with animated stacked bar charts
 * Shows total reviews, average rating, and monthly distribution by star rating
 * Based on the main OverviewStats component from the Google Business dashboard
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { FaStar, FaChartLine, FaArrowUp, FaArrowDown } from 'react-icons/fa';

interface MonthlyReviewData {
  month: string;
  fiveStar: number;
  fourStar: number;
  threeStar: number;
  twoStar: number;
  oneStar: number;
  noRating: number;
}

interface OverviewStatsEmbedProps {
  showHeader?: boolean;
  className?: string;
}

// Hook for intersection observer
const useIntersectionObserver = () => {
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
};

// Hook for count-up animation
const useCountUp = (end: number, duration: number = 2000, shouldAnimate: boolean = false) => {
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
};

export default function OverviewStatsEmbed({ 
  showHeader = true,
  className = "" 
}: OverviewStatsEmbedProps) {
  const { ref: animationRef, isVisible } = useIntersectionObserver();
  
  // Sample data for the last 12 months
  const monthlyReviewData: MonthlyReviewData[] = [
    { month: 'Jan', fiveStar: 18, fourStar: 4, threeStar: 1, twoStar: 0, oneStar: 0, noRating: 0 },
    { month: 'Feb', fiveStar: 22, fourStar: 5, threeStar: 2, twoStar: 1, oneStar: 0, noRating: 0 },
    { month: 'Mar', fiveStar: 25, fourStar: 6, threeStar: 1, twoStar: 0, oneStar: 0, noRating: 0 },
    { month: 'Apr', fiveStar: 20, fourStar: 8, threeStar: 2, twoStar: 0, oneStar: 1, noRating: 0 },
    { month: 'May', fiveStar: 28, fourStar: 7, threeStar: 1, twoStar: 0, oneStar: 0, noRating: 0 },
    { month: 'Jun', fiveStar: 32, fourStar: 9, threeStar: 2, twoStar: 1, oneStar: 0, noRating: 0 },
    { month: 'Jul', fiveStar: 35, fourStar: 6, threeStar: 1, twoStar: 0, oneStar: 0, noRating: 0 },
    { month: 'Aug', fiveStar: 30, fourStar: 7, threeStar: 1, twoStar: 0, oneStar: 0, noRating: 0 },
    { month: 'Sep', fiveStar: 42, fourStar: 8, threeStar: 1, twoStar: 0, oneStar: 0, noRating: 0 },
    { month: 'Oct', fiveStar: 38, fourStar: 6, threeStar: 1, twoStar: 0, oneStar: 0, noRating: 0 },
    { month: 'Nov', fiveStar: 48, fourStar: 7, threeStar: 1, twoStar: 0, oneStar: 0, noRating: 0 },
    { month: 'Dec', fiveStar: 55, fourStar: 8, threeStar: 0, twoStar: 0, oneStar: 0, noRating: 0 },
  ];

  const totalReviews = 438;
  const reviewTrend = 23; // 23% increase
  const averageRating = 4.8;
  
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    x: number;
    y: number;
    data: MonthlyReviewData;
    totalReviews: number;
  } | null>(null);
  
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
  
  // Calculate max reviews for chart scaling
  const monthlyTotals = monthlyReviewData.map(data => 
    data.fiveStar + data.fourStar + data.threeStar + data.twoStar + data.oneStar
  );
  const actualMaxReviews = Math.max(...monthlyTotals, 1);
  const maxReviews = Math.max(actualMaxReviews, 10);

  // Get rating percentage for circular progress
  const ratingPercentage = (animatedAverageRating / 5) * 100;

  // Calculate circumference for circular progress
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (ratingPercentage / 100) * circumference;

  return (
    <div ref={animationRef} className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
      {/* Review Progress Chart */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Review progress</h2>
            <p className="text-sm text-gray-500">Last 12 months</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Legend */}
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">5★</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-600">4★</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-gray-600">3★</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span className="text-gray-600">2★</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">1★</span>
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
                              transitionDelay: `${index * 100 + 250}ms`
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
                              transitionDelay: `${index * 100 + 300}ms`
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
                              transitionDelay: `${index * 100 + 350}ms`
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
                              transitionDelay: `${index * 100 + 400}ms`
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Month Label */}
                  <span className="text-xs text-gray-500 mt-2">{data.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="space-y-6">
        {/* Total Reviews */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total reviews</h3>
            <div className={`flex items-center ${reviewTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {reviewTrend >= 0 ? <FaArrowUp className="w-3 h-3 mr-1" /> : <FaArrowDown className="w-3 h-3 mr-1" />}
              <span className="text-sm font-semibold">{animatedReviewTrend}%</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">{animatedTotalReviews}</div>
          <div className="text-xs text-gray-500">vs. previous period</div>
        </div>
        
        {/* Average Star Rating */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-4">Average Star Rating</h3>
          <div className="flex items-center justify-center">
            <div className="relative">
              <svg className="transform -rotate-90 w-24 h-24">
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  stroke="#fbbf24"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-2000 ease-out"
                  style={{
                    strokeDashoffset: isVisible ? strokeDashoffset : circumference
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-gray-900">{animatedAverageRating}</span>
                  <FaStar className="w-5 h-5 text-yellow-400 ml-1" />
                </div>
                <span className="text-xs text-gray-500">out of 5</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tooltip */}
      {tooltip && tooltip.show && (
        <div 
          className="fixed bg-gray-900 text-white p-3 rounded-lg shadow-xl z-50 pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            marginTop: '-10px'
          }}
        >
          <div className="text-sm font-semibold mb-2">{tooltip.data.month}</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between space-x-4">
              <span>Total:</span>
              <span className="font-bold">{tooltip.totalReviews} reviews</span>
            </div>
            {tooltip.data.fiveStar > 0 && (
              <div className="flex items-center justify-between space-x-4">
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  5 Star:
                </span>
                <span>{tooltip.data.fiveStar}</span>
              </div>
            )}
            {tooltip.data.fourStar > 0 && (
              <div className="flex items-center justify-between space-x-4">
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                  4 Star:
                </span>
                <span>{tooltip.data.fourStar}</span>
              </div>
            )}
            {tooltip.data.threeStar > 0 && (
              <div className="flex items-center justify-between space-x-4">
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></span>
                  3 Star:
                </span>
                <span>{tooltip.data.threeStar}</span>
              </div>
            )}
            {tooltip.data.twoStar > 0 && (
              <div className="flex items-center justify-between space-x-4">
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-orange-400 rounded-full mr-1"></span>
                  2 Star:
                </span>
                <span>{tooltip.data.twoStar}</span>
              </div>
            )}
            {tooltip.data.oneStar > 0 && (
              <div className="flex items-center justify-between space-x-4">
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                  1 Star:
                </span>
                <span>{tooltip.data.oneStar}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}