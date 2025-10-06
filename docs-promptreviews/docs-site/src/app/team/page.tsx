import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import StandardOverviewLayout from '../../components/StandardOverviewLayout'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import { pageFAQs } from '../utils/faqData'
import { getArticleBySlug } from '@/lib/docs/articles'
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
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
const fallbackDescription = 'Learn how to manage team members, set permissions, and collaborate on review management in Prompt Reviews.'

function resolveIcon(iconName: string | undefined, fallback: LucideIcon): LucideIcon {
  if (!iconName) return fallback
  const lookup = Icons as Record<string, unknown>
  const maybeIcon = lookup[iconName]
  if (typeof maybeIcon === 'function') return maybeIcon as LucideIcon
  return fallback
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const article = await getArticleBySlug('team')
    if (!article) {
      return {
        title: 'Team & Account Management - Permissions & Collaboration | Prompt Reviews Help',
        description: fallbackDescription,
        alternates: { canonical: 'https://docs.promptreviews.app/team' },
      }
    }

    const seoTitle = article.metadata?.seo_title || article.title
    const seoDescription = article.metadata?.seo_description || article.metadata?.description || fallbackDescription

    return {
      title: `${seoTitle} | Prompt Reviews`,
      description: seoDescription,
      keywords: article.metadata?.keywords ?? ['team management', 'user permissions', 'account settings', 'collaboration', 'team access', 'role management'],
      alternates: { canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/team' },
    }
  } catch (error) {
    console.error('generateMetadata team error:', error)
    return {
      title: 'Team & Account Management - Permissions & Collaboration | Prompt Reviews Help',
      description: fallbackDescription,
      alternates: { canonical: 'https://docs.promptreviews.app/team' },
    }
  }
}

export default async function TeamPage() {
  const article = await getArticleBySlug('team')
  if (!article) {
    notFound()
  }

  const CategoryIcon = resolveIcon(article.metadata?.category_icon, Users)

  // Key features for team management
  const keyFeatures = article.metadata?.key_features?.map((feat: any) => ({
    icon: resolveIcon(feat.icon, CheckCircle),
    title: feat.title,
    description: feat.description
  })) || [
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
  const howItWorks = article.metadata?.how_it_works?.map((step: any) => ({
    number: step.number,
    title: step.title,
    description: step.description,
    icon: resolveIcon(step.icon, CheckCircle)
  })) || [
    {
      number: 1,
      title: 'Send Team Invitation',
      description: 'Enter the team member\'s email address and select their role (Admin or Member). They\'ll receive an invitation email to join your account.',
      icon: UserPlus
    },
    {
      number: 2,
      title: 'Team Member Accepts',
      description: 'The invited team member creates their account or signs in with their existing Prompt Reviews account to accept the invitation.',
      icon: UserCheck
    },
    {
      number: 3,
      title: 'Collaboration Begins',
      description: 'Team members can immediately access your account based on their assigned permissions and start collaborating on review management tasks.',
      icon: CheckCircle
    }
  ];

  // Best practices for team management
  const bestPractices = article.metadata?.best_practices?.map((practice: any) => ({
    icon: resolveIcon(practice.icon, CheckCircle),
    title: practice.title,
    description: practice.description
  })) || [
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


  return (
    <StandardOverviewLayout
      title={article.title || "Team management & account settings"}
      description={article.metadata?.description || "Add team members, manage permissions, and control account settings. Collaborate effectively while maintaining security and control."}
      categoryLabel={article.metadata?.category_label || "Team & Account"}
      categoryIcon={CategoryIcon}
      categoryColor={(article.metadata?.category_color as any) || "orange"}
      currentPage="Team & Account"
      availablePlans={article.metadata?.available_plans as any || ['builder', 'maven']}
      keyFeatures={keyFeatures}
      howItWorks={howItWorks}
      bestPractices={bestPractices}
      faqs={pageFAQs['team']}
      callToAction={{
        primary: {
          text: 'View Plans',
          href: '/billing'
        }
      }}
      overview={{
        title: 'Team Management Availability',
        content: (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-yellow-300 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-yellow-300 font-semibold mb-2">Plan Requirements</p>
                <p className="text-white/90 text-sm">
                  Team management features are available on Builder and Maven plans. The Grower plan is designed for individual users.
                  <Link href="/billing" className="text-yellow-200 hover:underline ml-1">
                    View plan comparison →
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )
      }}
    />
  );
}