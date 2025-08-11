/**
 * Review Trends Embed Component
 * 
 * Displays review trends over time with animated bar charts
 * Shows total reviews, average rating, and monthly distribution
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { FaStar, FaChartBar, FaArrowUp } from 'react-icons/fa';

interface ReviewTrendsEmbedProps {
  title?: string;
  showHeader?: boolean;
  className?: string;
}

// Hook for intersection observer
const useIntersectionObserver = (threshold = 0.3) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { 
        threshold,
        rootMargin: '-50px'
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold, isVisible]);

  return { ref, isVisible };
};

// Hook for count-up animation
const useCountUp = (end: number, duration: number = 2500, start: boolean = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    let startTime: number | null = null;
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(startValue + (end - startValue) * easeOutQuart);
      
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration, start]);

  return count;
};

export default function ReviewTrendsEmbed({ 
  title = "Review Performance", 
  showHeader = true,
  className = "" 
}: ReviewTrendsEmbedProps) {
  const { ref: containerRef, isVisible } = useIntersectionObserver();

  // Sample data for the last 6 months
  const monthlyData = [
    { month: 'Jul', reviews: 42, rating: 4.8 },
    { month: 'Aug', reviews: 38, rating: 4.7 },
    { month: 'Sep', reviews: 51, rating: 4.9 },
    { month: 'Oct', reviews: 45, rating: 4.8 },
    { month: 'Nov', reviews: 56, rating: 4.9 },
    { month: 'Dec', reviews: 63, rating: 4.9 },
  ];

  const totalReviews = monthlyData.reduce((sum, month) => sum + month.reviews, 0);
  const avgRating = (monthlyData.reduce((sum, month) => sum + month.rating, 0) / monthlyData.length).toFixed(1);
  const maxReviews = Math.max(...monthlyData.map(m => m.reviews));
  const growthRate = Math.round(((monthlyData[5].reviews - monthlyData[0].reviews) / monthlyData[0].reviews) * 100);

  // Animated values
  const animatedTotal = useCountUp(totalReviews, 2500, isVisible);
  const animatedGrowth = useCountUp(growthRate, 2000, isVisible);

  return (
    <div 
      ref={containerRef}
      className={`bg-white rounded-xl shadow-lg p-6 ${className}`}
    >
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FaChartBar className="w-5 h-5 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>
          <div className="flex items-center gap-2 text-green-600">
            <FaArrowUp className="w-4 h-4" />
            <span className="text-sm font-semibold">+{animatedGrowth}%</span>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{animatedTotal}</div>
          <div className="text-xs text-gray-500 mt-1">Total Reviews</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-2xl font-bold text-gray-900">{avgRating}</span>
            <FaStar className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-xs text-gray-500 mt-1">Avg Rating</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">+{animatedGrowth}%</div>
          <div className="text-xs text-gray-500 mt-1">Growth</div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-600 mb-2">Monthly Review Trends</div>
        <div className="flex items-end gap-2 h-32">
          {monthlyData.map((month, index) => {
            const heightPercentage = (month.reviews / maxReviews) * 100;
            const delay = index * 100;
            
            return (
              <div key={month.month} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center justify-end h-full">
                  <span className="text-xs font-semibold text-gray-700 mb-1">
                    {isVisible ? month.reviews : 0}
                  </span>
                  <div 
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-[1500ms] ease-out"
                    style={{
                      height: isVisible ? `${heightPercentage}%` : '0%',
                      transitionDelay: `${delay}ms`
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2">
          {monthlyData.map((month) => (
            <div key={month.month} className="flex-1 text-center">
              <span className="text-xs text-gray-500">{month.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rating Breakdown */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="text-sm font-medium text-gray-600 mb-3">Rating Distribution</div>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = stars === 5 ? 201 : stars === 4 ? 68 : stars === 3 ? 18 : stars === 2 ? 5 : 3;
            const percentage = (count / totalReviews) * 100;
            
            return (
              <div key={stars} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-12">
                  <span className="text-sm text-gray-600">{stars}</span>
                  <FaStar className="w-3 h-3 text-yellow-500" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-[2000ms] ease-out"
                    style={{ 
                      width: isVisible ? `${percentage}%` : '0%',
                      transitionDelay: `${(5 - stars) * 150}ms`
                    }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-10 text-right">
                  {isVisible ? count : 0}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}