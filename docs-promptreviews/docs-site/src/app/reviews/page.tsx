import type { Metadata } from 'next'
import StandardOverviewLayout from '../../components/StandardOverviewLayout'
import { pageFAQs } from '../utils/faqData'
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
  Download,
  Bell,
  Clock,
  Users,
  Target,
  Search
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
    canonical: 'https://docs.promptreviews.app/reviews',
  },
}

const keyFeatures = [
  {
    icon: BarChart3,
    title: 'Comprehensive Analytics',
    description: 'Track response rates, average ratings, review velocity, and platform distribution with detailed performance metrics.'
  },
  {
    icon: Bell,
    title: 'Real-Time Notifications',
    description: 'Get instant notifications when new reviews come in so you never miss an opportunity to respond promptly.'
  },
  {
    icon: MessageSquare,
    title: 'Direct Response Management',
    description: 'Respond to reviews directly from your dashboard for connected platforms like Google Business Profile.'
  },
  {
    icon: TrendingUp,
    title: 'Sentiment Analysis',
    description: 'Monitor customer sentiment trends and identify patterns to catch issues early and capitalize on successes.'
  },
  {
    icon: Filter,
    title: 'Advanced Filtering',
    description: 'Filter reviews by rating, date, platform, or keywords to quickly find and manage specific types of feedback.'
  },
  {
    icon: Download,
    title: 'Export & Reporting',
    description: 'Generate custom reports and export review data for deeper analysis or sharing with stakeholders.'
  }
];

const howItWorks = [
  {
    number: 1,
    title: 'Monitor All Reviews',
    description: 'Your dashboard automatically tracks reviews from all connected platforms and prompt page submissions in one central location.',
    icon: Eye
  },
  {
    number: 2,
    title: 'Get Instant Alerts',
    description: 'Receive notifications for new reviews, changes in review status, and when responses are needed to maintain your reputation.',
    icon: Bell
  },
  {
    number: 3,
    title: 'Respond & Engage',
    description: 'Reply to reviews directly from the dashboard, thank positive reviewers, and address concerns from negative feedback professionally.',
    icon: MessageSquare
  },
  {
    number: 4,
    title: 'Analyze & Improve',
    description: 'Use analytics and trends to identify what customers love and what needs improvement, then optimize your service accordingly.',
    icon: TrendingUp
  }
];

const bestPractices = [
  {
    icon: Clock,
    title: 'Respond Quickly',
    description: 'Aim to respond to reviews within 24-48 hours. Quick responses show you care and can turn negative experiences into positive ones.'
  },
  {
    icon: Users,
    title: 'Personalize Your Responses',
    description: 'Use the reviewer\'s name and reference specific details from their review. Avoid generic templates that feel robotic.'
  },
  {
    icon: Target,
    title: 'Address Issues Constructively',
    description: 'For negative reviews, acknowledge the issue, apologize if appropriate, and offer to resolve the problem offline.'
  },
  {
    icon: Search,
    title: 'Learn from Patterns',
    description: 'Look for recurring themes in feedback to identify systemic issues or consistently praised aspects of your service.'
  }
];

const overviewContent = (
  <>
    <p className="text-white/90 text-lg mb-6 text-center">
      The Review Management dashboard gives you complete visibility into your review pipeline—from initial request to published review.
      Track everything and take action to build a stronger online reputation.
    </p>

    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Track Everything</h3>
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

      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Take Action</h3>
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
  </>
);

export default function ReviewsPage() {
  return (
    <StandardOverviewLayout
      title="Track & manage all your reviews"
      description="Monitor review submissions, verify publication on platforms, respond to feedback, and gain insights from comprehensive analytics—all in one dashboard."
      categoryLabel="Review Management"
      categoryIcon={Star}
      categoryColor="yellow"
      currentPage="Review Management"
      availablePlans={['grower', 'builder', 'maven']}
      keyFeatures={keyFeatures}
      howItWorks={howItWorks}
      bestPractices={bestPractices}
      faqs={pageFAQs['reviews']}
      callToAction={{
        primary: {
          text: 'Google Business Integration',
          href: '/google-business'
        }
      }}
      overview={{
        title: 'Your Review Command Center',
        content: overviewContent
      }}
    />
  )
}