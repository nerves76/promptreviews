import { Metadata } from 'next';
import DocsLayout from '../docs-layout';
import PageHeader from '../components/PageHeader';
import Link from 'next/link';
import { Settings, Building, Palette, Users, CreditCard, BarChart3, ArrowRight, Shield, Bell, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Settings & Configuration Overview | Prompt Reviews',
  description: 'Manage your Prompt Reviews account settings, business profile, team members, billing, and customization options.',
  keywords: 'settings, configuration, account management, business profile, team, billing, analytics, prompt reviews',
};

export default function SettingsOverviewPage() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' }
          ]}
          currentPage="Settings"
          categoryLabel="Settings & Configuration"
          categoryIcon={Settings}
          categoryColor="gray"
          title="Settings & configuration"
          description="Customize and manage every aspect of your Prompt Reviews account"
        />

        {/* Introduction */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-gray-500/10 to-blue-500/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <p className="text-white/90 text-lg mb-4">
              Your settings dashboard is the control center for your Prompt Reviews account.
              Configure your business profile, manage team access, customize branding, and monitor your subscription—all in one place.
            </p>
            <p className="text-white/80">
              Each setting impacts how customers interact with your review requests and how your team collaborates on reputation management.
            </p>
          </div>
        </div>

        {/* Settings Categories Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Business Profile */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-colors">
            <div className="flex items-center mb-4">
              <Building className="w-8 h-8 text-yellow-300 mr-3" />
              <h2 className="text-xl font-semibold text-white">Business Profile</h2>
            </div>
            <p className="text-white/80 mb-4">
              Core business information that powers AI content generation and builds customer trust.
            </p>
            <ul className="space-y-2 mb-4">
              <li className="text-white/70 text-sm">• Company details and contact info</li>
              <li className="text-white/70 text-sm">• Logo and branding assets</li>
              <li className="text-white/70 text-sm">• Services and unique value</li>
              <li className="text-white/70 text-sm">• AI optimization settings</li>
            </ul>
            <Link href="/business-profile" className="inline-flex items-center text-yellow-300 hover:text-yellow-200">
              <span>Configure Profile</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>

          {/* Style Settings */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-colors">
            <div className="flex items-center mb-4">
              <Palette className="w-8 h-8 text-purple-300 mr-3" />
              <h2 className="text-xl font-semibold text-white">Style Settings</h2>
            </div>
            <p className="text-white/80 mb-4">
              Customize the visual appearance of your prompt pages to match your brand identity.
            </p>
            <ul className="space-y-2 mb-4">
              <li className="text-white/70 text-sm">• Font selection (50+ options)</li>
              <li className="text-white/70 text-sm">• Color schemes and gradients</li>
              <li className="text-white/70 text-sm">• Background styles</li>
              <li className="text-white/70 text-sm">• Card appearance settings</li>
            </ul>
            <Link href="/style-settings" className="inline-flex items-center text-purple-300 hover:text-purple-200">
              <span>Customize Style</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>

          {/* Team Management */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-colors">
            <div className="flex items-center mb-4">
              <Users className="w-8 h-8 text-orange-300 mr-3" />
              <h2 className="text-xl font-semibold text-white">Team Management</h2>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-full font-medium">Builder</span>
              <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded-full font-medium">Maven</span>
            </div>
            <p className="text-white/80 mb-4">
              Add team members and manage permissions for collaborative review management.
            </p>
            <ul className="space-y-2 mb-4">
              <li className="text-white/70 text-sm">• Invite team members</li>
              <li className="text-white/70 text-sm">• Role-based access control</li>
              <li className="text-white/70 text-sm">• Activity monitoring</li>
              <li className="text-white/70 text-sm">• Permission management</li>
            </ul>
            <Link href="/team" className="inline-flex items-center text-orange-300 hover:text-orange-200">
              <span>Manage Team</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>

          {/* Billing & Plans */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-colors">
            <div className="flex items-center mb-4">
              <CreditCard className="w-8 h-8 text-green-300 mr-3" />
              <h2 className="text-xl font-semibold text-white">Billing & Plans</h2>
            </div>
            <p className="text-white/80 mb-4">
              Manage your subscription, payment methods, and view billing history.
            </p>
            <ul className="space-y-2 mb-4">
              <li className="text-white/70 text-sm">• Current plan details</li>
              <li className="text-white/70 text-sm">• Upgrade/downgrade options</li>
              <li className="text-white/70 text-sm">• Payment method management</li>
              <li className="text-white/70 text-sm">• Invoice downloads</li>
            </ul>
            <Link href="/billing" className="inline-flex items-center text-green-300 hover:text-green-200">
              <span>Manage Billing</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>

          {/* Analytics Settings */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-colors">
            <div className="flex items-center mb-4">
              <BarChart3 className="w-8 h-8 text-indigo-300 mr-3" />
              <h2 className="text-xl font-semibold text-white">Analytics & Insights</h2>
            </div>
            <p className="text-white/80 mb-4">
              Track performance metrics and gain insights into your review collection efforts.
            </p>
            <ul className="space-y-2 mb-4">
              <li className="text-white/70 text-sm">• Dashboard customization</li>
              <li className="text-white/70 text-sm">• Report generation</li>
              <li className="text-white/70 text-sm">• Export data options</li>
              <li className="text-white/70 text-sm">• Performance benchmarks</li>
            </ul>
            <Link href="/analytics" className="inline-flex items-center text-indigo-300 hover:text-indigo-200">
              <span>View Analytics</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>

          {/* Additional Settings */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-colors">
            <div className="flex items-center mb-4">
              <Shield className="w-8 h-8 text-red-300 mr-3" />
              <h2 className="text-xl font-semibold text-white">Security & Privacy</h2>
            </div>
            <p className="text-white/80 mb-4">
              Manage security settings and control data privacy preferences.
            </p>
            <ul className="space-y-2 mb-4">
              <li className="text-white/70 text-sm">• Two-factor authentication</li>
              <li className="text-white/70 text-sm">• API key management</li>
              <li className="text-white/70 text-sm">• Data export/deletion</li>
              <li className="text-white/70 text-sm">• Privacy controls</li>
            </ul>
            <Link href="https://app.promptreviews.app/dashboard/settings" className="inline-flex items-center text-red-300 hover:text-red-200">
              <span>Security Settings</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>

          <div className="grid md:grid-cols-3 gap-4">
            <Link
              href="https://app.promptreviews.app/dashboard/business-profile"
              className="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-colors text-center group"
            >
              <Building className="w-8 h-8 text-yellow-300 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-white text-sm">Update Business Info</span>
            </Link>

            <Link
              href="https://app.promptreviews.app/dashboard/style"
              className="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-colors text-center group"
            >
              <Palette className="w-8 h-8 text-purple-300 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-white text-sm">Edit Brand Style</span>
            </Link>

            <Link
              href="https://app.promptreviews.app/dashboard/team"
              className="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-colors text-center group"
            >
              <Users className="w-8 h-8 text-orange-300 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-white text-sm">Invite Team Member</span>
            </Link>

            <Link
              href="https://app.promptreviews.app/dashboard/plan"
              className="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-colors text-center group"
            >
              <CreditCard className="w-8 h-8 text-green-300 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-white text-sm">Change Plan</span>
            </Link>

            <Link
              href="https://app.promptreviews.app/dashboard/analytics"
              className="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-colors text-center group"
            >
              <BarChart3 className="w-8 h-8 text-indigo-300 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-white text-sm">View Reports</span>
            </Link>

            <Link
              href="https://app.promptreviews.app/dashboard/settings"
              className="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-colors text-center group"
            >
              <Bell className="w-8 h-8 text-yellow-300 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-white text-sm">Notifications</span>
            </Link>
          </div>
        </div>

        {/* Settings Tips */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-md border border-white/20 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Configuration Best Practices</h2>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-yellow-300 font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Complete Your Profile First</h3>
                <p className="text-white/70 text-sm">
                  A complete business profile improves AI-generated content and builds customer trust.
                  Start here before customizing other settings.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-300 font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Match Your Brand Consistently</h3>
                <p className="text-white/70 text-sm">
                  Use your exact brand colors and fonts across all prompt pages for professional consistency
                  that customers recognize and trust.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-300 font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Set Up Team Access Early</h3>
                <p className="text-white/70 text-sm">
                  Add team members with appropriate permissions to distribute workload and ensure
                  timely review responses even when you're unavailable.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-yellow-300 font-bold">4</span>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Monitor Usage Regularly</h3>
                <p className="text-white/70 text-sm">
                  Check analytics weekly and review your plan usage monthly to ensure you're on the
                  right plan for your needs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}