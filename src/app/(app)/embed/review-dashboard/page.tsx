/**
 * Embeddable Review Dashboard
 * This page is loaded in an iframe by the widget script
 */

'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, Suspense } from 'react';
import ProfileOptimizationEmbed from '@/components/GoogleBusinessProfile/embeds/ProfileOptimizationEmbed';
import CustomerEngagementEmbed from '@/components/GoogleBusinessProfile/embeds/CustomerEngagementEmbed';
import OptimizationOpportunitiesEmbed from '@/components/GoogleBusinessProfile/embeds/OptimizationOpportunitiesEmbed';
import OverviewStatsEmbed from '@/components/GoogleBusinessProfile/embeds/OverviewStatsEmbed';
import SpriteLoader from '@/components/SpriteLoader';

function EmbedReviewDashboardContent() {
  const searchParams = useSearchParams();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(true);
  
  // Parse parameters
  const theme = searchParams.get('theme') || 'light';
  const showHeader = searchParams.get('showHeader') !== 'false';
  const componentsParam = searchParams.get('components') || 'overview,optimization,engagement,recommendations';
  const components = componentsParam.split(',').filter(Boolean);
  
  // Send height updates to parent
  useEffect(() => {
    const sendHeight = () => {
      const height = document.body.scrollHeight;
      window.parent.postMessage({
        type: 'resize',
        height: height
      }, '*');
    };
    
    // Send initial height
    sendHeight();
    
    // Watch for changes
    const observer = new ResizeObserver(sendHeight);
    observer.observe(document.body);
    
    return () => observer.disconnect();
  }, []);
  
  // Apply theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  // Handle scroll detection for fade indicators
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isScrollable = scrollHeight > clientHeight;
      
      // Show top fade if scrolled down
      setShowTopFade(isScrollable && scrollTop > 10);
      
      // Show bottom fade if not at bottom
      setShowBottomFade(isScrollable && scrollTop < scrollHeight - clientHeight - 10);
    };
    
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Initial check
      handleScroll();
    }
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [components]); // Re-run when components change
  
  const componentMap: Record<string, JSX.Element> = {
    overview: (
      <div key="overview">
        {showHeader && <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-white'}`}>Review Trends Overview</h2>}
        <OverviewStatsEmbed />
      </div>
    ),
    optimization: (
      <div key="optimization">
        {showHeader && <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-white'}`}>Profile Optimization Score</h2>}
        <ProfileOptimizationEmbed />
      </div>
    ),
    engagement: (
      <div key="engagement">
        {showHeader && <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-white'}`}>Customer Engagement Metrics</h2>}
        <CustomerEngagementEmbed />
      </div>
    ),
    recommendations: (
      <div key="recommendations">
        {showHeader && <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-white'}`}>AI-Powered Recommendations</h2>}
        <OptimizationOpportunitiesEmbed />
      </div>
    )
  };
  
  return (
    <div className={`relative min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Fixed border container - moved inside scrollable area to prevent clipping */}
      <div className={`absolute inset-0 pointer-events-none border-4 ${theme === 'dark' ? 'border-gray-700/30' : 'border-gray-200/30'} rounded-lg`}></div>
      
      {/* Top scroll fade indicator - more subtle glassmorphic effect */}
      <div className={`fixed top-0 left-0 right-0 h-12 pointer-events-none z-20 transition-opacity duration-300 ${
        showTopFade ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className={`h-full ${
          theme === 'dark' 
            ? 'bg-gradient-to-b from-gray-900/80 via-gray-900/40 to-transparent backdrop-blur-sm' 
            : 'bg-gradient-to-b from-white/80 via-white/40 to-transparent backdrop-blur-sm'
        }`}></div>
      </div>
      
      {/* Bottom scroll fade indicator - more subtle glassmorphic effect */}
      <div className={`fixed bottom-0 left-0 right-0 h-12 pointer-events-none z-20 transition-opacity duration-300 ${
        showBottomFade ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className={`h-full ${
          theme === 'dark'
            ? 'bg-gradient-to-t from-gray-900/80 via-gray-900/40 to-transparent backdrop-blur-sm'
            : 'bg-gradient-to-t from-white/80 via-white/40 to-transparent backdrop-blur-sm'
        }`}></div>
      </div>
      
      {/* Scrollable content */}
      <div 
        ref={scrollContainerRef}
        className="h-screen overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent relative"
      >
        <div className="p-6 space-y-8 pt-8 pb-16">
          {components.map(component => componentMap[component] || null)}
        </div>
      </div>
    </div>
  );
}

export default function EmbedReviewDashboard() {
  return (
    <>
      <SpriteLoader />
      <Suspense fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      }>
        <EmbedReviewDashboardContent />
      </Suspense>
    </>
  );
}