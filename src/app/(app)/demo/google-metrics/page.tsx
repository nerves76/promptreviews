/**
 * Google Business Metrics Demo Page
 * 
 * Demonstrates how to use the embeddable metric components
 * for marketing pages with sample data
 */

'use client';

import ProfileOptimizationEmbed from '@/components/GoogleBusinessProfile/embeds/ProfileOptimizationEmbed';
import CustomerEngagementEmbed from '@/components/GoogleBusinessProfile/embeds/CustomerEngagementEmbed';
import OptimizationOpportunitiesEmbed from '@/components/GoogleBusinessProfile/embeds/OptimizationOpportunitiesEmbed';
import BusinessPerformanceEmbed from '@/components/GoogleBusinessProfile/embeds/BusinessPerformanceEmbed';
import OverviewStatsEmbed from '@/components/GoogleBusinessProfile/embeds/OverviewStatsEmbed';

export default function GoogleMetricsDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Google Business Profile Analytics
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform your Google Business Profile with data-driven insights and actionable recommendations
          </p>
        </div>

        {/* Components Demo Grid */}
        <div className="space-y-16">
          {/* Overview Stats */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Trends Overview</h2>
            <OverviewStatsEmbed />
          </section>

          {/* Business Performance */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Business Performance</h2>
            <BusinessPerformanceEmbed />
          </section>

          {/* Profile Optimization */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Optimization Score</h2>
            <ProfileOptimizationEmbed />
          </section>

          {/* Customer Engagement */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Engagement Metrics</h2>
            <CustomerEngagementEmbed />
          </section>

          {/* Optimization Opportunities */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">AI-Powered Recommendations</h2>
            <OptimizationOpportunitiesEmbed />
          </section>
        </div>

        {/* Call to Action */}
        <section className="mt-16 bg-gradient-to-r from-slate-600 to-slate-800 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Optimize Your Google Business Profile?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of businesses improving their online presence with our analytics platform
          </p>
          <div className="flex gap-4 justify-center">
            <button className="px-8 py-3 bg-white text-slate-800 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Get Started Free
            </button>
            <button className="px-8 py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-colors">
              View Live Demo
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}