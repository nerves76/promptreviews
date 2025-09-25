import { Metadata } from 'next';
import DocsLayout from '../docs-layout';
import PageHeader from '../components/PageHeader';
import Link from 'next/link';
import { Globe, Building2, TrendingUp, ArrowRight, CheckCircle, Star, MessageSquare, Upload, Users, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Integrations Overview | Prompt Reviews',
  description: 'Connect Prompt Reviews with Google Business Profile and other platforms to streamline your review management workflow.',
  keywords: 'integrations, google business profile, GBP, API, webhooks, third-party, prompt reviews',
};

export default function IntegrationsOverviewPage() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' }
          ]}
          currentPage="Integrations"
          categoryLabel="Integrations Overview"
          categoryIcon={Globe}
          categoryColor="purple"
          title="Integrations overview"
          description="Connect with the platforms that matter to your business"
        />

        {/* Introduction */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <p className="text-white/90 text-lg mb-4">
              Prompt Reviews integrates seamlessly with the tools and platforms you already use,
              making it easy to manage your entire review ecosystem from one central dashboard.
            </p>
            <p className="text-white/80">
              From Google Business Profile management to custom API integrations, we've built connections
              that save you time and amplify your review collection efforts.
            </p>
          </div>
        </div>

        {/* Main Integrations */}
        <div className="space-y-8 mb-12">
          {/* Google Business Profile */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-red-300" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">Google Business Profile</h2>
                <p className="text-white/80 mb-4">
                  Complete integration with Google Business Profile for managing reviews, posts, and business information.
                </p>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-2">Key Features</h3>
                    <ul className="space-y-1 text-white/70 text-sm">
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-300" />
                        <span>View and respond to Google reviews</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-300" />
                        <span>Create and schedule posts</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-300" />
                        <span>Manage multiple locations</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-300" />
                        <span>Import existing reviews</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-2">Benefits</h3>
                    <ul className="space-y-1 text-white/70 text-sm">
                      <li className="flex items-start">
                        <Star className="w-4 h-4 mr-2 mt-0.5 text-yellow-300" />
                        <span>Improved local SEO ranking</span>
                      </li>
                      <li className="flex items-start">
                        <Star className="w-4 h-4 mr-2 mt-0.5 text-yellow-300" />
                        <span>Centralized management</span>
                      </li>
                      <li className="flex items-start">
                        <Star className="w-4 h-4 mr-2 mt-0.5 text-yellow-300" />
                        <span>Faster response times</span>
                      </li>
                      <li className="flex items-start">
                        <Star className="w-4 h-4 mr-2 mt-0.5 text-yellow-300" />
                        <span>Consistent brand presence</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/google-business"
                    className="inline-flex items-center bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg transition-colors"
                  >
                    <span>Learn More</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                  <Link
                    href="https://app.promptreviews.app/dashboard/google-business"
                    className="inline-flex items-center bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors border border-white/20"
                  >
                    <span>Connect Google Business</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Google Biz Optimizer */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-300" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">Google Biz Optimizer™</h2>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full font-medium">Grower</span>
                  <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-full font-medium">Builder</span>
                  <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded-full font-medium">Maven</span>
                </div>
                <p className="text-white/80 mb-4">
                  Advanced analytics and optimization tools for maximizing your Google Business Profile performance.
                </p>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-2">Optimization Tools</h3>
                    <ul className="space-y-1 text-white/70 text-sm">
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-300" />
                        <span>Industry benchmarks</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-300" />
                        <span>SEO score analysis</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-300" />
                        <span>Quick win identification</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-300" />
                        <span>ROI calculations</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-2">Insights Provided</h3>
                    <ul className="space-y-1 text-white/70 text-sm">
                      <li className="flex items-start">
                        <Star className="w-4 h-4 mr-2 mt-0.5 text-yellow-300" />
                        <span>Review velocity trends</span>
                      </li>
                      <li className="flex items-start">
                        <Star className="w-4 h-4 mr-2 mt-0.5 text-yellow-300" />
                        <span>Rating psychology impact</span>
                      </li>
                      <li className="flex items-start">
                        <Star className="w-4 h-4 mr-2 mt-0.5 text-yellow-300" />
                        <span>Customer action analysis</span>
                      </li>
                      <li className="flex items-start">
                        <Star className="w-4 h-4 mr-2 mt-0.5 text-yellow-300" />
                        <span>Monthly pattern insights</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <Link
                  href="/google-biz-optimizer"
                  className="inline-flex items-center bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-4 py-2 rounded-lg transition-colors"
                >
                  <span>Explore Optimizer</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* API & Developer Tools */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">API & Developer Tools</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">REST API</h3>
              <p className="text-white/70 mb-4">
                Full-featured API for custom integrations and automation.
              </p>
              <ul className="space-y-2 text-white/70 text-sm mb-4">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-300" />
                  <span>Review collection endpoints</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-300" />
                  <span>Prompt page management</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-300" />
                  <span>Widget customization</span>
                </li>
              </ul>
              <Link href="/api" className="inline-flex items-center text-blue-300 hover:text-blue-200">
                <span>API Documentation</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Webhooks</h3>
              <p className="text-white/70 mb-4">
                Real-time notifications for review events and system updates.
              </p>
              <ul className="space-y-2 text-white/70 text-sm mb-4">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-300" />
                  <span>New review notifications</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-300" />
                  <span>Sentiment alerts</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-300" />
                  <span>Campaign updates</span>
                </li>
              </ul>
              <Link href="/api/reference#webhooks" className="inline-flex items-center text-blue-300 hover:text-blue-200">
                <span>Webhook Guide</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-md border border-white/20 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Coming Soon</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6 text-white/60" />
              </div>
              <h3 className="font-semibold text-white mb-1">Slack Integration</h3>
              <p className="text-white/60 text-sm">Get review notifications in Slack</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-white/60" />
              </div>
              <h3 className="font-semibold text-white mb-1">CRM Connectors</h3>
              <p className="text-white/60 text-sm">Sync with popular CRM platforms</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6 text-white/60" />
              </div>
              <h3 className="font-semibold text-white mb-1">Zapier</h3>
              <p className="text-white/60 text-sm">Connect with 5,000+ apps</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 text-center">
          <Shield className="w-12 h-12 text-green-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Secure & Compliant</h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            All integrations use industry-standard OAuth 2.0 authentication and encryption.
            We never store your passwords and you can revoke access at any time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/google-business"
              className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition-colors backdrop-blur-sm border border-white/20"
            >
              <span>Start with Google Business</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link
              href="/api"
              className="inline-flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <span>Explore API Options</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}