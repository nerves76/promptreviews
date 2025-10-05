import { Metadata } from 'next';
import Link from 'next/link';
import { BarChart3, ChevronRight, TrendingUp, Target, Clock, Users, PieChart, Activity } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Analytics & Insights - Track Review Collection Performance | Prompt Reviews',
  description: 'Monitor review collection performance, completion rates, platform distribution, and customer engagement to optimize your review strategy.',
  keywords: ['analytics', 'review insights', 'performance tracking', 'completion rates', 'data analysis'],
};

export default function AnalyticsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-white/60 mb-6">
        <Link href="/" className="hover:text-white">Home</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <Link href="/prompt-pages" className="hover:text-white">Prompt Pages</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <Link href="/prompt-pages/features" className="hover:text-white">Features</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-white">Analytics & Insights</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">Analytics & insights</h1>
        </div>
        <p className="text-xl text-white/80">
          Track performance metrics, gain actionable insights into your review collection efforts, and make data-driven decisions to optimize your review strategy.
        </p>
      </div>

      {/* Overview */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">What analytics do you get?</h2>
        <p className="text-white/80 mb-4">
          Analytics & Insights provide comprehensive data about your review collection performance. Track everything from completion rates and platform distribution to customer engagement patterns and timing optimization.
        </p>
        <p className="text-white/80">
          Understanding your review collection data helps you identify what's working, what needs improvement, and where to focus your efforts for maximum impact.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Key metrics tracked</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-300" />
              <h3 className="font-semibold text-white">Completion Rates</h3>
            </div>
            <p className="text-sm text-white/70">
              See how many customers complete reviews vs those who start but don't finish
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="w-5 h-5 text-blue-300" />
              <h3 className="font-semibold text-white">Platform Distribution</h3>
            </div>
            <p className="text-sm text-white/70">
              Track which review platforms (Google, Facebook, etc.) receive the most reviews
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-purple-300" />
              <h3 className="font-semibold text-white">Customer Engagement</h3>
            </div>
            <p className="text-sm text-white/70">
              Monitor how customers interact with your prompt pages and features
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-orange-300" />
              <h3 className="font-semibold text-white">Timing Insights</h3>
            </div>
            <p className="text-sm text-white/70">
              Discover optimal times and days for sending review requests
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-red-300" />
              <h3 className="font-semibold text-white">Conversion Metrics</h3>
            </div>
            <p className="text-sm text-white/70">
              Track conversions from prompt page visits to completed reviews
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-yellow-300" />
              <h3 className="font-semibold text-white">Performance Trends</h3>
            </div>
            <p className="text-sm text-white/70">
              View trends over time to understand improvement or decline
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">How it works</h2>
        <ol className="space-y-4">
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
            <div>
              <h4 className="font-semibold text-white mb-1">Automatic data collection</h4>
              <p className="text-white/70 text-sm">System tracks all customer interactions with your prompt pages</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
            <div>
              <h4 className="font-semibold text-white mb-1">Data analysis and processing</h4>
              <p className="text-white/70 text-sm">Analytics engine processes data to identify patterns and trends</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
            <div>
              <h4 className="font-semibold text-white mb-1">Visual dashboard presentation</h4>
              <p className="text-white/70 text-sm">View insights through easy-to-understand charts and graphs</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
            <div>
              <h4 className="font-semibold text-white mb-1">Actionable recommendations</h4>
              <p className="text-white/70 text-sm">Receive suggestions for improving your review collection strategy</p>
            </div>
          </li>
        </ol>
      </div>

      {/* Benefits */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Key benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Data-driven decisions</h4>
              <p className="text-sm text-white/70">Make informed choices based on real performance data</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Identify opportunities</h4>
              <p className="text-sm text-white/70">Discover where you can improve review collection</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Optimize performance</h4>
              <p className="text-sm text-white/70">Continuously improve based on what works best</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Track ROI</h4>
              <p className="text-sm text-white/70">Measure return on investment for review collection efforts</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Understand customers better</h4>
              <p className="text-sm text-white/70">Learn how customers interact with your review process</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Benchmark progress</h4>
              <p className="text-sm text-white/70">Compare current performance against historical data</p>
            </div>
          </div>
        </div>
      </div>

      {/* Insights Examples */}
      <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Example insights you might discover</h2>
        <div className="space-y-3">
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Platform performance</h4>
            <p className="text-sm text-white/70">
              "Google reviews have 2x higher completion rates than Facebook - focus more effort there"
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Timing optimization</h4>
            <p className="text-sm text-white/70">
              "Review requests sent within 24 hours get 40% higher response rates"
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Content effectiveness</h4>
            <p className="text-sm text-white/70">
              "Shorter questions have 25% higher completion rates than longer ones"
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Feature usage</h4>
            <p className="text-sm text-white/70">
              "Customers using AI assistance complete 30% more detailed reviews"
            </p>
          </div>
        </div>
      </div>

      {/* Perfect For */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Perfect for</h2>
        <ul className="space-y-3">
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Data-driven businesses</strong> wanting to optimize every aspect of review collection</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Marketing teams</strong> tracking campaign performance and ROI</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Multi-location businesses</strong> comparing performance across locations</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Growing businesses</strong> wanting to scale review collection effectively</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Any business</strong> serious about improving their review collection strategy</span>
          </li>
        </ul>
      </div>

      {/* Related Features */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Related features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/analytics"
            className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
          >
            <div className="flex-1">
              <div className="font-semibold text-white group-hover:underline">Analytics Dashboard</div>
              <div className="text-xs text-white/60">View your full analytics</div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60" />
          </Link>

          <Link
            href="/prompt-pages/features"
            className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
          >
            <div className="flex-1">
              <div className="font-semibold text-white group-hover:underline">All Features</div>
              <div className="text-xs text-white/60">View all prompt page features</div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60" />
          </Link>
        </div>
      </div>
    </div>
  );
}
