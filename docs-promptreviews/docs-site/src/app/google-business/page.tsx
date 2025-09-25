import type { Metadata } from 'next'
import Link from 'next/link'
import DocsLayout from '../docs-layout'
import PageHeader from '../components/PageHeader'
import StandardOverviewLayout from '../components/StandardOverviewLayout'
import { pageFAQs } from '../utils/faqData'
import {
  Building2,
  Link2,
  MapPin,
  Star,
  MessageSquare,
  Upload,
  Clock,
  Shield,
  CheckCircle,
  ArrowRight,
  Users
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Google Business Profile Integration - Connect & Manage | Prompt Reviews Help',
  description: 'Learn how to connect your Google Business Profile with Prompt Reviews. Manage reviews, posts, and multiple locations from one dashboard.',
  keywords: [
    'Google Business Profile',
    'GBP integration',
    'Google reviews',
    'business listing',
    'local SEO',
    'review management'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com/google-business',
  },
}

export default function GoogleBusinessPage() {
  // Key features data
  const keyFeatures = [
    {
      icon: Star,
      title: 'Review Management',
      description: 'View and respond to Google reviews directly from Prompt Reviews. Track review trends and maintain your reputation with quick response capabilities.',
    },
    {
      icon: MessageSquare,
      title: 'Posts & Updates',
      description: 'Create and schedule Google Business Profile posts about updates, offers, and events. Keep your profile active and engaging.',
    },
    {
      icon: MapPin,
      title: 'Multiple Locations',
      description: 'Manage multiple business profiles from one dashboard. Perfect for franchises and multi-location businesses with centralized control.',
    },
    {
      icon: Upload,
      title: 'Review Import',
      description: 'Import existing Google reviews to feature on your website, launch double-dip campaigns, or track customer engagement.',
      link: '/double-dip-strategy'
    }
  ];

  // Key points for the overview
  const keyPoints = [
    {
      title: 'Enhanced Local SEO',
      description: 'Quick review responses improve your local search ranking and visibility'
    },
    {
      title: 'Centralized Management',
      description: 'Handle all your Google Business activities from one unified dashboard'
    },
    {
      title: 'Multi-Location Support',
      description: 'Perfect for businesses with multiple locations or franchises'
    },
    {
      title: 'Secure OAuth Integration',
      description: 'Industry-standard encryption with revocable access permissions'
    }
  ];

  // How it works steps
  const howItWorks = (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">1</div>
          <h3 className="text-xl font-semibold text-white">Sign In with Google</h3>
        </div>
        <p className="text-white/90 mb-4">
          Click "Connect Google Business" and sign in with the Google account that manages your business profile.
        </p>
        <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
          <p className="text-white/80 text-sm">
            <strong>Note:</strong> You must be an owner or manager of the Google Business Profile to connect it.
          </p>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold">2</div>
          <h3 className="text-xl font-semibold text-white">Grant Permissions</h3>
        </div>
        <p className="text-white/90 mb-4">
          Authorize Prompt Reviews to access your business information, reviews, and posting capabilities.
        </p>
        <ul className="space-y-2 text-white/80 text-sm">
          <li className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
            <span>Read business information</span>
          </li>
          <li className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
            <span>Manage reviews and responses</span>
          </li>
          <li className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
            <span>Create and manage posts</span>
          </li>
        </ul>
      </div>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold">3</div>
          <h3 className="text-xl font-semibold text-white">Select Your Business</h3>
        </div>
        <p className="text-white/90">
          Choose which business location(s) to connect. You can add more locations later if needed.
        </p>
      </div>
    </div>
  );

  // Best practices section
  const bestPractices = (
    <div className="space-y-6">
      {/* Review Management Best Practices */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
        <h3 className="text-2xl font-bold text-white mb-6">Review Management</h3>

        {/* Google Visibility Alert */}
        <div className="bg-blue-400/20 border border-blue-300/30 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Clock className="w-6 h-6 text-blue-300 mt-0.5" />
            <div>
              <p className="text-white font-semibold">
                💡 Google rewards businesses that respond quickly with increased visibility.
              </p>
              <p className="text-white/90 text-sm mt-1">
                We recommend replying within 24 hours for maximum impact on your local search ranking.
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Response Best Practices</h4>
            <ul className="space-y-2 text-white/80 text-sm">
              <li>• Respond within 24 hours</li>
              <li>• Thank customers for positive reviews</li>
              <li>• Address concerns professionally</li>
              <li>• Keep responses personalized</li>
              <li>• Include your business name naturally</li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-3">What to Avoid</h4>
            <ul className="space-y-2 text-white/80 text-sm">
              <li>• Generic copy-paste responses</li>
              <li>• Arguing with customers</li>
              <li>• Sharing private information</li>
              <li>• Ignoring negative reviews</li>
              <li>• Delayed responses (over 48 hours)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Google Posts Best Practices */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
        <h3 className="text-2xl font-bold text-white mb-6">Creating Google Posts</h3>

        <p className="text-white/90 mb-6">
          Keep your Google Business Profile active with regular posts about updates, offers, and events.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Post Types</h4>
            <ul className="space-y-2 text-white/80 text-sm">
              <li>• What's New updates</li>
              <li>• Special offers and promotions</li>
              <li>• Upcoming events</li>
              <li>• Product highlights</li>
              <li>• COVID-19 updates</li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Best Practices</h4>
            <ul className="space-y-2 text-white/80 text-sm">
              <li>• Post at least once per week</li>
              <li>• Include high-quality images</li>
              <li>• Add clear calls-to-action</li>
              <li>• Keep text concise (under 1,500 characters)</li>
              <li>• Schedule posts in advance</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 bg-blue-400/10 border border-blue-400/20 rounded-lg p-4">
          <p className="text-white/90 text-sm">
            <strong className="text-blue-300">Tip:</strong> Google Posts appear for 7 days (events last until the event date). Plan your posting schedule accordingly.
          </p>
        </div>
      </div>
    </div>
  );

  // Custom sections for multiple locations and security
  const customSections = (
    <div className="max-w-4xl mx-auto">
      {/* Multiple Locations */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-8">Managing Multiple Locations</h2>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
          <p className="text-white/90 mb-6">
            Perfect for businesses with multiple locations, franchises, or service areas.
          </p>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Users className="w-6 h-6 text-blue-300 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium mb-1">Centralized Management</p>
                <p className="text-white/70 text-sm">View and manage all locations from one dashboard</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPin className="w-6 h-6 text-green-300 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium mb-1">Location-Specific Pages</p>
                <p className="text-white/70 text-sm">Create unique prompt pages for each location</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Star className="w-6 h-6 text-yellow-300 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium mb-1">Individual Analytics</p>
                <p className="text-white/70 text-sm">Track performance metrics for each location separately</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Shield className="w-6 h-6 text-purple-300 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium mb-1">Team Access Control</p>
                <p className="text-white/70 text-sm">Assign team members to specific locations</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Privacy */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-8">Security & Privacy</h2>

        <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
          <div className="flex items-start space-x-3 mb-6">
            <Shield className="w-8 h-8 text-green-300 flex-shrink-0" />
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Your Data is Secure</h3>
              <p className="text-white/80">
                We use OAuth 2.0 for secure authentication. We never store your Google password, and you can revoke access at any time.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-white/90">
            <p className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
              <span>Industry-standard encryption for all data transfers</span>
            </p>
            <p className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
              <span>Limited scope - we only access what's necessary</span>
            </p>
            <p className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
              <span>Regular security audits and compliance checks</span>
            </p>
            <p className="flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
              <span>Full GDPR and privacy law compliance</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' }
          ]}
          currentPage="Google Business Profile"
          categoryLabel="Google Business Profile"
          categoryIcon={Building2}
          categoryColor="red"
          title="Google Business profile integration"
          description="Connect your Google Business Profile to manage reviews, respond to customers, create posts, and handle multiple locations—all from your Prompt Reviews dashboard."
        />

        <StandardOverviewLayout
          title="Google Business Profile Integration"
          description="Streamline your Google Business Profile management with powerful tools for reviews, posts, and multi-location oversight."
          icon={Building2}
          iconColor="red"
          availablePlans={['grower', 'builder', 'maven']}

          keyFeatures={keyFeatures}
          keyPoints={keyPoints}
          howItWorks={howItWorks}
          bestPractices={bestPractices}
          customSections={customSections}

          faqs={pageFAQs['google-business']}

          ctaTitle="Ready to Connect Google Business?"
          ctaDescription="Unlock the full potential of your Google Business Profile with Prompt Reviews integration. Available on all plans!"
          ctaButtons={[
            {
              text: 'Website Widgets',
              href: '/widgets',
              variant: 'secondary',
              icon: ArrowRight
            },
            {
              text: 'Connect Google Business',
              href: 'https://app.promptreviews.app/dashboard/google-business',
              variant: 'primary',
              icon: Link2
            }
          ]}
        />
      </div>
    </DocsLayout>
  )
}