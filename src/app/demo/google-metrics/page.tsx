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

        {/* Review Trends Section */}
        <section className="mb-16">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Review Growth & Trends
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Monitor your review performance with detailed analytics showing monthly trends, 
                rating distributions, and growth patterns. Understand how your reputation evolves 
                over time and identify opportunities to improve customer satisfaction.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="ml-3 text-gray-700">Track 295 total reviews with 50% growth</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="ml-3 text-gray-700">Maintain 4.8 average star rating</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="ml-3 text-gray-700">Analyze monthly review velocity trends</span>
                </li>
              </ul>
            </div>
            <OverviewStatsEmbed />
          </div>
        </section>

        {/* Business Performance Section */}
        <section className="mb-16">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <BusinessPerformanceEmbed />
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Real-Time Performance Analytics
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Track your Google Business Profile's impact with comprehensive performance metrics. 
                Monitor profile views, customer actions, and search visibility trends to understand 
                how customers find and interact with your business online.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="ml-3 text-gray-700">15,847 monthly profile views with 23% growth</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="ml-3 text-gray-700">Track website clicks, calls, and directions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="ml-3 text-gray-700">Discover top search queries driving traffic</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Profile Optimization Section */}
        <section className="mb-16">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Profile Optimization Score
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Our AI-powered analysis evaluates your Google Business Profile completeness and provides 
                an SEO score based on industry best practices. Track your progress across key metrics 
                including business categories, service descriptions, and content optimization.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="ml-3 text-gray-700">Real-time optimization tracking</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="ml-3 text-gray-700">Industry-specific SEO recommendations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="ml-3 text-gray-700">Content completeness analysis</span>
                </li>
              </ul>
            </div>
            <ProfileOptimizationEmbed />
          </div>
        </section>

        {/* Customer Engagement Section */}
        <section className="mb-16">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="order-2 lg:order-1">
              <CustomerEngagementEmbed />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Customer Engagement Metrics
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Monitor and improve your customer interactions with comprehensive engagement analytics. 
                Track review response rates, Q&A participation, and weekly activity trends to build 
                stronger customer relationships.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="ml-3 text-gray-700">98.6% average response rate achievement</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="ml-3 text-gray-700">2-hour average response time</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="ml-3 text-gray-700">Weekly engagement tracking</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Optimization Opportunities Section */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              AI-Powered Optimization Recommendations
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Get personalized recommendations to improve your Google Business Profile performance. 
              Each suggestion includes impact metrics and time estimates to help you prioritize improvements.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <OptimizationOpportunitiesEmbed />
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-gradient-to-r from-slate-600 to-slate-800 rounded-2xl p-12 text-center text-white">
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

        {/* Usage Examples */}
        <section className="mt-16 space-y-8">
          <div className="p-8 bg-gray-100 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">How to Embed These Components</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* React/Next.js Usage */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">React/Next.js Integration</h4>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`// Import individual components
import OverviewStatsEmbed from '@/components/GoogleBusinessProfile/embeds/OverviewStatsEmbed';
import ProfileOptimizationEmbed from '@/components/GoogleBusinessProfile/embeds/ProfileOptimizationEmbed';
import CustomerEngagementEmbed from '@/components/GoogleBusinessProfile/embeds/CustomerEngagementEmbed';
import BusinessPerformanceEmbed from '@/components/GoogleBusinessProfile/embeds/BusinessPerformanceEmbed';
import OptimizationOpportunitiesEmbed from '@/components/GoogleBusinessProfile/embeds/OptimizationOpportunitiesEmbed';

// Use in your marketing pages
<OverviewStatsEmbed 
  showHeader={true}
  className="shadow-lg mb-8"
/>

<ProfileOptimizationEmbed 
  title="Profile Optimization" 
  showHeader={true}
  className="shadow-lg" 
/>

<CustomerEngagementEmbed 
  showHeader={false}  // Hide header
/>

<BusinessPerformanceEmbed 
  showHeader={true}
  className="max-w-2xl mx-auto"
/>

<OptimizationOpportunitiesEmbed 
  maxItems={3}  // Show top 3 only
/>`}
                </pre>
              </div>

              {/* HTML/JavaScript Usage */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">HTML/JavaScript Integration</h4>
                <pre className="bg-gray-900 text-blue-400 p-4 rounded-lg overflow-x-auto text-sm">
{`<!-- Include in your HTML head -->
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

<!-- Container elements -->
<div id="review-trends-widget"></div>
<div id="profile-optimization-widget"></div>
<div id="customer-engagement-widget"></div>
<div id="business-performance-widget"></div>

<!-- Widget scripts -->
<script>
// Load review trends widget
ReactDOM.render(
  React.createElement(OverviewStatsEmbed, {
    showHeader: true,
    className: 'shadow-lg mb-8'
  }),
  document.getElementById('review-trends-widget')
);

// Load profile optimization widget
ReactDOM.render(
  React.createElement(ProfileOptimizationEmbed, {
    showHeader: true,
    className: 'shadow-lg'
  }),
  document.getElementById('profile-optimization-widget')
);
</script>`}
                </pre>
              </div>
            </div>
          </div>

          {/* Individual Component Embed Codes */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Individual Component Embed Codes</h3>
            
            {/* Review Trends Embed */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-800">Review Progress Chart</h4>
                <button className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-md font-medium hover:bg-blue-200 transition-colors"
                        onClick={() => navigator.clipboard.writeText(document.getElementById('review-trends-code')?.textContent || '')}>
                  Copy Code
                </button>
              </div>
              <pre id="review-trends-code" className="bg-gray-50 p-4 rounded-md text-sm overflow-x-auto border">
{`<OverviewStatsEmbed 
  showHeader={true}
  className="shadow-lg"
/>

<!-- OR for HTML/JS -->
<div id="review-trends-widget"></div>
<script>
ReactDOM.render(
  React.createElement(OverviewStatsEmbed, {
    showHeader: true,
    className: 'shadow-lg'
  }),
  document.getElementById('review-trends-widget')
);
</script>`}
              </pre>
            </div>

            {/* Profile Optimization Embed */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-800">Profile Optimization Score</h4>
                <button className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-md font-medium hover:bg-blue-200 transition-colors"
                        onClick={() => navigator.clipboard.writeText(document.getElementById('profile-optimization-code')?.textContent || '')}>
                  Copy Code
                </button>
              </div>
              <pre id="profile-optimization-code" className="bg-gray-50 p-4 rounded-md text-sm overflow-x-auto border">
{`<ProfileOptimizationEmbed 
  title="Profile Optimization Score"
  showHeader={true}
  className="shadow-lg"
/>

<!-- OR for HTML/JS -->
<div id="profile-optimization-widget"></div>
<script>
ReactDOM.render(
  React.createElement(ProfileOptimizationEmbed, {
    title: 'Profile Optimization Score',
    showHeader: true,
    className: 'shadow-lg'
  }),
  document.getElementById('profile-optimization-widget')
);
</script>`}
              </pre>
            </div>

            {/* Customer Engagement Embed */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-800">Customer Engagement Metrics</h4>
                <button className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-md font-medium hover:bg-blue-200 transition-colors"
                        onClick={() => navigator.clipboard.writeText(document.getElementById('customer-engagement-code')?.textContent || '')}>
                  Copy Code
                </button>
              </div>
              <pre id="customer-engagement-code" className="bg-gray-50 p-4 rounded-md text-sm overflow-x-auto border">
{`<CustomerEngagementEmbed 
  showHeader={true}
  className="shadow-lg"
/>

<!-- OR for HTML/JS -->
<div id="customer-engagement-widget"></div>
<script>
ReactDOM.render(
  React.createElement(CustomerEngagementEmbed, {
    showHeader: true,
    className: 'shadow-lg'
  }),
  document.getElementById('customer-engagement-widget')
);
</script>`}
              </pre>
            </div>

            {/* Business Performance Embed */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-800">Business Performance Analytics</h4>
                <button className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-md font-medium hover:bg-blue-200 transition-colors"
                        onClick={() => navigator.clipboard.writeText(document.getElementById('business-performance-code')?.textContent || '')}>
                  Copy Code
                </button>
              </div>
              <pre id="business-performance-code" className="bg-gray-50 p-4 rounded-md text-sm overflow-x-auto border">
{`<BusinessPerformanceEmbed 
  showHeader={true}
  className="shadow-lg max-w-2xl mx-auto"
/>

<!-- OR for HTML/JS -->
<div id="business-performance-widget"></div>
<script>
ReactDOM.render(
  React.createElement(BusinessPerformanceEmbed, {
    showHeader: true,
    className: 'shadow-lg max-w-2xl mx-auto'
  }),
  document.getElementById('business-performance-widget')
);
</script>`}
              </pre>
            </div>

            {/* Optimization Opportunities Embed */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-800">AI-Powered Recommendations</h4>
                <button className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-md font-medium hover:bg-blue-200 transition-colors"
                        onClick={() => navigator.clipboard.writeText(document.getElementById('optimization-opportunities-code')?.textContent || '')}>
                  Copy Code
                </button>
              </div>
              <pre id="optimization-opportunities-code" className="bg-gray-50 p-4 rounded-md text-sm overflow-x-auto border">
{`<OptimizationOpportunitiesEmbed 
  maxItems={5}
  showHeader={true}
  className="shadow-lg"
/>

<!-- OR for HTML/JS -->
<div id="optimization-opportunities-widget"></div>
<script>
ReactDOM.render(
  React.createElement(OptimizationOpportunitiesEmbed, {
    maxItems: 5,
    showHeader: true,
    className: 'shadow-lg'
  }),
  document.getElementById('optimization-opportunities-widget')
);
</script>`}
              </pre>
            </div>
          </div>

          {/* Complete Page Template */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-blue-200 rounded-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Complete Marketing Page Template</h3>
              <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md font-medium hover:bg-blue-700 transition-colors"
                      onClick={() => navigator.clipboard.writeText(document.getElementById('complete-template-code')?.textContent || '')}>
                Copy Full Template
              </button>
            </div>
            <pre id="complete-template-code" className="bg-gray-900 text-green-400 p-6 rounded-lg overflow-x-auto text-sm max-h-96">
{`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Google Business Profile Analytics Demo</title>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 py-12">
    
    <!-- Header -->
    <div class="text-center mb-16">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">
        Google Business Profile Analytics
      </h1>
      <p class="text-xl text-gray-600 max-w-3xl mx-auto">
        Transform your Google Business Profile with data-driven insights
      </p>
    </div>

    <!-- Review Progress Section -->
    <section class="mb-16">
      <div class="grid lg:grid-cols-2 gap-8 items-center">
        <div>
          <h2 class="text-3xl font-bold text-gray-900 mb-4">
            Review Growth & Trends
          </h2>
          <p class="text-lg text-gray-600 mb-6">
            Monitor your review performance with detailed analytics showing 
            monthly trends and rating distributions.
          </p>
        </div>
        <div id="review-trends-widget"></div>
      </div>
    </section>

    <!-- Profile Optimization Section -->
    <section class="mb-16">
      <div class="grid lg:grid-cols-2 gap-8 items-center">
        <div id="profile-optimization-widget"></div>
        <div>
          <h2 class="text-3xl font-bold text-gray-900 mb-4">
            Profile Optimization Score
          </h2>
          <p class="text-lg text-gray-600">
            Track your Google Business Profile completeness and optimization.
          </p>
        </div>
      </div>
    </section>

    <!-- Customer Engagement Section -->
    <section class="mb-16">
      <div class="grid lg:grid-cols-2 gap-8 items-center">
        <div>
          <h2 class="text-3xl font-bold text-gray-900 mb-4">
            Customer Engagement
          </h2>
          <p class="text-lg text-gray-600">
            Monitor customer interactions and engagement metrics.
          </p>
        </div>
        <div id="customer-engagement-widget"></div>
      </div>
    </section>

    <!-- Business Performance Section -->
    <section class="mb-16">
      <div class="text-center mb-8">
        <h2 class="text-3xl font-bold text-gray-900 mb-4">
          Business Performance Analytics
        </h2>
      </div>
      <div id="business-performance-widget"></div>
    </section>

    <!-- Optimization Opportunities Section -->
    <section class="mb-16">
      <div class="text-center mb-8">
        <h2 class="text-3xl font-bold text-gray-900 mb-4">
          AI-Powered Recommendations
        </h2>
      </div>
      <div id="optimization-opportunities-widget"></div>
    </section>

  </div>

  <!-- Widget Scripts -->
  <script>
    // Load all widgets
    ReactDOM.render(
      React.createElement(OverviewStatsEmbed, { showHeader: true }),
      document.getElementById('review-trends-widget')
    );
    
    ReactDOM.render(
      React.createElement(ProfileOptimizationEmbed, { showHeader: true }),
      document.getElementById('profile-optimization-widget')
    );
    
    ReactDOM.render(
      React.createElement(CustomerEngagementEmbed, { showHeader: true }),
      document.getElementById('customer-engagement-widget')
    );
    
    ReactDOM.render(
      React.createElement(BusinessPerformanceEmbed, { showHeader: true }),
      document.getElementById('business-performance-widget')
    );
    
    ReactDOM.render(
      React.createElement(OptimizationOpportunitiesEmbed, { 
        maxItems: 5, 
        showHeader: true 
      }),
      document.getElementById('optimization-opportunities-widget')
    );
  </script>
</body>
</html>`}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
}