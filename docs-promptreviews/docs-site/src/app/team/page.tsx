import type { Metadata } from 'next'
import Link from 'next/link'
import DocsLayout from '../docs-layout'
import PageHeader from '../components/PageHeader'
import StandardOverviewLayout from '../components/StandardOverviewLayout'
import { pageFAQs } from '../utils/faqData'
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
  Eye,
  UserCheck,
  CreditCard
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
    canonical: 'https://docs.promptreviews.app/team',
  },
}

export default function TeamPage() {
  // Key features for team management
  const keyFeatures = [
    {
      icon: UserPlus,
      title: 'Team Invitations',
      description: 'Easily invite team members by email and manage their access to different parts of your account. Role-based permissions ensure everyone has appropriate access levels.',
    },
    {
      icon: Shield,
      title: 'Permission Control',
      description: 'Set different access levels for team members - from full Admin access to limited Member permissions. Maintain security while enabling collaboration.',
    },
    {
      icon: Eye,
      title: 'Activity Monitoring',
      description: 'Track what team members are doing with activity logs and audit trails. Know who made changes and when for complete transparency.',
    },
    {
      icon: Settings,
      title: 'Account Settings',
      description: 'Manage general account settings, security preferences, notification settings, and other account-wide configurations from a central location.',
    }
  ];

  // How team management works
  const howItWorks = (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">1</div>
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white">Send Team Invitation</h3>
        </div>
        <p className="text-white/90 ml-16">
          Enter the team member's email address and select their role (Admin or Member). They'll receive an invitation email to join your account.
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold">2</div>
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white">Team Member Accepts</h3>
        </div>
        <p className="text-white/90 ml-16">
          The invited team member creates their account or signs in with their existing Prompt Reviews account to accept the invitation.
        </p>
      </div>

      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-semibold">3</div>
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white">Collaboration Begins</h3>
        </div>
        <p className="text-white/90 ml-16">
          Team members can immediately access your account based on their assigned permissions and start collaborating on review management tasks.
        </p>
      </div>
    </div>
  );

  // Best practices for team management
  const bestPractices = [
    {
      icon: Shield,
      title: 'Use Role-Based Access',
      description: 'Assign appropriate permission levels to maintain security while enabling effective collaboration. Not everyone needs full admin access.'
    },
    {
      icon: Eye,
      title: 'Regular Access Reviews',
      description: 'Periodically review team member access and remove inactive users. Keep your team list current and secure.'
    },
    {
      icon: Lock,
      title: 'Enable Two-Factor Auth',
      description: 'Require two-factor authentication for all team members, especially those with admin privileges, to enhance account security.'
    },
    {
      icon: Settings,
      title: 'Document Processes',
      description: 'Create clear guidelines for team responsibilities, review response procedures, and escalation processes for consistency.'
    }
  ];

  // Team roles section
  const teamRolesSection = (
    <div className="max-w-4xl mx-auto mb-16">
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
  );

  // Account settings section
  const accountSettingsSection = (
    <div className="max-w-4xl mx-auto mb-16">
      <h2 className="text-3xl font-bold text-white mb-8">Account Settings Overview</h2>

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
  );

  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
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

        <StandardOverviewLayout
          title="Team Management & Account Settings"
          description="Build a collaborative environment with secure team access controls and centralized account management."
          icon={Users}
          iconColor="orange"
          availablePlans={['builder', 'maven']}

          introduction={
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-yellow-300 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-yellow-300 font-semibold mb-2">Team Management Availability</p>
                  <p className="text-white/90 text-sm">
                    Team management features are available on Builder and Maven plans. The Grower plan is designed for individual users.
                    <Link href="/billing" className="text-yellow-200 hover:underline ml-1">
                      View plan comparison →
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          }

          keyFeatures={keyFeatures}
          howItWorks={howItWorks}
          bestPractices={
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
              <div className="space-y-6">
                {bestPractices.map((practice, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <practice.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-2">{practice.title}</h3>
                      <p className="text-white/80">{practice.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          }

          customSections={
            <>
              {teamRolesSection}
              {accountSettingsSection}
            </>
          }

          faqs={pageFAQs['team']}

          ctaTitle="Ready to Build Your Team?"
          ctaDescription="Add team members to collaborate on review management and grow your online reputation together."
          ctaButtons={[
            {
              text: 'View Plans',
              href: '/billing',
              variant: 'secondary',
              icon: CreditCard
            },
            {
              text: 'Manage Team',
              href: 'https://app.promptreviews.app/dashboard/team',
              variant: 'primary',
              icon: UserPlus
            }
          ]}
        />
      </div>
    </DocsLayout>
  );
}