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
  title: 'Monthly Patterns | Google Biz Optimizer™',
  description: 'The monthly review chart shows your review distribution over time, revealing patterns, trends, and opportunities in your customer feedback cycle.',
  keywords: [
    'Google Business Profile',
    'Metrics',
    'local SEO',
    'business optimization'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com/google-biz-optimizer/metrics/monthly-patterns',
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
        currentPage="Monthly Patterns"
        categoryLabel="Metrics"
        categoryIcon={BarChart3}
        categoryColor="blue"
        title="Monthly Patterns"
        description="The monthly review chart shows your review distribution over time, revealing patterns, trends, and opportunities in your customer feedback cycle."
      />

      <div className="prose prose-gray max-w-none">
        <h2 className="text-2xl font-bold mb-4 mt-8">Understanding Your Review Timeline</h2>
        <p className="mb-4">The monthly review chart shows your review distribution over time, revealing patterns, trends, and opportunities in your customer feedback cycle.</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Reading the Chart</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">What Each Bar Represents</h3>
        <ul className="space-y-2 mb-6"><li><strong>Height:</strong> Total reviews that month</li><li><strong>Colors:</strong> Star rating breakdown</li></ul>
        <p className="mb-4">  - 🟢 Green: 5-star reviews</p>
        <p className="mb-4">  - 🟡 Light Green: 4-star</p>
        <p className="mb-4">  - 🟠 Yellow: 3-star</p>
        <p className="mb-4">  - 🟠 Orange: 2-star</p>
        <p className="mb-4">  - 🔴 Red: 1-star</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">Key Patterns to Identify</h3>
        <ul className="space-y-2 mb-6"><li><strong>Growth trends:</strong> Increasing heights</li><li><strong>Consistency:</strong> Similar monthly totals</li><li><strong>Seasonality:</strong> Predictable fluctuations</li><li><strong>Anomalies:</strong> Unusual spikes or drops</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Common Review Patterns</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">The Growth Pattern 📈</h3>
        <p className="mb-4"><strong>What it looks like:</strong> Steadily increasing bar heights</p>
        <p className="mb-4"><strong>What it means:</strong> Business is gaining momentum</p>
        <p className="mb-4"><strong>Action:</strong> Maintain current strategies</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">The Plateau Pattern ➡️</h3>
        <p className="mb-4"><strong>What it looks like:</strong> Consistent height for months</p>
        <p className="mb-4"><strong>What it means:</strong> Stable but not growing</p>
        <p className="mb-4"><strong>Action:</strong> Implement new review generation tactics</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">The Decline Pattern 📉</h3>
        <p className="mb-4"><strong>What it looks like:</strong> Decreasing bar heights</p>
        <p className="mb-4"><strong>What it means:</strong> Warning sign - urgent attention needed</p>
        <p className="mb-4"><strong>Action:</strong> Audit and fix review process immediately</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">The Spike Pattern 📊</h3>
        <p className="mb-4"><strong>What it looks like:</strong> Sudden tall bar</p>
        <p className="mb-4"><strong>What it means:</strong> Campaign success or viral moment</p>
        <p className="mb-4"><strong>Action:</strong> Analyze and replicate trigger</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">The Valley Pattern 🔻</h3>
        <p className="mb-4"><strong>What it looks like:</strong> Sudden drop</p>
        <p className="mb-4"><strong>What it means:</strong> Process breakdown or issue</p>
        <p className="mb-4"><strong>Action:</strong> Investigate root cause</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Seasonal Review Trends</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Industry Patterns</h3>
        <p className="mb-4"><strong>Restaurants:</strong> Peaks in summer, December</p>
        <p className="mb-4"><strong>Retail:</strong> November-December surge</p>
        <p className="mb-4"><strong>Services:</strong> Spring and fall busy</p>
        <p className="mb-4"><strong>Tourism:</strong> Summer vacation peaks</p>
        <p className="mb-4"><strong>Tax/Financial:</strong> January-April rush</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">Planning Around Patterns</h3>
        <ul className="space-y-2 mb-6"><li>Prepare for busy seasons</li><li>Staff accordingly</li><li>Increase review requests during peaks</li><li>Build buffer during slow periods</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Review Velocity Insights</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Healthy Velocity Indicators</h3>
        <ul className="space-y-2 mb-6"><li><strong>Consistent flow:</strong> Reviews every week</li><li><strong>Rating stability:</strong> 4.0+ average maintained</li><li><strong>Recent activity:</strong> 30% of reviews in last 90 days</li><li><strong>Diverse sources:</strong> Not clustered on single days</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Warning Signs</h3>
        <ul className="space-y-2 mb-6"><li><strong>Gaps:</strong> No reviews for 2+ weeks</li><li><strong>Clustering:</strong> Many reviews same day</li><li><strong>Rating drops:</strong> Sudden quality issues</li><li><strong>Stagnation:</strong> Same total for months</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Monthly Targets by Business Size</h2>
        <p className="mb-4">| Business Size | Monthly Target | Warning Level |</p>
        <p className="mb-4">|--------------|----------------|---------------|</p>
        <p className="mb-4">| Solo/Small | 2-5 reviews | <1 review |</p>
        <p className="mb-4">| Medium | 5-15 reviews | <3 reviews |</p>
        <p className="mb-4">| Large | 15-30 reviews | <8 reviews |</p>
        <p className="mb-4">| Enterprise | 30+ reviews | <15 reviews |</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Using Patterns for Planning</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Quarterly Planning</h3>
        <p className="mb-4"><strong>Q1:</strong> Post-holiday recovery</p>
        <p className="mb-4"><strong>Q2:</strong> Build spring momentum</p>
        <p className="mb-4"><strong>Q3:</strong> Maximize summer traffic</p>
        <p className="mb-4"><strong>Q4:</strong> Holiday preparation</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">Monthly Actions</h3>
        <p className="mb-4"><strong>Week 1:</strong> Analyze previous month</p>
        <p className="mb-4"><strong>Week 2:</strong> Implement improvements</p>
        <p className="mb-4"><strong>Week 3:</strong> Mid-month push</p>
        <p className="mb-4"><strong>Week 4:</strong> End-of-month campaign</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">The 90-Day Rolling Average</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Why It Matters</h3>
        <ul className="space-y-2 mb-6"><li>Google weighs recent reviews heavily</li><li>Shows current performance</li><li>Smooths out anomalies</li><li>Better trend indicator</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Calculation</h3>
        <p className="mb-4">(Last 3 months reviews) ÷ 3 = Monthly average</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">Target Benchmarks</h3>
        <ul className="space-y-2 mb-6"><li><strong>Growing:</strong> +10% each month</li><li><strong>Stable:</strong> Maintain average</li><li><strong>Concerning:</strong> -20% decline</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Correlation Analysis</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Review Patterns Often Correlate With:</h3>
        <ul className="space-y-2 mb-6"><li><strong>Marketing campaigns</strong> timing</li><li><strong>Seasonal business</strong> cycles</li><li><strong>Staff changes</strong> or training</li><li><strong>Service quality</strong> variations</li><li><strong>Competition</strong> activity</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">What to Track Alongside</h3>
        <ul className="space-y-2 mb-6"><li>Sales data</li><li>Customer traffic</li><li>Marketing spend</li><li>Staff schedules</li><li>Quality metrics</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Creating Predictable Patterns</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">The Consistency Formula</h3>
        <ul className="space-y-2 mb-6"><li><strong>Automated requests</strong> after service</li><li><strong>Weekly manual</strong> outreach</li><li><strong>Monthly campaigns</strong> to past customers</li><li><strong>Quarterly pushes</strong> for volume</li><li><strong>Annual strategies</strong> for growth</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Expected Results</h3>
        <ul className="space-y-2 mb-6"><li>Month 1: Establish baseline</li><li>Month 2: +20% increase</li><li>Month 3: +35% cumulative</li><li>Month 6: Predictable pattern</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Responding to Pattern Changes</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">When Reviews Increase</h3>
        <ul className="space-y-2 mb-6"><li>Identify the cause</li><li>Document what worked</li><li>Scale successful tactics</li><li>Maintain quality standards</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">When Reviews Decrease</h3>
        <ul className="space-y-2 mb-6"><li>Check request systems</li><li>Audit customer satisfaction</li><li>Review staff training</li><li>Analyze competition</li><li>Refresh approach</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Advanced Pattern Analysis</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Statistical Significance</h3>
        <ul className="space-y-2 mb-6"><li>Need 12+ months for true patterns</li><li>Account for holidays/events</li><li>Consider market changes</li><li>Factor in competition</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Predictive Modeling</h3>
        <p className="mb-4">Based on patterns, predict:</p>
        <ul className="space-y-2 mb-6"><li>Future review volume</li><li>Seasonal adjustments needed</li><li>Resource requirements</li><li>Revenue correlation</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Quick Win Strategy</h2>
        <p className="mb-4"><strong>The Pattern Optimizer:</strong></p>
        <ul className="space-y-2 mb-6"><li>Export your last 12 months data</li><li>Identify your best month</li><li>List what was different</li><li>Replicate those conditions</li><li>Track for 30 days</li></ul>
        <p className="mb-4"><strong>Expected outcome:</strong> Return to peak performance</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Using Patterns for Competitive Intelligence</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">What Patterns Reveal</h3>
        <ul className="space-y-2 mb-6"><li>Market share changes</li><li>Customer preference shifts</li><li>Competitive advantages</li><li>Service gap opportunities</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Monitoring Competitors</h3>
        <ul className="space-y-2 mb-6"><li>Compare monthly volumes</li><li>Note pattern differences</li><li>Identify their weak months</li><li>Capitalize on gaps</li></ul>
        <p className="mb-4">---</p>
        <p className="mb-4"><em>Need help improving your review patterns? <a href="mailto:support@promptreviews.app" className="text-blue-600 hover:text-blue-700 underline">Schedule a consultation</a></em></p>
      </div>
    </DocsLayout>
  )
}