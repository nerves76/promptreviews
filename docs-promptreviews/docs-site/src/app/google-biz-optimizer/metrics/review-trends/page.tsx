import type { Metadata } from 'next'
import Link from 'next/link'
import DocsLayout from '../../../docs-layout'
import PageHeader from '../../../components/PageHeader'
import {
  Star,
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle,
  AlertCircle,
  BarChart3,
  ArrowRight,
  Search,
  MessageSquare,
  Image,
  Phone,
  Globe,
  Lightbulb
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Review Trends | Google Biz Optimizer™',
  description: 'Your review trend shows the rate at which you\'re gaining new reviews compared to previous periods. It\'s a velocity metric that indicates momentum and business health.',
  keywords: [
    'Google Business Profile',
    'Metrics',
    'local SEO',
    'business optimization'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com/google-biz-optimizer/metrics/review-trends',
  },
}

export default function Page() {
  return (
    <DocsLayout>
      <PageHeader
        breadcrumbs={[
          { label: 'Help', href: '/' },
          { label: 'Google Biz Optimizer', href: '/google-biz-optimizer' }
        ]}
        currentPage="Review Trends"
        categoryLabel="Metrics"
        categoryIcon={BarChart3}
        categoryColor="blue"
        title="Review Trends"
        description="Your review trend shows the rate at which you're gaining new reviews compared to previous periods. It's a velocity metric that indicates momentum and business health."
      />

      <div className="prose prose-gray max-w-none">
        <h2 className="text-2xl font-bold mb-4 mt-8">What is Review Trend?</h2>
        <p className="mb-4">Your review trend shows the rate at which you're gaining new reviews compared to previous periods. It's a velocity metric that indicates momentum and business health.</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Why Review Velocity Matters</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Google's Freshness Factor</h3>
        <ul className="space-y-2 mb-6"><li>Reviews from the <strong>last 30 days</strong> have 3x more ranking weight</li><li>Steady review flow signals an active business</li><li>Sudden drops can hurt local rankings</li><li>Google prioritizes businesses with consistent recent reviews</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Customer Perception</h3>
        <ul className="space-y-2 mb-6"><li>Recent reviews show current service quality</li><li>Stale reviews (6+ months old) reduce trust by 40%</li><li>Active review streams indicate a thriving business</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Understanding Your Trend</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Positive Trends (+%)</h3>
        <ul className="space-y-2 mb-6"><li><strong>+10-25%:</strong> Healthy growth</li><li><strong>+25-50%:</strong> Excellent momentum</li><li><strong>+50%+:</strong> Exceptional (verify authenticity)</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Negative Trends (-%)</h3>
        <ul className="space-y-2 mb-6"><li><strong>-10%:</strong> Normal fluctuation</li><li><strong>-25%:</strong> Needs attention</li><li><strong>-50%+:</strong> Critical - immediate action required</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Factors Affecting Review Trends</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Seasonal Patterns</h3>
        <ul className="space-y-2 mb-6"><li>Retail: Peaks during holidays</li><li>Restaurants: Weekend spikes</li><li>Services: Post-project completion</li><li>Tourism: Vacation seasons</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Business Changes</h3>
        <ul className="space-y-2 mb-6"><li>New staff or management</li><li>Service quality variations</li><li>Marketing campaign effects</li><li>Competition activity</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Maintaining Steady Growth</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">1. Set Review Targets</h3>
        <ul className="space-y-2 mb-6"><li><strong>Minimum:</strong> 1 review per week</li><li><strong>Good:</strong> 2-3 reviews per week</li><li><strong>Excellent:</strong> 1+ review daily</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">2. Create Systems</h3>
        <ul className="space-y-2 mb-6"><li>Automated review invitations</li><li>Staff incentive programs</li><li>Follow-up sequences</li><li>QR codes at point of sale</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">3. Monitor Consistently</h3>
        <ul className="space-y-2 mb-6"><li>Weekly trend reviews</li><li>Monthly goal assessments</li><li>Quarterly strategy adjustments</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Review Velocity Benchmarks</h2>
        <p className="mb-4">| Business Size | Monthly Target | Warning Level |</p>
        <p className="mb-4">|--------------|----------------|---------------|</p>
        <p className="mb-4">| Small (1-10 employees) | 4-8 reviews | <2 reviews |</p>
        <p className="mb-4">| Medium (11-50) | 8-20 reviews | <4 reviews |</p>
        <p className="mb-4">| Large (50+) | 20+ reviews | <10 reviews |</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Calculating Optimal Velocity</h2>
        <p className="mb-4"><strong>Formula:</strong> (Total Customers × 0.10) = Monthly review target</p>
        <p className="mb-4">Example: 500 customers/month × 10% = 50 reviews target</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Recovery Strategies</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">If Trend is Declining:</h3>
        <ul className="space-y-2 mb-6"><li><strong>Audit current process</strong> - Find the breakdown</li><li><strong>Re-engage past customers</strong> - Email campaign</li><li><strong>Incentivize staff</strong> - Review generation bonuses</li><li><strong>Simplify the process</strong> - One-click review links</li><li><strong>Address service issues</strong> - Fix root causes</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">What Google Biz Optimizer Monitors</h2>
        <ul className="space-y-2 mb-6"><li>30-day vs 90-day trends</li><li>Week-over-week changes</li><li>Competitor velocity comparison</li><li>Predictive trend analysis</li><li>Alert thresholds</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Quick Win</h2>
        <p className="mb-4"><strong>The 48-Hour Rule:</strong> Send review requests within 48 hours of service. Response rates drop 70% after 1 week.</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Pro Tips</h2>
        <ul className="space-y-2 mb-6"><li><strong>Tuesday-Thursday</strong> see highest review submission rates</li><li><strong>2-3 PM</strong> is optimal send time for review requests</li><li><strong>Text messages</strong> get 3x higher response than email</li><li><strong>Personal requests</strong> convert 5x better than automated</li></ul>
        <p className="mb-4">---</p>
        <p className="mb-4"><em>Want to automate review collection? <a href="https://promptreviews.app" className="text-blue-600 hover:text-blue-700 underline">Learn about PromptReviews</a></em></p>
      </div>
    </DocsLayout>
  )
}