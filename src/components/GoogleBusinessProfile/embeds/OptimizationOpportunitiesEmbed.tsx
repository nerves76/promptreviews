/**
 * OptimizationOpportunitiesEmbed Component
 * 
 * Standalone embeddable component showing optimization opportunities
 * with sample data for marketing pages
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Icon, { IconName } from '@/components/Icon';

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

interface OptimizationOpportunity {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
  timeToImplement: string;
}

interface OptimizationOpportunitiesEmbedProps {
  title?: string;
  showHeader?: boolean;
  className?: string;
  maxItems?: number;
}

export default function OptimizationOpportunitiesEmbed({
  title = "Optimization Opportunities",
  showHeader = true,
  className = "",
  maxItems = 5
}: OptimizationOpportunitiesEmbedProps) {
  const { ref: cardRef, isVisible: cardIsVisible } = useIntersectionObserver();
  
  // Sample optimization opportunities
  const sampleOpportunities: OptimizationOpportunity[] = [
    {
      id: '1',
      title: 'Add More Photos',
      description: 'Businesses with photos receive 42% more requests for directions and 35% more click-throughs to their websites.',
      priority: 'high',
      impact: '+42% Direction Requests',
      timeToImplement: '15 mins'
    },
    {
      id: '2',
      title: 'Complete Service Descriptions',
      description: 'Adding detailed service descriptions helps customers understand your offerings and improves search visibility.',
      priority: 'high',
      impact: '+25% Search Visibility',
      timeToImplement: '30 mins'
    },
    {
      id: '3',
      title: 'Enable Messaging',
      description: 'Allow customers to message you directly from Google Search and Maps for quick inquiries.',
      priority: 'medium',
      impact: '+30% Customer Inquiries',
      timeToImplement: '5 mins'
    },
    {
      id: '4',
      title: 'Add Business Attributes',
      description: 'Highlight features like "wheelchair accessible" or "free Wi-Fi" to attract more customers.',
      priority: 'medium',
      impact: '+15% Profile Views',
      timeToImplement: '10 mins'
    },
    {
      id: '5',
      title: 'Create Google Posts',
      description: 'Share updates, offers, and events to keep your profile fresh and engaging.',
      priority: 'low',
      impact: '+20% Engagement',
      timeToImplement: '20 mins'
    }
  ];
  
  const displayOpportunities = sampleOpportunities.slice(0, maxItems);
  
  return (
    <div ref={cardRef} className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <Icon name="FaLightbulb" className="w-6 h-6 text-slate-blue" />
            </div>
            <h3 className="text-lg font-semibold text-slate-blue">{title}</h3>
          </div>
          <span className="text-sm text-gray-500">{displayOpportunities.length} Recommendations</span>
        </div>
      )}
      
      <div className="space-y-3">
        {displayOpportunities.map((opportunity, index) => (
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
                <p className="text-xs text-gray-600 mb-2">{opportunity.description}</p>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Icon name="FaChartLine" className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-medium text-green-600">{opportunity.impact}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Icon name="FaClock" className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-500">{opportunity.timeToImplement}</span>
                  </div>
                </div>
              </div>
              <button className="ml-2 text-slate-blue hover:text-slate-700 transition-colors">
                <Icon name="FaArrowRight" className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Summary Stats */}
      <div className="mt-4 p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600">Potential Impact</p>
            <p className="text-sm font-semibold text-slate-blue">+87% Profile Performance</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">Time to Complete All</p>
            <p className="text-sm font-semibold text-slate-blue">~1.5 hours</p>
          </div>
        </div>
      </div>
    </div>
  );
}