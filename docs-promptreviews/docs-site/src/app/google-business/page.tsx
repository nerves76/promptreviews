import type { Metadata } from 'next'
import Link from 'next/link'
import DocsLayout from '../docs-layout'
import PageHeader from '../components/PageHeader'
import PageFAQs from '../components/PageFAQs'
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
  AlertCircle,
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
  return (
    <DocsLayout>
      {/* Hero Section */}
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

      <div className="max-w-4xl mx-auto mb-16">

        {/* Plan Indicator */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-white/60">Available on:</span>
            <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-full font-medium">Builder</span>
            <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded-full font-medium">Maven</span>
          </div>
        </div>

        {/* Important Note */}
        <div className="bg-yellow-400/20 backdrop-blur-md border border-yellow-300/30 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-yellow-300 mt-1" />
            <div>
              <p className="text-white font-medium mb-2">
                Available on Builder and Maven Plans
              </p>
              <p className="text-white/80 text-sm">
                Google Business Profile integration requires a Builder or Maven subscription. Upgrade your plan to unlock this powerful feature.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">What You Can Do</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <Star className="w-8 h-8 text-yellow-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Manage Reviews</h3>
            <p className="text-white/80">
              View and respond to Google reviews directly from Prompt Reviews. Track review trends and maintain your reputation.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <MessageSquare className="w-8 h-8 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Create Posts</h3>
            <p className="text-white/80">
              Share updates, offers, and events on your Google Business Profile. Schedule posts in advance.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <MapPin className="w-8 h-8 text-green-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Multiple Locations</h3>
            <p className="text-white/80">
              Manage all your business locations from one dashboard. Perfect for franchises and multi-location businesses.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <Upload className="w-8 h-8 text-purple-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Import Reviews</h3>
            <p className="text-white/80">
              Import existing Google reviews to your dashboard. Build on your established reputation.
            </p>
          </div>
        </div>
      </div>

      {/* Connection Process */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">How to Connect Your Profile</h2>
        
        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">1</div>
              <h3 className="text-xl font-semibold text-white">Sign In with Google</h3>
            </div>
            <p className="text-white/90 mb-4">
              Click "Connect Google Business" and sign in with the Google account that manages your business profile.
            </p>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-sm text-white/70">
                <strong>Note:</strong> You must be an owner or manager of the Google Business Profile.
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
      </div>

      {/* Managing Multiple Locations */}
      <div className="max-w-4xl mx-auto mb-16">
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

      {/* Review Management Best Practices */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">Review Management</h2>
        
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
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

          <p className="text-white/90 mb-6">
            Managing reviews effectively is crucial for your online reputation and local SEO performance.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Response Best Practices</h3>
              <ul className="space-y-2 text-white/80 text-sm">
                <li>• Respond within 24 hours</li>
                <li>• Thank customers for positive reviews</li>
                <li>• Address concerns professionally</li>
                <li>• Keep responses personalized</li>
                <li>• Include your business name naturally</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">What to Avoid</h3>
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
      </div>

      {/* Google Posts */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">Creating Google Posts</h2>
        
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
          <p className="text-white/90 mb-6">
            Keep your Google Business Profile active with regular posts about updates, offers, and events.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Post Types</h3>
              <ul className="space-y-2 text-white/80 text-sm">
                <li>• What's New updates</li>
                <li>• Special offers and promotions</li>
                <li>• Upcoming events</li>
                <li>• Product highlights</li>
                <li>• COVID-19 updates</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Best Practices</h3>
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

      {/* Security & Privacy */}
      <div className="max-w-4xl mx-auto mb-16">
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

      {/* FAQs Section */}
      <div className="max-w-4xl mx-auto mb-16">
        <PageFAQs 
          faqs={pageFAQs['google-business']}
          pageTitle="Google Business Profile Integration"
          pageUrl="https://docs.promptreviews.com/google-business"
        />
      </div>

      {/* Next Steps */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Connect Google Business?</h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Unlock the full potential of your Google Business Profile with Prompt Reviews integration.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/widgets"
              className="inline-flex items-center space-x-2 bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 border border-white/30 transition-colors font-medium backdrop-blur-sm"
            >
              <span>Website Widgets</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            
            <a
              href="https://promptreviews.app/dashboard/google-business"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <span>Connect Google Business</span>
              <Link2 className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </DocsLayout>
  )
}