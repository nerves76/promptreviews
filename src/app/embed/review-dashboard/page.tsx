/**
 * Embeddable Review Dashboard
 * This page is loaded in an iframe by the widget script
 */

'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import ProfileOptimizationEmbed from '@/components/GoogleBusinessProfile/embeds/ProfileOptimizationEmbed';
import CustomerEngagementEmbed from '@/components/GoogleBusinessProfile/embeds/CustomerEngagementEmbed';
import OptimizationOpportunitiesEmbed from '@/components/GoogleBusinessProfile/embeds/OptimizationOpportunitiesEmbed';
import OverviewStatsEmbed from '@/components/GoogleBusinessProfile/embeds/OverviewStatsEmbed';

function EmbedReviewDashboardContent() {
  const searchParams = useSearchParams();
  
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
  
  const componentMap: Record<string, JSX.Element> = {
    overview: (
      <div key="overview">
        {showHeader && <h2 className="text-xl font-bold text-gray-900 mb-4">Review Trends Overview</h2>}
        <OverviewStatsEmbed />
      </div>
    ),
    optimization: (
      <div key="optimization">
        {showHeader && <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Optimization Score</h2>}
        <ProfileOptimizationEmbed />
      </div>
    ),
    engagement: (
      <div key="engagement">
        {showHeader && <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Engagement Metrics</h2>}
        <CustomerEngagementEmbed />
      </div>
    ),
    recommendations: (
      <div key="recommendations">
        {showHeader && <h2 className="text-xl font-bold text-gray-900 mb-4">AI-Powered Recommendations</h2>}
        <OptimizationOpportunitiesEmbed />
      </div>
    )
  };
  
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="p-6 space-y-8">
        {components.map(component => componentMap[component] || null)}
      </div>
    </div>
  );
}

export default function EmbedReviewDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <EmbedReviewDashboardContent />
    </Suspense>
  );
}