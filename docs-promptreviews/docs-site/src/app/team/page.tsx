import type { Metadata } from 'next'
import Link from 'next/link'
import DocsLayout from '../docs-layout'
import PageHeader from '../components/PageHeader'
import { 
  Users, 
  Shield, 
  Settings, 
  UserPlus,
  Lock,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  Key,
  Eye
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Team & Account Management - Permissions & Collaboration | Prompt Reviews Help',
  description: 'Learn how to manage team members, set permissions, and collaborate on review management in Prompt Reviews.',
  keywords: [
    'team management',
    'user permissions',
    'account settings',
    'collaboration',
    'team access',
    'role management'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.com/team',
  },
}

export default function TeamPage() {
  return (
    <DocsLayout>
      {/* Hero Section */}
      <PageHeader
        breadcrumbs={[
          { label: 'Help', href: '/' }
        ]}
        currentPage="Team & Account"
        categoryLabel="Team & Account"
        categoryIcon={Users}
        categoryColor="orange"
        title="Team management & account settings"
        description="Add team members, manage permissions, and control account settings. Collaborate effectively while maintaining security and control."
      />

      {/* Plan Indicator */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-white/60">Available on:</span>
          <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-full font-medium">Builder</span>
          <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded-full font-medium">Maven</span>
        </div>
        <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-yellow-300 text-sm">
            <strong>Note:</strong> Team management is not available on the Grower plan. 
            <Link href="/getting-started/choosing-plan" className="text-yellow-200 hover:underline ml-1">
              Learn about plan differences →
            </Link>
          </p>
        </div>
      </div>

      {/* Team Roles */}
      <div className="max-w-4xl mx-auto mb-16" id="roles">
        <h2 className="text-3xl font-bold text-white mb-8">Team Roles & Permissions</h2>
        
        <div className="space-y-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Shield className="w-6 h-6 text-yellow-300" />
              <h3 className="text-lg font-semibold text-white">Owner</h3>
            </div>
            <p className="text-white/80 mb-3">
              Full access to all features, billing, and team management.
            </p>
            <ul className="text-sm text-white/70 space-y-1">
              <li>• Manage billing and subscriptions</li>
              <li>• Add/remove team members</li>
              <li>• Access all business data</li>
              <li>• Delete account</li>
            </ul>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Key className="w-6 h-6 text-blue-300" />
              <h3 className="text-lg font-semibold text-white">Admin</h3>
            </div>
            <p className="text-white/80 mb-3">
              Manage reviews, contacts, and team members (except owners).
            </p>
            <ul className="text-sm text-white/70 space-y-1">
              <li>• Full review management</li>
              <li>• Edit business settings</li>
              <li>• Manage team members</li>
              <li>• Cannot access billing</li>
            </ul>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Eye className="w-6 h-6 text-green-300" />
              <h3 className="text-lg font-semibold text-white">Member</h3>
            </div>
            <p className="text-white/80 mb-3">
              View and respond to reviews, manage assigned contacts.
            </p>
            <ul className="text-sm text-white/70 space-y-1">
              <li>• View reviews and analytics</li>
              <li>• Respond to reviews</li>
              <li>• Manage assigned contacts</li>
              <li>• Limited settings access</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Adding Team Members */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">Adding Team Members</h2>
        
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">1</div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Send Invitation</h3>
                <p className="text-white/80">
                  Enter team member's email address and select their role. They'll receive an invitation to join.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">2</div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Team Member Accepts</h3>
                <p className="text-white/80">
                  They'll create their own account or sign in if they already have one.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">3</div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Access Granted</h3>
                <p className="text-white/80">
                  Team member can immediately start working based on their assigned role.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-4">
            <p className="text-white/90 text-sm">
              <strong className="text-yellow-300">Note:</strong> Team member limits depend on your subscription plan. Upgrade to add more team members.
            </p>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">Account Settings</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <Settings className="w-8 h-8 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">General Settings</h3>
            <ul className="text-sm text-white/80 space-y-2">
              <li>• Account name and details</li>
              <li>• Time zone preferences</li>
              <li>• Notification settings</li>
              <li>• Language preferences</li>
            </ul>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <Lock className="w-8 h-8 text-green-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Security</h3>
            <ul className="text-sm text-white/80 space-y-2">
              <li>• Two-factor authentication</li>
              <li>• Password requirements</li>
              <li>• Session management</li>
              <li>• API access tokens</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-white mb-8">Team Management Best Practices</h2>
        
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
          <ul className="space-y-4 text-white/90">
            <li className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
              <span>Use role-based access to maintain security while enabling collaboration</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
              <span>Regularly review team member access and remove inactive users</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
              <span>Enable two-factor authentication for all team members</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
              <span>Document team responsibilities and review response guidelines</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Next Steps */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Build Your Team?</h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Add team members to collaborate on review management and grow your online reputation together.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/advanced"
              className="inline-flex items-center space-x-2 bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 border border-white/30 transition-colors font-medium backdrop-blur-sm"
            >
              <span>Advanced Features</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            
            <a
              href="https://promptreviews.app/dashboard/team"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <span>Manage Team</span>
              <UserPlus className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </DocsLayout>
  )
}