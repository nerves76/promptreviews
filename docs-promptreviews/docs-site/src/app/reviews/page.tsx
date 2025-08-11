import type { Metadata } from 'next'
import Link from 'next/link'
import DocsLayout from '../docs-layout'
import PageHeader from '../components/PageHeader'
import { 
  Star, 
  BarChart3, 
  CheckCircle,
  AlertCircle,
  MessageSquare,
  TrendingUp,
  Shield,
  Eye,
  ArrowRight,
  Filter,
  Download
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Review Management - Track, Verify & Respond | Prompt Reviews Help',
  description: 'Learn how to manage customer reviews in Prompt Reviews. Track submissions, verify publication, respond to feedback, and analyze review performance.',
  keywords: [
    'review management',
    'review tracking',
    'review verification',
    'review responses',
    'review analytics',
    'feedback management'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com/reviews',
  },
}

export default function ReviewsPage() {
  return (
    <DocsLayout>
      {/* Hero Section */}
      <PageHeader
        breadcrumbs={[
          { label: 'Help', href: '/' }
        ]}
        currentPage="Review Management"
        categoryLabel="Review Management"
        categoryIcon={Star}
        categoryColor="yellow"
        title="Track & manage all your reviews"
        description="Monitor review submissions, verify publication on platforms, respond to feedback, and gain insights from comprehensive analytics—all in one dashboard."
      />

      {/* Review Dashboard Overview */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">Your Review Command Center</h2>
        
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 mb-8">
          <p className="text-white/90 text-lg mb-6">
            The Review Management dashboard gives you complete visibility into your review pipeline—from initial request to published review.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Track Everything</h3>
              <ul className="space-y-2 text-white/80">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
                  <span>Review requests sent</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
                  <span>Responses received</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
                  <span>Reviews published</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
                  <span>Platform distribution</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Take Action</h3>
              <ul className="space-y-2 text-white/80">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
                  <span>Respond to reviews</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
                  <span>Flag inappropriate content</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
                  <span>Export review data</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
                  <span>Share success stories</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Review States */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">Understanding Review States</h2>
        
        <div className="space-y-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <h3 className="text-lg font-semibold text-white">Pending</h3>
            </div>
            <p className="text-white/80">
              Review request sent but customer hasn't responded yet. Follow-up reminders may be scheduled.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <h3 className="text-lg font-semibold text-white">Submitted</h3>
            </div>
            <p className="text-white/80">
              Customer submitted a review through Prompt Reviews. Waiting for publication on review platform.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <h3 className="text-lg font-semibold text-white">Published</h3>
            </div>
            <p className="text-white/80">
              Review is live on the platform (Google, Yelp, etc.). Verified and ready to showcase.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
              <h3 className="text-lg font-semibold text-white">Feedback</h3>
            </div>
            <p className="text-white/80">
              Private feedback received instead of public review. Valuable for internal improvements.
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">Review Analytics & Insights</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <BarChart3 className="w-8 h-8 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Performance Metrics</h3>
            <p className="text-white/80">
              Track response rates, average ratings, review velocity, and platform distribution over time.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <TrendingUp className="w-8 h-8 text-green-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Trend Analysis</h3>
            <p className="text-white/80">
              Identify patterns in customer feedback. See what's improving and what needs attention.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <MessageSquare className="w-8 h-8 text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Sentiment Tracking</h3>
            <p className="text-white/80">
              Monitor overall customer sentiment. Catch issues early with negative feedback alerts.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <Download className="w-8 h-8 text-yellow-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Export & Reports</h3>
            <p className="text-white/80">
              Generate custom reports. Export data for deeper analysis or share with stakeholders.
            </p>
          </div>
        </div>
      </div>

      {/* Responding to Reviews */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">Responding to Reviews</h2>
        
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Positive Reviews</h3>
              <ul className="space-y-3 text-white/90">
                <li className="flex items-start space-x-2">
                  <Star className="w-5 h-5 text-yellow-300 mt-0.5 flex-shrink-0" />
                  <span>Thank the customer personally</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Star className="w-5 h-5 text-yellow-300 mt-0.5 flex-shrink-0" />
                  <span>Highlight specific details they mentioned</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Star className="w-5 h-5 text-yellow-300 mt-0.5 flex-shrink-0" />
                  <span>Invite them to return</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Negative Feedback</h3>
              <ul className="space-y-3 text-white/90">
                <li className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-orange-300 mt-0.5 flex-shrink-0" />
                  <span>Respond quickly and professionally</span>
                </li>
                <li className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-orange-300 mt-0.5 flex-shrink-0" />
                  <span>Take the conversation offline</span>
                </li>
                <li className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-orange-300 mt-0.5 flex-shrink-0" />
                  <span>Show you care about improvement</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-4">
            <p className="text-white/90 text-sm">
              <strong className="text-yellow-300">Pro Tip:</strong> Use response templates for consistency, but always personalize them. Customers can tell when responses are generic.
            </p>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">Review Management Best Practices</h2>
        
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-6 h-6 text-green-300 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium mb-1">Verify Authenticity</p>
                <p className="text-white/70 text-sm">Always ensure reviews are from real customers with genuine experiences</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Eye className="w-6 h-6 text-blue-300 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium mb-1">Monitor Daily</p>
                <p className="text-white/70 text-sm">Check for new reviews regularly to respond promptly</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Filter className="w-6 h-6 text-purple-300 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium mb-1">Learn from Feedback</p>
                <p className="text-white/70 text-sm">Use negative feedback as opportunities to improve your service</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <TrendingUp className="w-6 h-6 text-yellow-300 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium mb-1">Track Trends</p>
                <p className="text-white/70 text-sm">Watch for patterns in feedback to identify systemic issues or successes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Master Your Reviews?</h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Start tracking and managing your reviews effectively to build a stronger online reputation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/google-business"
              className="inline-flex items-center space-x-2 bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 border border-white/30 transition-colors font-medium backdrop-blur-sm"
            >
              <span>Google Business Integration</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            
            <a
              href="https://promptreviews.com/dashboard/reviews"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <span>View Your Reviews</span>
              <BarChart3 className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </DocsLayout>
  )
}