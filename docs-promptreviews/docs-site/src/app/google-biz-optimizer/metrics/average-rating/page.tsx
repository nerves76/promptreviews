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
  title: 'Average Rating | Google Biz Optimizer™',
  description: 'Your average rating is the mean of all star ratings (1-5 stars) from customer reviews on your Google Business Profile. It\'s displayed prominently next to your business name in search results.',
  keywords: [
    'Google Business Profile',
    'Metrics',
    'local SEO',
    'business optimization'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com/google-biz-optimizer/metrics/average-rating',
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
        currentPage="Average Rating"
        categoryLabel="Metrics"
        categoryIcon={BarChart3}
        categoryColor="blue"
        title="Average Rating"
        description="Your average rating is the mean of all star ratings (1-5 stars) from customer reviews on your Google Business Profile. It's displayed prominently next to your business name in search results."
      />

      <div className="prose prose-gray max-w-none">
        <h2 className="text-2xl font-bold mb-4 mt-8">What is Average Rating?</h2>
        <p className="mb-4">Your average rating is the mean of all star ratings (1-5 stars) from customer reviews on your Google Business Profile. It's displayed prominently next to your business name in search results.</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">The Psychology of Star Ratings</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Customer Decision Points</h3>
        <ul className="space-y-2 mb-6"><li><strong>4.5+ stars:</strong> Premium perception, customers expect excellence</li><li><strong>4.0-4.4 stars:</strong> Sweet spot - trustworthy and approachable</li><li><strong>3.5-3.9 stars:</strong> Customers hesitate, read reviews carefully</li><li><strong>Below 3.5:</strong> 68% of customers won't consider your business</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">The Trust Factor</h3>
        <ul className="space-y-2 mb-6"><li>Ratings between <strong>4.2-4.5</strong> are seen as most authentic</li><li>Perfect 5.0 with many reviews can seem suspicious</li><li>Mix of 4 and 5-star reviews appears most genuine</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Impact on Business</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">Conversion Rates</h3>
        <ul className="space-y-2 mb-6"><li>Moving from 3.5 to 4.0 stars: <strong>+23% in conversions</strong></li><li>Moving from 4.0 to 4.5 stars: <strong>+17% in conversions</strong></li><li>Each half-star increase: <strong>5-9% revenue increase</strong></li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">Search Visibility</h3>
        <ul className="space-y-2 mb-6"><li>Google shows star ratings in search results</li><li>Higher ratings get more prominent placement</li><li>Ratings affect click-through rates by up to 35%</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">How to Improve Your Rating</h2>
        <h3 className="text-xl font-semibold mb-3 mt-6">1. Focus on Service Excellence</h3>
        <ul className="space-y-2 mb-6"><li>Address common complaint themes</li><li>Train staff on customer service</li><li>Set clear expectations upfront</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">2. Strategic Review Requests</h3>
        <ul className="space-y-2 mb-6"><li>Ask happiest customers first</li><li>Time requests after positive experiences</li><li>Don't ask when issues occurred</li></ul>
        <h3 className="text-xl font-semibold mb-3 mt-6">3. Manage Negative Reviews</h3>
        <ul className="space-y-2 mb-6"><li>Respond professionally within 24 hours</li><li>Offer solutions publicly</li><li>Move detailed discussions offline</li><li>Show you care about feedback</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">The Math Behind Ratings</h2>
        <p className="mb-4">To reach a 4.5 average, you need:</p>
        <ul className="space-y-2 mb-6"><li>For every 1-star: Four 5-star reviews</li><li>For every 2-star: Two 5-star reviews</li><li>For every 3-star: One 5-star review</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">What Google Biz Optimizer Tracks</h2>
        <ul className="space-y-2 mb-6"><li>Current average rating with trend analysis</li><li>Rating distribution breakdown</li><li>Competitor rating comparisons</li><li>Projected rating based on recent reviews</li><li>Alerts for rating drops</li></ul>
        <h2 className="text-2xl font-bold mb-4 mt-8">Industry Benchmarks</h2>
        <p className="mb-4">| Industry | Minimum | Target | Excellent |</p>
        <p className="mb-4">|----------|---------|--------|-----------|</p>
        <p className="mb-4">| Restaurants | 3.8 | 4.2 | 4.5+ |</p>
        <p className="mb-4">| Healthcare | 4.0 | 4.3 | 4.6+ |</p>
        <p className="mb-4">| Home Services | 3.9 | 4.3 | 4.6+ |</p>
        <p className="mb-4">| Retail | 3.7 | 4.1 | 4.4+ |</p>
        <p className="mb-4">| Hotels | 3.9 | 4.2 | 4.5+ |</p>
        <h2 className="text-2xl font-bold mb-4 mt-8">Quick Win</h2>
        <p className="mb-4"><strong>Rating Recovery Strategy:</strong> If your rating is below 4.0, implement a "satisfaction guarantee" and prominently display it. This reduces negative reviews and shows confidence in your service.</p>
        <p className="mb-4">---</p>
        <p className="mb-4"><em>Need help improving your rating? <a href="mailto:support@promptreviews.app" className="text-blue-600 hover:text-blue-700 underline">Get a consultation</a></em></p>
      </div>
    </DocsLayout>
  )
}