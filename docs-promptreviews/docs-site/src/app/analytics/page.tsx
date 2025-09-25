import { Metadata } from 'next';
import Link from 'next/link';
import DocsLayout from '../docs-layout';
import PageHeader from '../components/PageHeader';
import StandardOverviewLayout from '../components/StandardOverviewLayout';
import { pageFAQs } from '../utils/faqData';
import { BarChart3, TrendingUp, Users, Star, Calendar, Filter, Download, Eye, MousePointer, Smile, MessageSquare, Clock, ArrowRight, CheckCircle, PieChart, Activity, Target } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Analytics & Insights Guide | Prompt Reviews',
  description: 'Understand your review collection performance with comprehensive analytics, metrics tracking, and actionable insights in Prompt Reviews.',
  keywords: 'analytics, metrics, review tracking, performance insights, data analysis, prompt reviews',
};

export default function AnalyticsPage() {
  // Key features for analytics
  const keyFeatures = [
    {
      icon: BarChart3,
      title: 'Review Performance Tracking',
      description: 'Monitor review volume trends, platform distribution, and conversion rates across all your prompt pages with comprehensive visual charts.',
    },
    {
      icon: Smile,
      title: 'Sentiment Analysis',
      description: 'Track customer satisfaction through emoji feedback and sentiment trends. Identify patterns in positive and negative responses over time.',
    },
    {
      icon: MousePointer,
      title: 'Engagement Metrics',
      description: 'Analyze prompt page performance with detailed metrics on views, clicks, and conversion rates to optimize your review collection strategy.',
    },
    {
      icon: Filter,
      title: 'Advanced Filtering',
      description: 'Segment data by time periods, locations, prompt pages, and review platforms to get granular insights into your performance.',
    }
  ];

  // How analytics works
  const howItWorks = (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">1</div>
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white">Data Collection</h3>
        </div>
        <p className="text-white/90 ml-16">
          Analytics automatically track all customer interactions with your prompt pages, review submissions, and sentiment feedback in real-time.
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold">2</div>
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <PieChart className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white">Visual Insights</h3>
        </div>
        <p className="text-white/90 ml-16">
          View comprehensive dashboards with charts, graphs, and metrics that make it easy to understand your review collection performance at a glance.
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold">3</div>
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white">Actionable Optimization</h3>
        </div>
        <p className="text-white/90 ml-16">
          Use data insights to identify top-performing content, optimize underperforming pages, and make informed decisions to improve your review strategy.
        </p>
      </div>
    </div>
  );

  // Best practices for analytics
  const bestPractices = [
    {
      icon: Calendar,
      title: 'Regular Monitoring',
      description: 'Check analytics weekly to identify trends early and adjust your review collection strategy based on performance data.'
    },
    {
      icon: Filter,
      title: 'Use Time Comparisons',
      description: 'Compare month-over-month and year-over-year performance to understand seasonal patterns and long-term growth trends.'
    },
    {
      icon: Target,
      title: 'Focus on Conversion Rates',
      description: 'Track not just page views but actual review submissions to optimize the pages that drive the most valuable outcomes.'
    },
    {
      icon: Users,
      title: 'Share Insights with Team',
      description: 'Keep team members informed about performance metrics and use data to guide collaborative improvement efforts.'
    }
  ];

  // Key metrics section
  const keyMetricsSection = (
    <div className="max-w-4xl mx-auto mb-16">
      <h2 className="text-3xl font-bold text-white mb-8">Key Metrics Tracked</h2>

      <div className="space-y-6">
        {/* Review Metrics */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
          <div className="flex items-start space-x-3 mb-4">
            <Star className="w-6 h-6 text-yellow-300 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2">Review Performance</h3>
              <p className="text-white/80 mb-4">
                Track review submissions and completion rates across all platforms.
              </p>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-1">Total Reviews</h4>
                  <p className="text-white/80 text-sm">All-time review count with platform breakdown</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-1">Review Timeline</h4>
                  <p className="text-white/80 text-sm">Visual chart showing trends over time</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-1">Platform Distribution</h4>
                  <p className="text-white/80 text-sm">Breakdown by Google, Yelp, Facebook, etc.</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-1">Verified Reviews</h4>
                  <p className="text-white/80 text-sm">Track confirmed vs pending submissions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
          <div className="flex items-start space-x-3 mb-4">
            <MousePointer className="w-6 h-6 text-blue-300 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2">Engagement Analytics</h3>
              <p className="text-white/80 mb-4">
                Monitor how customers interact with your prompt pages.
              </p>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-1">Page Views</h4>
                  <p className="text-white/70 text-sm">Total prompt page visits</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-1">Click-Through Rate</h4>
                  <p className="text-white/70 text-sm">Platform button clicks</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-1">AI Generations</h4>
                  <p className="text-white/70 text-sm">AI-assisted review usage</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <h4 className="font-semibold text-white mb-1">Conversion Rate</h4>
                  <p className="text-white/70 text-sm">Views to review submissions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sentiment Analysis */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
          <div className="flex items-start space-x-3 mb-4">
            <Smile className="w-6 h-6 text-green-300 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-2">Customer Sentiment</h3>
              <p className="text-white/80 mb-4">
                Understand customer satisfaction through emoji feedback analysis.
              </p>

              <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-5 gap-2 text-center">
                  <div>
                    <div className="text-2xl mb-1">😁</div>
                    <p className="text-xs text-white/70">Excellent</p>
                  </div>
                  <div>
                    <div className="text-2xl mb-1">😊</div>
                    <p className="text-xs text-white/70">Satisfied</p>
                  </div>
                  <div>
                    <div className="text-2xl mb-1">😐</div>
                    <p className="text-xs text-white/70">Neutral</p>
                  </div>
                  <div>
                    <div className="text-2xl mb-1">😕</div>
                    <p className="text-xs text-white/70">Unsatisfied</p>
                  </div>
                  <div>
                    <div className="text-2xl mb-1">😣</div>
                    <p className="text-xs text-white/70">Frustrated</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-white/80 text-sm">
                <p>• Track sentiment distribution over time</p>
                <p>• Identify satisfaction trends and patterns</p>
                <p>• Access private feedback for improvement insights</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Time range filtering section
  const filteringSection = (
    <div className="max-w-4xl mx-auto mb-16">
      <h2 className="text-3xl font-bold text-white mb-8">Data Filtering & Time Ranges</h2>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <div className="flex items-start space-x-3 mb-4">
          <Calendar className="w-6 h-6 text-purple-300 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white mb-2">Time Range Options</h3>
            <p className="text-white/80 mb-4">
              Filter your analytics data to focus on specific time periods for better insights.
            </p>

            <div className="grid md:grid-cols-3 gap-3">
              <div className="bg-white/5 rounded-lg p-3">
                <h4 className="font-semibold text-white/90 text-sm mb-1">Short Term</h4>
                <ul className="space-y-1 text-white/70 text-xs">
                  <li>• This week</li>
                  <li>• Last week</li>
                  <li>• This month</li>
                  <li>• Last month</li>
                </ul>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <h4 className="font-semibold text-white/90 text-sm mb-1">Medium Term</h4>
                <ul className="space-y-1 text-white/70 text-xs">
                  <li>• Last 3 months</li>
                  <li>• Last 6 months</li>
                  <li>• This year</li>
                </ul>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <h4 className="font-semibold text-white/90 text-sm mb-1">Long Term</h4>
                <ul className="space-y-1 text-white/70 text-xs">
                  <li>• Last year</li>
                  <li>• All time</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-start space-x-3">
          <Filter className="w-6 h-6 text-indigo-300 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white mb-2">Advanced Filters</h3>
            <p className="text-white/80 mb-4">
              Segment your data for deeper insights and targeted analysis.
            </p>
            <ul className="space-y-2 text-white/80 text-sm">
              <li>• Filter by specific prompt pages (individual or universal)</li>
              <li>• Filter by location (for multi-location businesses)</li>
              <li>• Filter by review platform (Google, Yelp, Facebook, etc.)</li>
              <li>• Filter by sentiment type (positive, neutral, negative)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' }
          ]}
          currentPage="Analytics"
          categoryLabel="Insights"
          categoryIcon={BarChart3}
          categoryColor="indigo"
          title="Analytics & insights"
          description="Track your review collection performance, understand customer sentiment, and make data-driven decisions to improve your review strategy."
        />

        <StandardOverviewLayout
          title="Analytics & Performance Insights"
          description="Transform your review data into actionable insights with comprehensive analytics, sentiment tracking, and performance optimization tools."
          icon={BarChart3}
          iconColor="indigo"
          availablePlans={['grower', 'builder', 'maven']}

          keyFeatures={keyFeatures}
          howItWorks={howItWorks}
          bestPractices={
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
              <div className="space-y-6">
                {bestPractices.map((practice, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <practice.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-2">{practice.title}</h3>
                      <p className="text-white/80">{practice.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          }

          customSections={
            <>
              {keyMetricsSection}
              {filteringSection}
            </>
          }

          faqs={pageFAQs['analytics']}

          ctaTitle="Ready to Analyze Your Performance?"
          ctaDescription="Dive into your analytics dashboard and discover insights to optimize your review collection strategy."
          ctaButtons={[
            {
              text: 'Optimize Prompt Pages',
              href: '/prompt-pages',
              variant: 'secondary',
              icon: ArrowRight
            },
            {
              text: 'View Analytics',
              href: 'https://app.promptreviews.app/dashboard/analytics',
              variant: 'primary',
              icon: BarChart3
            }
          ]}
        />
      </div>
    </DocsLayout>
  );
}