import { Metadata } from 'next';
import DocsLayout from '../docs-layout';
import PageHeader from '../components/PageHeader';
import Link from 'next/link';
import { HelpCircle, BookOpen, AlertTriangle, Lightbulb, Zap, ArrowRight, Search, MessageSquare, Users, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Help & Support Overview | Prompt Reviews',
  description: 'Find help with getting started, troubleshooting issues, learning strategies, and mastering advanced features in Prompt Reviews.',
  keywords: 'help, support, getting started, troubleshooting, strategies, advanced features, prompt reviews',
};

export default function HelpOverviewPage() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' }
          ]}
          currentPage="Help & Support"
          categoryLabel="Help & Support"
          categoryIcon={HelpCircle}
          categoryColor="green"
          title="Help & support center"
          description="Everything you need to succeed with Prompt Reviews"
        />

        {/* Introduction */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <p className="text-white/90 text-lg mb-4">
              Whether you're just getting started or looking to master advanced features,
              our help center provides comprehensive guidance for every step of your review collection journey.
            </p>
            <p className="text-white/80">
              From quick setup guides to proven strategies that increase review rates by 300%,
              find the resources you need to build your online reputation effectively.
            </p>
          </div>
        </div>

        {/* Main Help Sections */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Getting Started */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-colors">
            <div className="flex items-center mb-4">
              <BookOpen className="w-8 h-8 text-blue-300 mr-3" />
              <h2 className="text-xl font-semibold text-white">Getting Started</h2>
            </div>
            <p className="text-white/80 mb-4">
              New to Prompt Reviews? Start here with our step-by-step setup guide that gets you collecting reviews in 30 minutes.
            </p>
            <ul className="space-y-2 mb-4">
              <li className="text-white/70 text-sm flex items-start">
                <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-300" />
                <span>Quick account setup</span>
              </li>
              <li className="text-white/70 text-sm flex items-start">
                <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-300" />
                <span>Choosing the right plan</span>
              </li>
              <li className="text-white/70 text-sm flex items-start">
                <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-300" />
                <span>First prompt page creation</span>
              </li>
              <li className="text-white/70 text-sm flex items-start">
                <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-300" />
                <span>Widget installation guide</span>
              </li>
            </ul>
            <Link href="/getting-started" className="inline-flex items-center text-blue-300 hover:text-blue-200">
              <span>Start Your Journey</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>

          {/* Troubleshooting */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-colors">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-8 h-8 text-orange-300 mr-3" />
              <h2 className="text-xl font-semibold text-white">Troubleshooting</h2>
            </div>
            <p className="text-white/80 mb-4">
              Running into issues? Find quick solutions to common problems and get back to collecting reviews fast.
            </p>
            <ul className="space-y-2 mb-4">
              <li className="text-white/70 text-sm flex items-start">
                <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-300" />
                <span>Email delivery issues</span>
              </li>
              <li className="text-white/70 text-sm flex items-start">
                <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-300" />
                <span>Widget display problems</span>
              </li>
              <li className="text-white/70 text-sm flex items-start">
                <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-300" />
                <span>QR code troubleshooting</span>
              </li>
              <li className="text-white/70 text-sm flex items-start">
                <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-300" />
                <span>Account access help</span>
              </li>
            </ul>
            <Link href="/troubleshooting" className="inline-flex items-center text-orange-300 hover:text-orange-200">
              <span>Find Solutions</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>

          {/* Proven Strategies */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-colors">
            <div className="flex items-center mb-4">
              <Lightbulb className="w-8 h-8 text-purple-300 mr-3" />
              <h2 className="text-xl font-semibold text-white">Proven Strategies</h2>
            </div>
            <p className="text-white/80 mb-4">
              Learn psychology-backed strategies that top businesses use to increase review rates by up to 300%.
            </p>
            <ul className="space-y-2 mb-4">
              <li className="text-white/70 text-sm flex items-start">
                <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-300" />
                <span>The Double-Dip Strategy™</span>
              </li>
              <li className="text-white/70 text-sm flex items-start">
                <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-300" />
                <span>Psychology of reciprocity</span>
              </li>
              <li className="text-white/70 text-sm flex items-start">
                <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-300" />
                <span>Personal outreach tactics</span>
              </li>
              <li className="text-white/70 text-sm flex items-start">
                <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-300" />
                <span>Reviews on the fly method</span>
              </li>
            </ul>
            <Link href="/strategies" className="inline-flex items-center text-purple-300 hover:text-purple-200">
              <span>Explore Strategies</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>

          {/* Advanced Features */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-colors">
            <div className="flex items-center mb-4">
              <Zap className="w-8 h-8 text-yellow-300 mr-3" />
              <h2 className="text-xl font-semibold text-white">Advanced Features</h2>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-full font-medium">Builder</span>
              <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded-full font-medium">Maven</span>
            </div>
            <p className="text-white/80 mb-4">
              Master power features like API integration, automation, and white-label customization.
            </p>
            <ul className="space-y-2 mb-4">
              <li className="text-white/70 text-sm flex items-start">
                <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-300" />
                <span>API & webhook setup</span>
              </li>
              <li className="text-white/70 text-sm flex items-start">
                <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-300" />
                <span>Automated campaigns</span>
              </li>
              <li className="text-white/70 text-sm flex items-start">
                <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-300" />
                <span>Custom domain setup</span>
              </li>
              <li className="text-white/70 text-sm flex items-start">
                <Sparkles className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-yellow-300" />
                <span>Advanced analytics</span>
              </li>
            </ul>
            <Link href="/advanced" className="inline-flex items-center text-yellow-300 hover:text-yellow-200">
              <span>Advanced Guide</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>

        {/* Popular Help Articles */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Popular Help Articles</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/getting-started/first-prompt-page"
              className="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-colors group"
            >
              <h3 className="font-semibold text-white mb-1 group-hover:text-blue-300">Creating Your First Prompt Page</h3>
              <p className="text-white/60 text-sm">Step-by-step guide to creating an effective review request page</p>
            </Link>

            <Link
              href="/strategies/double-dip"
              className="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-colors group"
            >
              <h3 className="font-semibold text-white mb-1 group-hover:text-blue-300">The Double-Dip Strategy</h3>
              <p className="text-white/60 text-sm">Increase review rates by 300% with this proven method</p>
            </Link>

            <Link
              href="/widgets"
              className="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-colors group"
            >
              <h3 className="font-semibold text-white mb-1 group-hover:text-blue-300">Installing Review Widgets</h3>
              <p className="text-white/60 text-sm">Add review displays to your website in minutes</p>
            </Link>

            <Link
              href="/troubleshooting#email-delivery"
              className="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-colors group"
            >
              <h3 className="font-semibold text-white mb-1 group-hover:text-blue-300">Fixing Email Delivery Issues</h3>
              <p className="text-white/60 text-sm">Ensure your review requests reach customers</p>
            </Link>

            <Link
              href="/google-business"
              className="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-colors group"
            >
              <h3 className="font-semibold text-white mb-1 group-hover:text-blue-300">Connecting Google Business</h3>
              <p className="text-white/60 text-sm">Integrate with Google Business Profile for better management</p>
            </Link>

            <Link
              href="/contacts"
              className="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-colors group"
            >
              <h3 className="font-semibold text-white mb-1 group-hover:text-blue-300">Importing Customer Contacts</h3>
              <p className="text-white/60 text-sm">Bulk import contacts for targeted campaigns</p>
            </Link>
          </div>
        </div>

        {/* Learning Path */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-md border border-white/20 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Recommended Learning Path</h2>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-white">Start with Getting Started</h3>
                <p className="text-white/70 text-sm">Complete the 30-minute setup to get your first reviews flowing</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-white">Learn Proven Strategies</h3>
                <p className="text-white/70 text-sm">Implement tactics that dramatically increase review rates</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-white">Configure Your Settings</h3>
                <p className="text-white/70 text-sm">Customize everything to match your brand and workflow</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">4</span>
              </div>
              <div>
                <h3 className="font-semibold text-white">Master Advanced Features</h3>
                <p className="text-white/70 text-sm">Unlock automation and API capabilities for scale</p>
              </div>
            </div>
          </div>
        </div>

        {/* Still Need Help? */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 text-center">
          <MessageSquare className="w-12 h-12 text-green-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Still Need Help?</h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Our support team is here to help you succeed. Get personalized assistance with any
            question or challenge you're facing.
          </p>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <Search className="w-8 h-8 text-blue-300 mx-auto mb-2" />
              <h3 className="font-semibold text-white mb-1">Search FAQs</h3>
              <Link href="/faq" className="text-blue-300 hover:text-blue-200 text-sm">
                Browse all FAQs →
              </Link>
            </div>

            <div className="text-center">
              <MessageSquare className="w-8 h-8 text-green-300 mx-auto mb-2" />
              <h3 className="font-semibold text-white mb-1">Email Support</h3>
              <a href="mailto:support@promptreviews.app" className="text-green-300 hover:text-green-200 text-sm">
                support@promptreviews.app
              </a>
            </div>

            <div className="text-center">
              <Users className="w-8 h-8 text-purple-300 mx-auto mb-2" />
              <h3 className="font-semibold text-white mb-1">Community</h3>
              <span className="text-white/60 text-sm">Coming Soon</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/getting-started"
              className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition-colors backdrop-blur-sm border border-white/20"
            >
              <span>Quick Start Guide</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link
              href="/troubleshooting"
              className="inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <span>Troubleshooting Help</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}