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
  ArrowRight
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Total Reviews - Why They Matter | Google Biz Optimizer™',
  description: 'Learn why total review count is crucial for your Google Business Profile success, with industry benchmarks and actionable strategies.',
  keywords: [
    'Google reviews',
    'review count',
    'local SEO',
    'review benchmarks',
    'customer trust'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com/google-biz-optimizer/metrics/total-reviews',
  },
}

export default function TotalReviewsPage() {
  return (
    <DocsLayout>
      {/* Hero Section */}
      <PageHeader
        breadcrumbs={[
          { label: 'Help', href: '/' },
          { label: 'Google Biz Optimizer', href: '/google-biz-optimizer' }
        ]}
        currentPage="Total Reviews"
        categoryLabel="Metrics"
        categoryIcon={Star}
        categoryColor="blue"
        title="Total Reviews - Why They Matter"
        description="Understanding the impact of review volume on your business visibility and conversions"
      />

      {/* Overview Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">The Power of Review Volume</h2>
        <p className="text-lg text-gray-700 mb-6">
          Total review count is one of the most critical factors for Google Business Profile success.
          It directly impacts your local search ranking, customer trust, and conversion rates.
        </p>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
          <p className="text-gray-800">
            <strong>Key Insight:</strong> Businesses with 50+ reviews see 4x more conversions than those with fewer than 10 reviews.
          </p>
        </div>
      </div>

      {/* Industry Benchmarks */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Industry Benchmarks</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold mb-4">By Industry</h3>
            <ul className="space-y-3">
              <li className="flex justify-between">
                <span>Restaurants</span>
                <span className="font-semibold">150-200 reviews</span>
              </li>
              <li className="flex justify-between">
                <span>Healthcare</span>
                <span className="font-semibold">75-100 reviews</span>
              </li>
              <li className="flex justify-between">
                <span>Home Services</span>
                <span className="font-semibold">50-75 reviews</span>
              </li>
              <li className="flex justify-between">
                <span>Professional Services</span>
                <span className="font-semibold">25-50 reviews</span>
              </li>
              <li className="flex justify-between">
                <span>Retail</span>
                <span className="font-semibold">100-150 reviews</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold mb-4">Performance Tiers</h3>
            <ul className="space-y-3">
              <li className="flex items-center">
                <span className="w-20 text-red-600">Poor</span>
                <span>&lt; 10 reviews</span>
              </li>
              <li className="flex items-center">
                <span className="w-20 text-yellow-600">Fair</span>
                <span>10-25 reviews</span>
              </li>
              <li className="flex items-center">
                <span className="w-20 text-blue-600">Good</span>
                <span>25-50 reviews</span>
              </li>
              <li className="flex items-center">
                <span className="w-20 text-green-600">Excellent</span>
                <span>50-100 reviews</span>
              </li>
              <li className="flex items-center">
                <span className="w-20 text-purple-600">Outstanding</span>
                <span>100+ reviews</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Psychology of Numbers */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">The Psychology of Review Numbers</h2>
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
            <h3 className="font-semibold mb-3">Critical Thresholds</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-1" />
                <div>
                  <strong>7 Reviews:</strong> Minimum for basic credibility
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-1" />
                <div>
                  <strong>25 Reviews:</strong> Establishes social proof
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-1" />
                <div>
                  <strong>50 Reviews:</strong> Triggers "bandwagon effect"
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-1" />
                <div>
                  <strong>100+ Reviews:</strong> Achieves market authority
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold mb-3">Consumer Behavior Insights</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• 97% of consumers read reviews for local businesses</li>
              <li>• 85% trust online reviews as much as personal recommendations</li>
              <li>• Consumers read an average of 10 reviews before trusting a business</li>
              <li>• 73% only pay attention to reviews written in the last month</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ROI Impact */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <DollarSign className="w-8 h-8 mr-2 text-green-600" />
          ROI Impact
        </h2>
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="font-semibold mb-4">Revenue Correlation</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>0-10 reviews</span>
              <div className="flex items-center">
                <div className="w-32 h-4 bg-gray-200 rounded mr-3">
                  <div className="w-1/4 h-full bg-red-500 rounded"></div>
                </div>
                <span className="font-semibold">Baseline</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>11-25 reviews</span>
              <div className="flex items-center">
                <div className="w-32 h-4 bg-gray-200 rounded mr-3">
                  <div className="w-1/2 h-full bg-yellow-500 rounded"></div>
                </div>
                <span className="font-semibold">+31% revenue</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>26-50 reviews</span>
              <div className="flex items-center">
                <div className="w-32 h-4 bg-gray-200 rounded mr-3">
                  <div className="w-3/4 h-full bg-blue-500 rounded"></div>
                </div>
                <span className="font-semibold">+52% revenue</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>51+ reviews</span>
              <div className="flex items-center">
                <div className="w-32 h-4 bg-gray-200 rounded mr-3">
                  <div className="w-full h-full bg-green-500 rounded"></div>
                </div>
                <span className="font-semibold">+87% revenue</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Strategies */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Strategies to Increase Review Count</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold mb-4">Immediate Actions</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-2">1</span>
                <span>Send review requests within 24-48 hours of service</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-2">2</span>
                <span>Use QR codes at point of service</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-2">3</span>
                <span>Train staff to ask for reviews at checkout</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-2">4</span>
                <span>Add review links to email signatures</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold mb-4">Long-term Strategies</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                <span>Implement automated review request system</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                <span>Create customer loyalty program with review incentives</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                <span>Develop post-purchase email campaigns</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                <span>Build review generation into customer journey</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Common Mistakes */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Common Mistakes to Avoid</h2>
        <div className="bg-red-50 rounded-lg p-6">
          <ul className="space-y-3">
            <li className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
              <div>
                <strong>Buying fake reviews:</strong> Google detects and penalizes this, potentially removing your listing
              </div>
            </li>
            <li className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
              <div>
                <strong>Review gating:</strong> Filtering who can leave reviews violates Google's guidelines
              </div>
            </li>
            <li className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
              <div>
                <strong>Incentivizing reviews:</strong> Offering discounts or rewards for reviews is against policy
              </div>
            </li>
            <li className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
              <div>
                <strong>Review bombing:</strong> Getting too many reviews too quickly can trigger spam filters
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Your Next Steps</h2>
        <ol className="space-y-4">
          <li className="flex items-start">
            <span className="flex-shrink-0 w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center font-semibold mr-3">1</span>
            <div>
              <h3 className="font-semibold">Audit your current review count</h3>
              <p className="text-gray-600">Compare against industry benchmarks above</p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center font-semibold mr-3">2</span>
            <div>
              <h3 className="font-semibold">Set a realistic 90-day goal</h3>
              <p className="text-gray-600">Aim to increase reviews by 25-50%</p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center font-semibold mr-3">3</span>
            <div>
              <h3 className="font-semibold">Implement review request system</h3>
              <p className="text-gray-600">Start with automated email campaigns</p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center font-semibold mr-3">4</span>
            <div>
              <h3 className="font-semibold">Track and optimize</h3>
              <p className="text-gray-600">Monitor weekly progress and adjust tactics</p>
            </div>
          </li>
        </ol>
      </div>

      {/* Related Articles */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Related Articles</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/google-biz-optimizer/metrics/average-rating" className="flex items-center text-blue-600 hover:text-blue-700">
            <Star className="w-4 h-4 mr-2" />
            <span>Average Rating Impact</span>
          </Link>
          <Link href="/google-biz-optimizer/metrics/review-trends" className="flex items-center text-blue-600 hover:text-blue-700">
            <TrendingUp className="w-4 h-4 mr-2" />
            <span>Review Growth Trends</span>
          </Link>
          <Link href="/google-biz-optimizer/engagement/review-responses" className="flex items-center text-blue-600 hover:text-blue-700">
            <Users className="w-4 h-4 mr-2" />
            <span>Responding to Reviews</span>
          </Link>
        </div>
      </div>
    </DocsLayout>
  )
}