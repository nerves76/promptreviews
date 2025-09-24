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
  title: 'Customer Actions | Google Biz Optimizer™',
  description: 'Customer actions are the measurable steps people take after viewing your Google Business Profile. These are the conversions that directly impact your bottom line.',
  keywords: [
    'Google Business Profile',
    'Performance',
    'local SEO',
    'business optimization'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com/google-biz-optimizer/performance/customer-actions',
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
        currentPage="Customer Actions"
        categoryLabel="Performance"
        categoryIcon={Phone}
        categoryColor="orange"
        title="Customer Actions"
        description="Customer actions are the measurable steps people take after viewing your Google Business Profile. These are the conversions that directly impact your bottom line."
      />

      <div className="prose prose-gray max-w-none">
        <h2 className="text-2xl font-bold mb-4 mt-8">What Are Customer Actions?</h2>
        <p className="mb-4">Customer actions are the measurable steps people take after viewing your Google Business Profile. These are the conversions that directly impact your bottom line.</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">The Four Key Actions</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">1. Website Clicks</h3>
        <p className="mb-4"><strong>What it measures:</strong> Clicks on your website link</p>
        <p className="mb-4"><strong>Why it matters:</strong> Direct traffic to your site</p>
        <p className="mb-4"><strong>Average rate:</strong> 5-7% of profile views</p>
        <p className="mb-4"><strong>Goal:</strong> 10%+ click-through rate</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">2. Phone Calls</h3>
        <p className="mb-4"><strong>What it measures:</strong> "Call" button clicks</p>
        <p className="mb-4"><strong>Why it matters:</strong> High-intent customers</p>
        <p className="mb-4"><strong>Average rate:</strong> 3-5% of profile views</p>
        <p className="mb-4"><strong>Conversion rate:</strong> 30-40% to customers</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">3. Direction Requests</h3>
        <p className="mb-4"><strong>What it measures:</strong> "Get directions" clicks</p>
        <p className="mb-4"><strong>Why it matters:</strong> Physical visit intent</p>
        <p className="mb-4"><strong>Average rate:</strong> 4-6% of profile views</p>
        <p className="mb-4"><strong>Walk-in rate:</strong> 20-25% same day</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">4. Message Clicks</h3>
        <p className="mb-4"><strong>What it measures:</strong> Direct message initiation</p>
        <p className="mb-4"><strong>Why it matters:</strong> Customer engagement</p>
        <p className="mb-4"><strong>Response needed:</strong> Within 1 hour</p>
        <p className="mb-4"><strong>Conversion rate:</strong> 25% to sales</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Action Rates by Industry</h2>
        <p className="mb-4">| Industry | Website | Calls | Directions | Messages |</p>
        <p className="mb-4">|----------|---------|-------|------------|----------|</p>
        <p className="mb-4">| Restaurants | 8% | 12% | 15% | 3% |</p>
        <p className="mb-4">| Services | 12% | 18% | 8% | 5% |</p>
        <p className="mb-4">| Retail | 15% | 8% | 12% | 4% |</p>
        <p className="mb-4">| Healthcare | 20% | 25% | 10% | 7% |</p>
        <p className="mb-4">| Hotels | 25% | 10% | 5% | 8% |</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Optimizing Each Action Type</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Boosting Website Clicks</h3>
        <p className="mb-4"><strong>Quick Wins:</strong></p>
        <ul className="space-y-2 mb-6"><li>Update website link to specific landing page</li><li>Mention website exclusive offers</li><li>Add "View Menu/Catalog/Gallery" in posts</li><li>Use website CTAs in Q&A answers</li></ul>
        <p className="mb-4"><strong>Advanced Tactics:</strong></p>
        <ul className="space-y-2 mb-6"><li>Create GBP-specific landing pages</li><li>Track with UTM parameters</li><li>Offer online booking incentives</li><li>Feature web-only content</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Increasing Phone Calls</h3>
        <p className="mb-4"><strong>Quick Wins:</strong></p>
        <ul className="space-y-2 mb-6"><li>Display hours prominently</li><li>Add "Call us" in descriptions</li><li>Respond to calls quickly</li><li>Use call extensions</li></ul>
        <p className="mb-4"><strong>Advanced Tactics:</strong></p>
        <ul className="space-y-2 mb-6"><li>Call tracking numbers</li><li>Click-to-call ads coordination</li><li>Staff training for conversions</li><li>Appointment scheduling integration</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Driving Direction Requests</h3>
        <p className="mb-4"><strong>Quick Wins:</strong></p>
        <ul className="space-y-2 mb-6"><li>Accurate address/pin placement</li><li>Parking information in description</li><li>Landmark references</li><li>Public transit details</li></ul>
        <p className="mb-4"><strong>Advanced Tactics:</strong></p>
        <ul className="space-y-2 mb-6"><li>Virtual tour addition</li><li>Exterior photos from multiple angles</li><li>Accessibility information</li><li>Real-time traffic integration</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Maximizing Messages</h3>
        <p className="mb-4"><strong>Quick Wins:</strong></p>
        <ul className="space-y-2 mb-6"><li>Enable messaging feature</li><li>Set up auto-responses</li><li>Respond within 1 hour</li><li>Add FAQ suggestions</li></ul>
        <p className="mb-4"><strong>Advanced Tactics:</strong></p>
        <ul className="space-y-2 mb-6"><li>Chatbot integration</li><li>Lead qualification scripts</li><li>Appointment booking via message</li><li>CRM integration</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">The Customer Journey Analysis</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Path to Conversion</h3>
        <ul className="space-y-2 mb-6"><li><strong>Discovery</strong> → Profile view</li><li><strong>Interest</strong> → Photo/review browsing</li><li><strong>Consideration</strong> → Action taken</li><li><strong>Conversion</strong> → Purchase/booking</li><li><strong>Retention</strong> → Review/repeat</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Typical Drop-off Points</h3>
        <ul className="space-y-2 mb-6"><li>Poor photos: -40% actions</li><li>Low rating: -60% actions</li><li>Incomplete info: -35% actions</li><li>No response: -50% conversions</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Mobile vs Desktop Behavior</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Mobile Users (70% of traffic)</h3>
        <ul className="space-y-2 mb-6"><li><strong>Higher:</strong> Direction requests (+45%)</li><li><strong>Higher:</strong> Phone calls (+60%)</li><li><strong>Lower:</strong> Website clicks (-20%)</li><li><strong>Faster:</strong> Decision time (3 min avg)</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Desktop Users (30% of traffic)</h3>
        <ul className="space-y-2 mb-6"><li><strong>Higher:</strong> Website clicks (+40%)</li><li><strong>Higher:</strong> Research depth</li><li><strong>Lower:</strong> Immediate actions</li><li><strong>Longer:</strong> Decision time (8 min avg)</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Time-Based Action Patterns</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Peak Action Times</h3>
        <p className="mb-4"><strong>Calls:</strong> 10 AM - 2 PM weekdays</p>
        <p className="mb-4"><strong>Directions:</strong> 5-7 PM weekdays, 11 AM - 3 PM weekends</p>
        <p className="mb-4"><strong>Website:</strong> 8-10 PM all days</p>
        <p className="mb-4"><strong>Messages:</strong> 7-9 PM all days</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">Seasonal Variations</h3>
        <ul className="space-y-2 mb-6"><li>Q4: +35% all actions (holiday)</li><li>Summer: +25% directions</li><li>January: +40% website (research)</li><li>Monday: Highest call volume</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Conversion Optimization Strategies</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">The Action Funnel</h3>
        <p className="mb-4"><strong>Views → Actions → Conversions</strong></p>
        <ul className="space-y-2 mb-6"><li>1,000 views</li><li>80 actions (8% rate)</li><li>20 customers (25% conversion)</li><li>$2,000 revenue ($100 avg)</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Improving Each Stage</h3>
        <p className="mb-4"><strong>More Views:</strong></p>
        <ul className="space-y-2 mb-6"><li>Complete profile</li><li>Add photos</li><li>Get reviews</li><li>Post regularly</li></ul>
        <p className="mb-4"><strong>More Actions:</strong></p>
        <ul className="space-y-2 mb-6"><li>Clear CTAs</li><li>Compelling offers</li><li>Updated information</li><li>Response readiness</li></ul>
        <p className="mb-4"><strong>Better Conversions:</strong></p>
        <ul className="space-y-2 mb-6"><li>Quick response</li><li>Professional handling</li><li>Clear next steps</li><li>Follow-up system</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Action Attribution Challenges</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">What Google Doesn't Track</h3>
        <ul className="space-y-2 mb-6"><li>Actual store visits from directions</li><li>Call outcomes/sales</li><li>Website conversion after click</li><li>Message conversation results</li><li>Cross-device behavior</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Supplementary Tracking</h3>
        <ul className="space-y-2 mb-6"><li>Call tracking software</li><li>Landing page analytics</li><li>Conversion pixels</li><li>CRM integration</li><li>Survey feedback</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Competitive Action Analysis</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Benchmarking Success</h3>
        <p className="mb-4">Compare your action rates to:</p>
        <ul className="space-y-2 mb-6"><li>Industry averages</li><li>Local competitors</li><li>Previous periods</li><li>Seasonal norms</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Red Flags</h3>
        <ul className="space-y-2 mb-6"><li>Declining action rates</li><li>Below industry average</li><li>High views, low actions</li><li>Poor action diversity</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Quick Win Optimization</h2>
        <p className="mb-4"><strong>The Action Audit:</strong></p>
        <ul className="space-y-2 mb-6"><li>Check current action rates</li><li>Identify weakest metric</li><li>Implement 3 improvements</li><li>Monitor for 2 weeks</li><li>Adjust and repeat</li></ul>
        <p className="mb-4"><strong>Expected Results:</strong></p>
        <ul className="space-y-2 mb-6"><li>Week 1: +10% improvement</li><li>Week 2: +20% cumulative</li><li>Month 1: +35% total increase</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Advanced Action Analytics</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Multi-Touch Attribution</h3>
        <p className="mb-4">Customers typically:</p>
        <ul className="space-y-2 mb-6"><li>View profile 2.7 times</li><li>Take 1.8 different actions</li><li>Convert after 3.2 days</li><li>Research 4.5 competitors</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Lifetime Value Correlation</h3>
        <p className="mb-4"><strong>High-value customers:</strong></p>
        <ul className="space-y-2 mb-6"><li>Website + call combination</li><li>Multiple direction requests</li><li>Message before purchase</li><li>Leave reviews after</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Action-Based Marketing</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Retargeting Opportunities</h3>
        <ul className="space-y-2 mb-6"><li>Website visitors → Display ads</li><li>Callers → SMS campaigns</li><li>Direction requests → Geo-fencing</li><li>Messages → Email nurture</li></ul>
        <p className="mb-4">---</p>
        <p className="mb-4"><em>Want to improve your action rates? <a href="mailto:support@promptreviews.app" className="text-blue-600 hover:text-blue-700 underline">Get a free analysis</a></em></p>
      </div>
    </DocsLayout>
  )
}