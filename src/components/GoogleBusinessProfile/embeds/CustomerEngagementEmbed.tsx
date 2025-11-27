/**
 * CustomerEngagementEmbed Component
 * 
 * Standalone embeddable component showing customer engagement metrics
 * with sample data for marketing pages
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

interface CustomerEngagementEmbedProps {
  title?: string;
  showHeader?: boolean;
  className?: string;
}

export default function CustomerEngagementEmbed({
  title = "Review Responses",
  showHeader = true,
  className = ""
}: CustomerEngagementEmbedProps) {
  const { ref: cardRef, isVisible: cardIsVisible } = useIntersectionObserver();

  // Sample data showcasing active engagement
  const sampleData = {
    unrespondedReviews: 2,
    totalReviews: 148,
    responseRate: 98.6,
    totalQuestions: 24,
    unansweredQuestions: 1,
    averageResponseTime: "2 hours",
    weeklyEngagement: {
      reviews: 12,
      questions: 5,
      posts: 3
    }
  };

  const animatedUnrespondedReviews = useCountUp(sampleData.unrespondedReviews, 2500, cardIsVisible);
  const animatedTotalReviews = useCountUp(sampleData.totalReviews, 3000, cardIsVisible);
  const animatedResponseRate = useCountUp(Math.round(sampleData.responseRate), 2800, cardIsVisible);
  const animatedTotalQuestions = useCountUp(sampleData.totalQuestions, 2600, cardIsVisible);
  const animatedUnansweredQuestions = useCountUp(sampleData.unansweredQuestions, 2400, cardIsVisible);

  return (
    <div ref={cardRef} className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <Icon name="FaCommentAlt" className="w-6 h-6 text-slate-blue" />
            </div>
            <h3 className="text-lg font-semibold text-slate-blue">{title}</h3>
          </div>
          <div className="flex items-center space-x-1">
            <Icon name="FaStar" className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">{animatedResponseRate}% Response Rate</span>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        {/* Review Response Status */}
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Icon name="FaCheckCircle" className="w-5 h-5 text-green-600" />
            <div>
              <span className="text-sm font-medium text-green-800">Excellent Response Rate</span>
              <p className="text-xs text-green-600">Avg response time: {sampleData.averageResponseTime}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-green-600">{animatedTotalReviews}</span>
            <p className="text-xs text-gray-600">Total Reviews</p>
          </div>
        </div>
        
        {/* Pending Items */}
        {sampleData.unrespondedReviews > 0 && (
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Icon name="FaExclamationTriangle" className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Reviews Need Response</span>
            </div>
            <span className="text-lg font-bold text-yellow-600">{animatedUnrespondedReviews}</span>
          </div>
        )}
        
        {/* Q&A Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{animatedTotalQuestions}</div>
            <div className="text-xs text-gray-600">Total Q&A</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{animatedUnansweredQuestions}</div>
            <div className="text-xs text-gray-600">Unanswered</div>
          </div>
        </div>
        
        {/* Weekly Activity */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">This Week's Activity</h4>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">{sampleData.weeklyEngagement.reviews}</div>
              <div className="text-xs text-gray-600">Reviews</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{sampleData.weeklyEngagement.questions}</div>
              <div className="text-xs text-gray-600">Questions</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">{sampleData.weeklyEngagement.posts}</div>
              <div className="text-xs text-gray-600">Posts</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}