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
  title: 'Services | Google Biz Optimizer™',
  description: 'Services are your opportunity to tell Google and customers exactly what you offer. They appear prominently in your profile and significantly impact search visibility.',
  keywords: [
    'Google Business Profile',
    'Optimization',
    'local SEO',
    'business optimization'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com/google-biz-optimizer/optimization/services',
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
        currentPage="Services"
        categoryLabel="Optimization"
        categoryIcon={Search}
        categoryColor="green"
        title="Services"
        description="Services are your opportunity to tell Google and customers exactly what you offer. They appear prominently in your profile and significantly impact search visibility."
      />

      <div className="prose prose-gray max-w-none">
        <h2 className="text-2xl font-bold mb-4 mt-8">Why Services Matter</h2>
        <p className="mb-4">Services are your opportunity to tell Google and customers exactly what you offer. They appear prominently in your profile and significantly impact search visibility.</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">The Service Section Advantage</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Visibility Benefits</h3>
        <ul className="space-y-2 mb-6"><li><strong>Dedicated profile section</strong> with images</li><li><strong>Rich snippets</strong> in search results</li><li><strong>Service-specific searches</strong> +55% more matches</li><li><strong>Comparison shopping</strong> features</li><li><strong>Direct booking</strong> integration potential</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Writing Powerful Service Descriptions</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">The Formula</h3>
        <p className="mb-4">Each service needs:</p>
        <ul className="space-y-2 mb-6"><li><strong>Clear title</strong> (2-5 words)</li><li><strong>Compelling description</strong> (300-750 characters)</li><li><strong>Price information</strong> (if applicable)</li><li><strong>Service image</strong> (highly recommended)</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Description Best Practices</h3>
        <p className="mb-4"><strong>Structure:</strong></p>
        <ul className="space-y-2 mb-6"><li>Line 1: What the service is</li><li>Line 2-3: Key benefits/features</li><li>Line 4: Call to action or unique value</li></ul>
        <p className="mb-4"><strong>Example:</strong></p>
        <p className="mb-4">"Professional Carpet Cleaning</p>
        <p className="mb-4">Deep-clean extraction removes 99% of allergens and bacteria. Pet-safe, eco-friendly products. Same-day service available. 100% satisfaction guaranteed or it's free."</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">SEO Optimization for Services</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Keyword Placement</h3>
        <ul className="space-y-2 mb-6"><li><strong>Title:</strong> Primary keyword only</li><li><strong>First sentence:</strong> Primary + location</li><li><strong>Body:</strong> Related keywords naturally</li><li><strong>Last sentence:</strong> Call to action keyword</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">What Google Rewards</h3>
        <ul className="space-y-2 mb-6"><li>Detailed descriptions (500+ characters)</li><li>Unique content (not copied)</li><li>Regular updates</li><li>Complete information</li><li>Customer-focused language</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Service Categories That Convert</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">High-Intent Services</h3>
        <p className="mb-4">These get 3x more clicks:</p>
        <ul className="space-y-2 mb-6"><li>Emergency/Urgent services</li><li>Specific problem solvers</li><li>Price-transparent options</li><li>Time-specific services</li><li>Guarantee-backed offerings</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Industry Service Templates</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Home Services</h3>
        <p className="mb-4"><strong>Title:</strong> Emergency Plumbing Repair</p>
        <p className="mb-4"><strong>Description:</strong> "24/7 emergency plumbing service. Licensed plumbers arrive within 60 minutes. We fix burst pipes, water heaters, clogged drains, and flooding issues. Upfront pricing with no hidden fees. Call now - we answer live."</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">Healthcare</h3>
        <p className="mb-4"><strong>Title:</strong> Annual Wellness Exam</p>
        <p className="mb-4"><strong>Description:</strong> "Comprehensive preventive health screening including blood work, vitals, and physician consultation. Most insurance accepted. Same-week appointments. Includes personalized health plan and follow-up care coordination."</p>
        <h3 className="text-xl font-semibold mb-3 mt-6">Professional Services</h3>
        <p className="mb-4"><strong>Title:</strong> Small Business Tax Preparation</p>
        <p className="mb-4"><strong>Description:</strong> "Expert tax preparation for LLCs, S-Corps, and sole proprietors. Maximize deductions, ensure compliance, and plan for next year. Average refund increase of $3,200. Free audit protection included."</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Service Presentation Tips</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Organization Strategy</h3>
        <ul className="space-y-2 mb-6"><li><strong>Most popular first</strong> - Higher engagement</li><li><strong>Group related services</strong> - Easier browsing</li><li><strong>Seasonal at right time</strong> - Timely visibility</li><li><strong>Price anchor</strong> - Show value range</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Visual Enhancement</h3>
        <ul className="space-y-2 mb-6"><li>Add service photos (2x more clicks)</li><li>Use icons in descriptions (⭐✓➜)</li><li>Include certifications/badges</li><li>Show before/after when relevant</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Common Service Mistakes</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">What Not to Do</h3>
        <p className="mb-4">❌ Vague titles ("General Service")</p>
        <p className="mb-4">❌ Keyword stuffing descriptions</p>
        <p className="mb-4">❌ All services in one listing</p>
        <p className="mb-4">❌ No prices when competitors show them</p>
        <p className="mb-4">❌ Outdated seasonal services</p>
        <p className="mb-4">❌ Generic manufacturer descriptions</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">The Psychology of Service Selection</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Customer Decision Factors</h3>
        <ul className="space-y-2 mb-6"><li><strong>Specificity</strong> - Exact match to need</li><li><strong>Trust signals</strong> - Guarantees, certifications</li><li><strong>Urgency</strong> - Availability, speed</li><li><strong>Value</strong> - Clear pricing/benefits</li><li><strong>Proof</strong> - Reviews mentioning service</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Optimizing Service Performance</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">A/B Testing Elements</h3>
        <ul className="space-y-2 mb-6"><li>Title variations</li><li>Description length</li><li>Price display format</li><li>Image types</li><li>Call-to-action phrases</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Metrics to Track</h3>
        <ul className="space-y-2 mb-6"><li>Service page views</li><li>Click-to-call from services</li><li>Service-specific reviews</li><li>Booking conversions</li><li>Search impressions</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Service Pricing Strategy</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Display Options</h3>
        <ul className="space-y-2 mb-6"><li><strong>Exact pricing:</strong> "$99"</li><li><strong>Range pricing:</strong> "$99-$199"</li><li><strong>Starting price:</strong> "From $99"</li><li><strong>Contact for quote:</strong> "Call for pricing"</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">When to Show Prices</h3>
        <p className="mb-4"><strong>Always show if:</strong></p>
        <ul className="space-y-2 mb-6"><li>Prices are competitive</li><li>Service is standardized</li><li>Customers expect transparency</li></ul>
        <p className="mb-4"><strong>Hide if:</strong></p>
        <ul className="space-y-2 mb-6"><li>Highly customized service</li><li>Premium positioning</li><li>Complex variables</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Quick Win Strategy</h2>
        <p className="mb-4"><strong>The Service Expansion Method:</strong></p>
        <ul className="space-y-2 mb-6"><li>List your top 5 services today</li><li>Add 2-3 related services weekly</li><li>Aim for 15-20 total services</li><li>Update descriptions quarterly</li><li>Add seasonal services on schedule</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Advanced Service Optimization</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Local Service Ads Integration</h3>
        <ul className="space-y-2 mb-6"><li>Matching service names</li><li>Consistent pricing</li><li>Verified licenses</li><li>Background checks noted</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Schema Markup Connection</h3>
        <ul className="space-y-2 mb-6"><li>Service schema on website</li><li>Matching Google services</li><li>Price markup alignment</li><li>Review attribution</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Service Success Metrics</h2>
        <p className="mb-4"><strong>Top Performing Services Have:</strong></p>
        <ul className="space-y-2 mb-6"><li>500+ character descriptions</li><li>Clear pricing information</li><li>Professional images</li><li>10+ reviews mentioning them</li><li>Updated within 90 days</li></ul>
        <p className="mb-4">---</p>
        <p className="mb-4"><em>Want help optimizing your services? <a href="mailto:support@promptreviews.app" className="text-blue-600 hover:text-blue-700 underline">Schedule a consultation</a></em></p>
      </div>
    </DocsLayout>
  )
}