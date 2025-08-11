import { Metadata } from 'next';
import Link from 'next/link';
import DocsLayout from '../docs-layout';
import PageHeader from '../components/PageHeader';
import { BarChart3, TrendingUp, Users, Star, Calendar, Filter, Download, Eye, MousePointer, Smile, MessageSquare, Clock, ArrowRight, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Analytics & Insights Guide | Prompt Reviews',
  description: 'Understand your review collection performance with comprehensive analytics, metrics tracking, and actionable insights in Prompt Reviews.',
  keywords: 'analytics, metrics, review tracking, performance insights, data analysis, prompt reviews',
};

export default function AnalyticsPage() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' },
            { label: 'Advanced', href: '/advanced' }
          ]}
          currentPage="Analytics"
          categoryLabel="Insights"
          categoryIcon={BarChart3}
          categoryColor="indigo"
          title="Analytics & insights"
          description="Track your review collection performance, understand customer sentiment, and make data-driven decisions to improve your review strategy."
        />

        {/* Overview */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Analytics Overview</h2>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <p className="text-white/90 mb-6">
              The Analytics dashboard provides comprehensive insights into your review collection efforts. Monitor performance, 
              track customer engagement, and identify opportunities to improve your review strategy.
            </p>
            
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <TrendingUp className="w-8 h-8 text-green-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white">Performance</h4>
                <p className="text-xs text-white/70 mt-1">Track growth trends</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <Smile className="w-8 h-8 text-yellow-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white">Sentiment</h4>
                <p className="text-xs text-white/70 mt-1">Customer satisfaction</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <Users className="w-8 h-8 text-blue-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white">Engagement</h4>
                <p className="text-xs text-white/70 mt-1">User interactions</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <Star className="w-8 h-8 text-purple-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white">Reviews</h4>
                <p className="text-xs text-white/70 mt-1">Platform distribution</p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Key Metrics Tracked</h2>
          
          <div className="space-y-6">
            {/* Review Metrics */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-start space-x-3 mb-4">
                <Star className="w-6 h-6 text-yellow-300 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">Review Metrics</h3>
                  <p className="text-white/80 mb-4">
                    Track review submissions and completion rates across all platforms.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="font-semibold text-white mb-1">Total Reviews</h4>
                      <p className="text-white/80 text-sm">All-time review count with breakdown by platform</p>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="font-semibold text-white mb-1">Review Timeline</h4>
                      <p className="text-white/80 text-sm">Visual chart showing review trends over time</p>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="font-semibold text-white mb-1">Platform Distribution</h4>
                      <p className="text-white/80 text-sm">Breakdown of reviews by Google, Facebook, Yelp, etc.</p>
                    </div>
                    
                    <div className="bg-white/5 rounded-lg p-3">
                      <h4 className="font-semibold text-white mb-1">Verified Reviews</h4>
                      <p className="text-white/80 text-sm">Track confirmed vs pending review submissions</p>
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
                      <h4 className="font-semibold text-white mb-1">Copy & Submit</h4>
                      <p className="text-white/70 text-sm">Manual review submissions</p>
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
                  <h3 className="text-xl font-semibold text-white mb-2">Emoji Sentiment Analysis</h3>
                  <p className="text-white/80 mb-4">
                    Understand customer satisfaction through emoji feedback.
                  </p>
                  
                  <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Sentiment Categories:</h4>
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
                  
                  <div className="mt-4 space-y-2 text-white/80 text-sm">
                    <p>• Track sentiment distribution over time</p>
                    <p>• Identify satisfaction trends</p>
                    <p>• View private feedback from negative sentiments</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Time Range Filtering */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Filtering & Time Ranges</h2>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-start space-x-3 mb-4">
              <Calendar className="w-6 h-6 text-purple-300 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">Available Time Ranges</h3>
                <p className="text-white/80 mb-4">
                  Filter your analytics data to focus on specific time periods.
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
                <h3 className="text-xl font-semibold text-white mb-2">Additional Filters</h3>
                <p className="text-white/80 mb-4">
                  Segment your data for deeper insights.
                </p>
                <ul className="space-y-2 text-white/80 text-sm">
                  <li>• Filter by prompt page (individual or universal)</li>
                  <li>• Filter by location (for multi-location businesses)</li>
                  <li>• Filter by review platform</li>
                  <li>• Filter by sentiment type</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Understanding Your Data */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Understanding Your Data</h2>
          
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">Reviews Over Time Chart</h3>
              <p className="text-white/80 text-sm mb-3">
                The line chart shows your review collection trends by month. Look for:
              </p>
              <ul className="space-y-1 text-white/70 text-sm">
                <li>• Growth patterns and seasonal trends</li>
                <li>• Impact of marketing campaigns</li>
                <li>• Consistency in review collection</li>
              </ul>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">Platform Performance</h3>
              <p className="text-white/80 text-sm mb-3">
                Understand which review platforms work best for your business:
              </p>
              <ul className="space-y-1 text-white/70 text-sm">
                <li>• Identify most popular platforms with customers</li>
                <li>• Optimize platform selection in prompt pages</li>
                <li>• Focus efforts on high-performing platforms</li>
              </ul>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">Engagement Insights</h3>
              <p className="text-white/80 text-sm mb-3">
                High engagement indicates effective prompt pages:
              </p>
              <ul className="space-y-1 text-white/70 text-sm">
                <li>• Low views? Promote your prompt pages more</li>
                <li>• Low click-through? Optimize page content</li>
                <li>• High AI usage? Customers appreciate assistance</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actionable Insights */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Taking Action on Analytics</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <TrendingUp className="w-8 h-8 text-green-300 mb-3" />
              <h3 className="font-semibold text-white mb-2">Improve Low Metrics</h3>
              <p className="text-white/80 text-sm">
                If reviews are low, try sending more requests, improving prompt page content, or offering incentives.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <MessageSquare className="w-8 h-8 text-blue-300 mb-3" />
              <h3 className="font-semibold text-white mb-2">Address Negative Sentiment</h3>
              <p className="text-white/80 text-sm">
                High negative sentiment? Review private feedback and address common concerns.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <Clock className="w-8 h-8 text-purple-300 mb-3" />
              <h3 className="font-semibold text-white mb-2">Optimize Timing</h3>
              <p className="text-white/80 text-sm">
                Identify when customers are most likely to leave reviews and time your requests accordingly.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <Star className="w-8 h-8 text-yellow-300 mb-3" />
              <h3 className="font-semibold text-white mb-2">Focus on Winners</h3>
              <p className="text-white/80 text-sm">
                Double down on platforms and strategies that show the best results.
              </p>
            </div>
          </div>
        </div>

        {/* Export & Reporting */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Exporting Data</h2>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <Download className="w-6 h-6 text-teal-300 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Data Export Options</h3>
                <p className="text-white/80 mb-4">
                  Export your analytics data for further analysis or reporting.
                </p>
                <div className="bg-teal-500/20 border border-teal-400/30 rounded-lg p-4">
                  <p className="text-sm text-white/80">
                    <strong>Coming Soon:</strong> CSV export functionality for all metrics, custom date ranges, 
                    and automated monthly reports sent to your email.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Analytics Best Practices</h2>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
              <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white">Check Weekly</h4>
                <p className="text-white/70 text-sm">Regular monitoring helps you spot trends early</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
              <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white">Compare Periods</h4>
                <p className="text-white/70 text-sm">Look at month-over-month and year-over-year growth</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
              <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white">Act on Insights</h4>
                <p className="text-white/70 text-sm">Use data to improve your review collection strategy</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
              <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white">Share with Team</h4>
                <p className="text-white/70 text-sm">Keep everyone informed about review performance</p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Explore Your Analytics?
          </h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Dive into your data and discover insights to grow your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard/analytics"
              className="inline-flex items-center px-6 py-3 bg-white/20 text-white backdrop-blur-sm font-medium rounded-lg hover:bg-white/30 transition-colors"
            >
              View Analytics
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            <Link
              href="/prompt-pages"
              className="inline-flex items-center px-6 py-3 border border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
            >
              Optimize Prompt Pages
            </Link>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}