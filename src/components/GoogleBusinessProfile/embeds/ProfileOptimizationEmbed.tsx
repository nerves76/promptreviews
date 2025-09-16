/**
 * ProfileOptimizationEmbed Component
 * 
 * Standalone embeddable component showing profile optimization metrics
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

const ProgressBar = ({ percentage, className = "bg-slate-blue", animate = false }: { percentage: number; className?: string; animate?: boolean }) => (
  <div className="w-full bg-gray-200 rounded-full h-2">
    <div 
      className={`h-2 rounded-full transition-all duration-[2000ms] ease-out ${className}`}
      style={{ width: animate ? `${Math.min(percentage, 100)}%` : '0%' }}
    ></div>
  </div>
);

interface ProfileOptimizationEmbedProps {
  title?: string;
  showHeader?: boolean;
  className?: string;
}

export default function ProfileOptimizationEmbed({
  title = "Profile Optimization",
  showHeader = true,
  className = ""
}: ProfileOptimizationEmbedProps) {
  const { ref: cardRef, isVisible: cardIsVisible } = useIntersectionObserver();
  
  // Sample data showcasing good performance
  const sampleData = {
    categoriesUsed: 4,
    maxCategories: 10,  // Google allows up to 10, but 5 is considered excellent
    servicesCount: 12,
    servicesWithDescriptions: 10,
    businessDescriptionLength: 680,
    businessDescriptionMaxLength: 750,
    seoScore: 87
  };
  
  // For categories, we consider 5 to be excellent (100%), since not all businesses have 10 relevant categories
  const categoryCompletion = Math.min((sampleData.categoriesUsed / 5) * 100, 100);
  const serviceDescriptionCompletion = (sampleData.servicesWithDescriptions / sampleData.servicesCount) * 100;
  const businessDescriptionCompletion = (sampleData.businessDescriptionLength / sampleData.businessDescriptionMaxLength) * 100;
  
  const animatedCategoryCompletion = useCountUp(Math.round(categoryCompletion), 2500, cardIsVisible);
  const animatedServiceCompletion = useCountUp(Math.round(serviceDescriptionCompletion), 2800, cardIsVisible);
  const animatedDescriptionCompletion = useCountUp(Math.round(businessDescriptionCompletion), 3000, cardIsVisible);
  const animatedSeoScore = useCountUp(sampleData.seoScore, 3500, cardIsVisible);
  
  return (
    <div ref={cardRef} className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <Icon name="FaChartPie" className="w-6 h-6 text-slate-blue" />
            </div>
            <h3 className="text-lg font-semibold text-slate-blue">{title}</h3>
          </div>
          <div className="text-2xl font-bold text-slate-blue">{animatedSeoScore}%</div>
        </div>
      )}
      
      <div className="space-y-4">
        {/* Categories */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-700">Business Categories</span>
            <span className="text-sm font-medium text-gray-900">{animatedCategoryCompletion}%</span>
          </div>
          <ProgressBar percentage={categoryCompletion} animate={cardIsVisible} />
          <p className="text-xs text-gray-500 mt-1">{sampleData.categoriesUsed} categories selected (5+ recommended)</p>
        </div>
        
        {/* Service Descriptions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-700">Service Descriptions</span>
            <span className="text-sm font-medium text-gray-900">{animatedServiceCompletion}%</span>
          </div>
          <ProgressBar percentage={serviceDescriptionCompletion} className="bg-green-500" animate={cardIsVisible} />
          <p className="text-xs text-gray-500 mt-1">{sampleData.servicesWithDescriptions} of {sampleData.servicesCount} services have descriptions</p>
        </div>
        
        {/* Business Description */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-700">Business Description</span>
            <span className="text-sm font-medium text-gray-900">{animatedDescriptionCompletion}%</span>
          </div>
          <ProgressBar percentage={businessDescriptionCompletion} className="bg-purple-500" animate={cardIsVisible} />
          <p className="text-xs text-gray-500 mt-1">{sampleData.businessDescriptionLength} of {sampleData.businessDescriptionMaxLength} characters used</p>
        </div>
        
        {/* SEO Score Summary */}
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon name="FaCheck" className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Excellent SEO Performance</span>
            </div>
            <span className="text-xs text-green-600">Above Industry Average</span>
          </div>
        </div>
      </div>
    </div>
  );
}