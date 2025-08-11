/**
 * BusinessPerformanceEmbed Component
 * 
 * Standalone embeddable component showing business performance metrics
 * with bar charts and sample data for marketing pages
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Icon, { IconName } from '@/components/Icon';

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
        rootMargin: '-10% 0px -20% 0px'
      }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [hasAnimated]);
  
  return { ref, isVisible };
}

const AnimatedBar = ({ percentage, label, value, color, animate }: { 
  percentage: number; 
  label: string; 
  value: number;
  color: string;
  animate: boolean;
}) => {
  const animatedValue = useCountUp(value, 2500, animate);
  
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">{animatedValue.toLocaleString()}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className={`h-3 rounded-full transition-all duration-[2000ms] ease-out ${color}`}
          style={{ width: animate ? `${Math.min(percentage, 100)}%` : '0%' }}
        ></div>
      </div>
    </div>
  );
};

interface BusinessPerformanceEmbedProps {
  title?: string;
  showHeader?: boolean;
  className?: string;
}

export default function BusinessPerformanceEmbed({
  title = "Business Performance",
  showHeader = true,
  className = ""
}: BusinessPerformanceEmbedProps) {
  const { ref: cardRef, isVisible: cardIsVisible } = useIntersectionObserver();
  
  // Sample performance data
  const sampleData = {
    monthlyViews: 15847,
    viewsTrend: 23, // percentage increase
    previousMonthViews: 12876,
    customerActions: {
      websiteClicks: 1243,
      phoneCalls: 387,
      directionRequests: 892,
      photoViews: 3421,
      bookings: 156
    },
    topSearchQueries: [
      'restaurants near me',
      'italian food downtown',
      'best pizza delivery',
      'outdoor dining',
      'family restaurants'
    ],
    peakHours: {
      monday: [12, 19],
      tuesday: [12, 20],
      wednesday: [12, 20],
      thursday: [12, 21],
      friday: [11, 22],
      saturday: [11, 22],
      sunday: [11, 21]
    }
  };
  
  const animatedViews = useCountUp(sampleData.monthlyViews, 3000, cardIsVisible);
  const animatedTrend = useCountUp(sampleData.viewsTrend, 2000, cardIsVisible);
  
  // Calculate percentages for bar chart
  const maxAction = Math.max(...Object.values(sampleData.customerActions));
  const actionPercentages = {
    websiteClicks: (sampleData.customerActions.websiteClicks / maxAction) * 100,
    phoneCalls: (sampleData.customerActions.phoneCalls / maxAction) * 100,
    directionRequests: (sampleData.customerActions.directionRequests / maxAction) * 100,
    photoViews: (sampleData.customerActions.photoViews / maxAction) * 100,
    bookings: (sampleData.customerActions.bookings / maxAction) * 100
  };
  
  return (
    <div ref={cardRef} className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <Icon name="FaChartLine" className="w-6 h-6 text-slate-blue" />
            </div>
            <h3 className="text-lg font-semibold text-slate-blue">{title}</h3>
          </div>
        </div>
      )}
      
      {/* Monthly Views Hero Stat */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Monthly Profile Views</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-gray-900">
                {animatedViews.toLocaleString()}
              </span>
              <div className="flex items-center space-x-1">
                <Icon 
                  name="FaCaretUp" 
                  className="w-4 h-4 text-green-500"
                />
                <span className="text-sm font-medium text-green-600">
                  +{animatedTrend}%
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              vs. {sampleData.previousMonthViews.toLocaleString()} last month
            </p>
          </div>
          <div className="hidden sm:block">
            <Icon name="FaEye" className="w-12 h-12 text-blue-300" />
          </div>
        </div>
      </div>
      
      {/* Customer Actions Bar Chart */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Customer Actions This Month</h4>
        <AnimatedBar
          percentage={actionPercentages.photoViews}
          label="Photo Views"
          value={sampleData.customerActions.photoViews}
          color="bg-orange-500"
          animate={cardIsVisible}
        />
        <AnimatedBar
          percentage={actionPercentages.websiteClicks}
          label="Website Clicks"
          value={sampleData.customerActions.websiteClicks}
          color="bg-blue-500"
          animate={cardIsVisible}
        />
        <AnimatedBar
          percentage={actionPercentages.directionRequests}
          label="Direction Requests"
          value={sampleData.customerActions.directionRequests}
          color="bg-purple-500"
          animate={cardIsVisible}
        />
        <AnimatedBar
          percentage={actionPercentages.phoneCalls}
          label="Phone Calls"
          value={sampleData.customerActions.phoneCalls}
          color="bg-green-500"
          animate={cardIsVisible}
        />
        <AnimatedBar
          percentage={actionPercentages.bookings}
          label="Bookings"
          value={sampleData.customerActions.bookings}
          color="bg-pink-500"
          animate={cardIsVisible}
        />
      </div>
      
      {/* Top Search Queries */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Top Search Queries</h4>
        <div className="flex flex-wrap gap-2">
          {sampleData.topSearchQueries.map((query, index) => (
            <span
              key={index}
              className={`px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700 transform transition-all duration-500 ${
                cardIsVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
              }`}
              style={{
                transitionDelay: cardIsVisible ? `${1000 + index * 100}ms` : '0ms'
              }}
            >
              {query}
            </span>
          ))}
        </div>
      </div>
      
      {/* Performance Summary */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-green-50 rounded">
          <div className="text-lg font-bold text-green-600">↑ 23%</div>
          <div className="text-xs text-gray-600">Growth</div>
        </div>
        <div className="p-2 bg-blue-50 rounded">
          <div className="text-lg font-bold text-blue-600">6.2K</div>
          <div className="text-xs text-gray-600">Actions</div>
        </div>
        <div className="p-2 bg-purple-50 rounded">
          <div className="text-lg font-bold text-purple-600">#3</div>
          <div className="text-xs text-gray-600">Local Rank</div>
        </div>
      </div>
    </div>
  );
}