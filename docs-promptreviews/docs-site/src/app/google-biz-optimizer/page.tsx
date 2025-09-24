import type { Metadata } from 'next'
import Link from 'next/link'
import DocsLayout from '../docs-layout'
import PageHeader from '../components/PageHeader'
import {
  TrendingUp,
  Star,
  Search,
  MessageSquare,
  Image,
  Users,
  Phone,
  Globe,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Lightbulb
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Google Biz Optimizer™ - Comprehensive Guide | Prompt Reviews Help',
  description: 'Master Google Business Profile optimization with industry benchmarks, actionable strategies, and ROI-focused insights.',
  keywords: [
    'Google Business Profile optimization',
    'GBP metrics',
    'local SEO',
    'review management',
    'business visibility',
    'customer engagement'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com/google-biz-optimizer',
  },
}

export default function GoogleBizOptimizerPage() {
  return (
    <DocsLayout>
      {/* Hero Section */}
      <PageHeader
        breadcrumbs={[
          { label: 'Help', href: '/' }
        ]}
        currentPage="Google Biz Optimizer™"
        categoryLabel="Google Biz Optimizer™"
        categoryIcon={TrendingUp}
        categoryColor="purple"
        title="Google Biz Optimizer™"
        description="Master your Google Business Profile with data-driven strategies and industry insights"
      />

      {/* Introduction */}
      <div className="mb-12">
        <p className="text-lg text-gray-700 mb-6">
          The Google Biz Optimizer™ provides comprehensive insights, benchmarks, and actionable strategies
          to maximize your Google Business Profile performance. Each metric includes industry standards,
          psychological insights, and ROI calculations.
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Metrics Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <BarChart3 className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold">Key Metrics</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Understand the metrics that matter most for your Google Business Profile success.
          </p>
          <div className="space-y-3">
            <Link href="/google-biz-optimizer/metrics/total-reviews" className="flex items-center text-blue-600 hover:text-blue-700">
              <Star className="w-4 h-4 mr-2" />
              <span>Total Reviews Impact</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Link>
            <Link href="/google-biz-optimizer/metrics/average-rating" className="flex items-center text-blue-600 hover:text-blue-700">
              <Star className="w-4 h-4 mr-2" />
              <span>Average Rating Psychology</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Link>
            <Link href="/google-biz-optimizer/metrics/review-trends" className="flex items-center text-blue-600 hover:text-blue-700">
              <TrendingUp className="w-4 h-4 mr-2" />
              <span>Review Growth Trends</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Link>
            <Link href="/google-biz-optimizer/metrics/monthly-patterns" className="flex items-center text-blue-600 hover:text-blue-700">
              <BarChart3 className="w-4 h-4 mr-2" />
              <span>Monthly Review Patterns</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Link>
          </div>
        </div>

        {/* Optimization Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <Search className="w-6 h-6 text-green-600 mr-3" />
            <h2 className="text-xl font-semibold">Optimization Strategies</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Proven techniques to improve your visibility and ranking in local search results.
          </p>
          <div className="space-y-3">
            <Link href="/google-biz-optimizer/optimization/seo-score" className="flex items-center text-blue-600 hover:text-blue-700">
              <Search className="w-4 h-4 mr-2" />
              <span>SEO Score Factors</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Link>
            <Link href="/google-biz-optimizer/optimization/categories" className="flex items-center text-blue-600 hover:text-blue-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span>Business Categories</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Link>
            <Link href="/google-biz-optimizer/optimization/services" className="flex items-center text-blue-600 hover:text-blue-700">
              <Lightbulb className="w-4 h-4 mr-2" />
              <span>Services & Descriptions</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Link>
            <Link href="/google-biz-optimizer/optimization/photos" className="flex items-center text-blue-600 hover:text-blue-700">
              <Image className="w-4 h-4 mr-2" />
              <span>Photo Strategy</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Link>
            <Link href="/google-biz-optimizer/optimization/quick-wins" className="flex items-center text-blue-600 hover:text-blue-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span>Quick Wins</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Link>
          </div>
        </div>

        {/* Engagement Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <MessageSquare className="w-6 h-6 text-purple-600 mr-3" />
            <h2 className="text-xl font-semibold">Customer Engagement</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Build trust and loyalty through strategic customer interaction and response management.
          </p>
          <div className="space-y-3">
            <Link href="/google-biz-optimizer/engagement/review-responses" className="flex items-center text-blue-600 hover:text-blue-700">
              <MessageSquare className="w-4 h-4 mr-2" />
              <span>Review Response Templates</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Link>
            <Link href="/google-biz-optimizer/engagement/questions-answers" className="flex items-center text-blue-600 hover:text-blue-700">
              <Users className="w-4 h-4 mr-2" />
              <span>Q&A Management</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Link>
            <Link href="/google-biz-optimizer/engagement/posts" className="flex items-center text-blue-600 hover:text-blue-700">
              <Globe className="w-4 h-4 mr-2" />
              <span>Google Posts Strategy</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Link>
          </div>
        </div>

        {/* Performance Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <Phone className="w-6 h-6 text-orange-600 mr-3" />
            <h2 className="text-xl font-semibold">Performance & Conversion</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Track and optimize customer actions to maximize ROI from your Google Business Profile.
          </p>
          <div className="space-y-3">
            <Link href="/google-biz-optimizer/performance/customer-actions" className="flex items-center text-blue-600 hover:text-blue-700">
              <Phone className="w-4 h-4 mr-2" />
              <span>Customer Actions Analysis</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Link>
          </div>
        </div>
      </div>

      {/* Key Benefits */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-8 mb-12">
        <h2 className="text-2xl font-bold mb-6">Why Google Biz Optimizer™?</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Industry Benchmarks</h3>
              <p className="text-gray-600">Compare your performance against industry standards and competitors.</p>
            </div>
          </div>
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Actionable Strategies</h3>
              <p className="text-gray-600">Get specific, implementable tactics for immediate improvement.</p>
            </div>
          </div>
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">ROI Calculations</h3>
              <p className="text-gray-600">Understand the financial impact of each optimization effort.</p>
            </div>
          </div>
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Psychology Insights</h3>
              <p className="text-gray-600">Leverage consumer psychology for better engagement and conversions.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
        <ol className="space-y-4">
          <li className="flex items-start">
            <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold mr-3">1</span>
            <div>
              <h3 className="font-semibold mb-1">Review Your Current Metrics</h3>
              <p className="text-gray-600">Start by understanding where you stand with our metrics guides.</p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold mr-3">2</span>
            <div>
              <h3 className="font-semibold mb-1">Identify Quick Wins</h3>
              <p className="text-gray-600">Check our Quick Wins guide for immediate improvements.</p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold mr-3">3</span>
            <div>
              <h3 className="font-semibold mb-1">Implement Systematically</h3>
              <p className="text-gray-600">Follow our guides to optimize each aspect of your profile.</p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold mr-3">4</span>
            <div>
              <h3 className="font-semibold mb-1">Track Progress</h3>
              <p className="text-gray-600">Monitor improvements and adjust strategies based on results.</p>
            </div>
          </li>
        </ol>
      </div>
    </DocsLayout>
  )
}