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
  title: 'Seo Score | Google Biz Optimizer™',
  description: 'Your Google Business Profile SEO Score is a comprehensive metric (0-100) that measures how well-optimized your profile is for local search visibility. It combines multiple ranking factors that Google uses to determine your position in search results.',
  keywords: [
    'Google Business Profile',
    'Optimization',
    'local SEO',
    'business optimization'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com/google-biz-optimizer/optimization/seo-score',
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
        currentPage="Seo Score"
        categoryLabel="Optimization"
        categoryIcon={Search}
        categoryColor="green"
        title="Seo Score"
        description="Your Google Business Profile SEO Score is a comprehensive metric (0-100) that measures how well-optimized your profile is for local search visibility. It combines multiple ranking factors that Google uses to determine your position in search results."
      />

      <div className="prose prose-gray max-w-none">
        <h2 className="text-2xl font-bold mb-4 mt-8">What is the SEO Score?</h2>
        <p className="mb-4">Your Google Business Profile SEO Score is a comprehensive metric (0-100) that measures how well-optimized your profile is for local search visibility. It combines multiple ranking factors that Google uses to determine your position in search results.</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Score Breakdown</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Score Ranges</h3>
        <ul className="space-y-2 mb-6"><li><strong>90-100:</strong> Excellent - Maximum visibility potential</li><li><strong>70-89:</strong> Good - Competitive positioning</li><li><strong>50-69:</strong> Average - Missing opportunities</li><li><strong>Below 50:</strong> Poor - Significant improvements needed</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Key Factors in Your Score</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">1. Profile Completeness (30%)</h3>
        <ul className="space-y-2 mb-6"><li>Business name, address, phone</li><li>Hours of operation</li><li>Website and booking links</li><li>Business description</li><li>Services and products</li><li>Attributes and amenities</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">2. Keyword Optimization (25%)</h3>
        <ul className="space-y-2 mb-6"><li>Primary category selection</li><li>Secondary categories</li><li>Service descriptions</li><li>Business description keywords</li><li>Post content relevance</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">3. Review Signals (20%)</h3>
        <ul className="space-y-2 mb-6"><li>Total review count</li><li>Average rating</li><li>Review velocity</li><li>Response rate</li><li>Keyword mentions in reviews</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">4. Engagement Metrics (15%)</h3>
        <ul className="space-y-2 mb-6"><li>Photo quantity and quality</li><li>Google Posts frequency</li><li>Q&A participation</li><li>Update frequency</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">5. Citation Consistency (10%)</h3>
        <ul className="space-y-2 mb-6"><li>NAP (Name, Address, Phone) accuracy</li><li>Website matching</li><li>Directory listings alignment</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">How to Improve Your Score</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Quick Wins (Can add 10-20 points)</h3>
        <ul className="space-y-2 mb-6"><li><strong>Complete all profile fields</strong> - Even optional ones matter</li><li><strong>Add 10+ photos</strong> - Cover all categories</li><li><strong>Write detailed service descriptions</strong> - 750+ characters each</li><li><strong>Select all relevant categories</strong> - Up to 10 allowed</li><li><strong>Add business attributes</strong> - WiFi, parking, accessibility</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Medium-term Improvements (Add 15-30 points)</h3>
        <ul className="space-y-2 mb-6"><li><strong>Build review volume</strong> - Aim for 50+ reviews</li><li><strong>Maintain 4.0+ rating</strong> - Quality service focus</li><li><strong>Post weekly updates</strong> - Events, offers, news</li><li><strong>Respond to all reviews</strong> - Within 48 hours</li><li><strong>Answer customer questions</strong> - Be the expert</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Advanced Optimization (Final 10-15 points)</h3>
        <ul className="space-y-2 mb-6"><li><strong>Local keyword research</strong> - Optimize for search terms</li><li><strong>Competitor analysis</strong> - Identify gaps</li><li><strong>Citation building</strong> - 50+ directory listings</li><li><strong>Schema markup</strong> - On your website</li><li><strong>Link building</strong> - Local partnerships</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Industry-Specific Tips</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Restaurants</h3>
        <ul className="space-y-2 mb-6"><li>Menu photos and links critical</li><li>Dietary attributes (vegan, gluten-free)</li><li>Reservation systems integration</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Professional Services</h3>
        <ul className="space-y-2 mb-6"><li>Certifications and credentials</li><li>Service area settings</li><li>Appointment booking links</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Retail</h3>
        <ul className="space-y-2 mb-6"><li>Product catalogs</li><li>Shopping attributes</li><li>In-store availability</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Common Mistakes That Hurt Score</h2>
        <ul className="space-y-2 mb-6"><li><strong>Keyword stuffing</strong> - Unnatural repetition</li><li><strong>Category misuse</strong> - Selecting irrelevant categories</li><li><strong>Fake reviews</strong> - Google penalizes heavily</li><li><strong>Inconsistent information</strong> - Different hours/phone across web</li><li><strong>Neglecting updates</strong> - Stale information signals</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">The Algorithm Behind the Score</h2>
        <p className="mb-4">Google Biz Optimizer uses 50+ data points including:</p>
        <ul className="space-y-2 mb-6"><li>Direct Google API data</li><li>Competitor benchmarking</li><li>Industry standards</li><li>Search trend analysis</li><li>User behavior patterns</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">What a High Score Means</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">85+ Score Benefits:</h3>
        <ul className="space-y-2 mb-6"><li><strong>3x more discovery searches</strong> - "near me" queries</li><li><strong>2x higher click-through rate</strong> - From search results</li><li><strong>45% more direction requests</strong> - Physical visits</li><li><strong>Top 3 local pack</strong> - Premium placement</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Monitoring Your Progress</h2>
        <ul className="space-y-2 mb-6"><li>Check score weekly</li><li>Track competitor changes</li><li>Note algorithm updates</li><li>Measure conversion impact</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Quick Win Strategy</h2>
        <p className="mb-4"><strong>The 80/20 Rule:</strong> Focus on these for maximum impact:</p>
        <ul className="space-y-2 mb-6"><li>Complete profile (20% effort, 40% impact)</li><li>Get to 50 reviews (30% effort, 30% impact)</li><li>Add 20 photos (10% effort, 15% impact)</li><li>Post weekly (20% effort, 15% impact)</li></ul>
        <p className="mb-4">---</p>
        <p className="mb-4"><em>Want a detailed SEO audit? <a href="mailto:support@promptreviews.app" className="text-blue-600 hover:text-blue-700 underline">Get your free report</a></em></p>
      </div>
    </DocsLayout>
  )
}