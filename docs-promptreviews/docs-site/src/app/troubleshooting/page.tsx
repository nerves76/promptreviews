import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import StandardOverviewLayout from '../../components/StandardOverviewLayout'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import { pageFAQs } from '../utils/faqData'
import { getArticleBySlug } from '@/lib/docs/articles'
import {
  AlertTriangle,
  Search,
  CheckCircle,
  Mail,
  QrCode,
  Settings,
  RefreshCw,
  Shield,
  Database,
  Lock,
  Globe,
  Clock,
  MessageSquare,
  Users,
  Star,
  Zap
} from 'lucide-react'
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const fallbackDescription = 'Find solutions to common Prompt Reviews issues. From setup problems to review collection challenges, get quick answers and step-by-step fixes.'

function resolveIcon(iconName: string | undefined, fallback: LucideIcon): LucideIcon {
  if (!iconName) return fallback
  const lookup = Icons as Record<string, unknown>
  const maybeIcon = lookup[iconName]
  if (typeof maybeIcon === 'function') return maybeIcon as LucideIcon
  return fallback
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const article = await getArticleBySlug('troubleshooting')
    if (!article) {
      return {
        title: 'Troubleshooting - Common Issues & Solutions | Prompt Reviews Help',
        description: fallbackDescription,
        alternates: { canonical: 'https://docs.promptreviews.app/troubleshooting' },
      }
    }

    const seoTitle = article.metadata?.seo_title || article.title
    const seoDescription = article.metadata?.seo_description || article.metadata?.description || fallbackDescription

    return {
      title: `${seoTitle} | Prompt Reviews`,
      description: seoDescription,
      keywords: article.metadata?.keywords ?? ['troubleshooting', 'common issues', 'review collection problems', 'setup help', 'technical support', 'FAQ'],
      alternates: { canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/troubleshooting' },
    }
  } catch (error) {
    console.error('generateMetadata troubleshooting error:', error)
    return {
      title: 'Troubleshooting - Common Issues & Solutions | Prompt Reviews Help',
      description: fallbackDescription,
      alternates: { canonical: 'https://docs.promptreviews.app/troubleshooting' },
    }
  }
}


export default async function TroubleshootingPage() {
  const article = await getArticleBySlug('troubleshooting')
  if (!article) {
    notFound()
  }

  const CategoryIcon = resolveIcon(article.metadata?.category_icon, AlertTriangle)

const keyFeatures = article.metadata?.key_features?.map((feat: any) => ({
  icon: resolveIcon(feat.icon, CheckCircle),
  title: feat.title,
  description: feat.description
})) || [
  {
    icon: Search,
    title: 'Quick Issue Search',
    description: 'Find solutions to your specific problems with our searchable troubleshooting guide.'
  },
  {
    icon: RefreshCw,
    title: 'Step-by-Step Fixes',
    description: 'Clear, actionable solutions for the most common issues and technical problems.'
  },
  {
    icon: Mail,
    title: 'Email Delivery Help',
    description: 'Resolve email delivery issues and improve your review request success rates.'
  },
  {
    icon: QrCode,
    title: 'QR Code Troubleshooting',
    description: 'Fix QR code scanning issues and ensure customers can easily access your prompt pages.'
  },
  {
    icon: Database,
    title: 'Contact Import Solutions',
    description: 'Resolve common problems when importing your customer database or contact lists.'
  },
  {
    icon: Settings,
    title: 'Account & Setup Support',
    description: 'Get help with login issues, profile updates, and account configuration problems.'
  }
]

const howItWorks = article.metadata?.how_it_works?.map((step: any) => ({
  number: step.number,
  title: step.title,
  description: step.description,
  icon: resolveIcon(step.icon, CheckCircle)
})) || [
  {
    number: 1,
    title: 'Identify Your Issue',
    description: 'Use our search function or browse categories to find the specific problem you\'re experiencing.',
    icon: Search
  },
  {
    number: 2,
    title: 'Try Quick Fixes',
    description: 'Start with our most common solutions like refreshing your browser or checking settings.',
    icon: RefreshCw
  },
  {
    number: 3,
    title: 'Follow Step-by-Step Solutions',
    description: 'Work through our detailed troubleshooting steps specific to your issue category.',
    icon: CheckCircle
  },
  {
    number: 4,
    title: 'Contact Support if Needed',
    description: 'If the issue persists, contact our support team with the steps you\'ve already tried.',
    icon: Mail
  }
]

const bestPractices = article.metadata?.best_practices?.map((practice: any) => ({
  icon: resolveIcon(practice.icon, CheckCircle),
  title: practice.title,
  description: practice.description
})) || [
  {
    icon: Users,
    title: 'Start with Happy Customers',
    description: 'Focus on customers who had positive experiences. They\'re more likely to leave glowing reviews and help troubleshoot issues.'
  },
  {
    icon: Clock,
    title: 'Perfect Your Timing',
    description: 'Send review requests when the experience is fresh but not overwhelming - typically 1-3 days after service completion.'
  },
  {
    icon: MessageSquare,
    title: 'Personalize Every Request',
    description: 'Use specific details about each customer\'s experience in your review requests to improve response rates.'
  },
  {
    icon: Shield,
    title: 'Keep Your Data Clean',
    description: 'Regularly update contact information and remove invalid email addresses to maintain high deliverability rates.'
  }
]

  return (
    <StandardOverviewLayout
      title={article.title || "Troubleshooting guide"}
      description={article.metadata?.description || "Running into issues? Don't worry—most problems have simple solutions. Find quick fixes for common issues and get back to collecting great reviews."}
      categoryLabel={article.metadata?.category_label || "Need Help?"}
      categoryIcon={CategoryIcon}
      categoryColor={(article.metadata?.category_color as any) || "orange"}
      currentPage="Troubleshooting"
      availablePlans={article.metadata?.available_plans as any || ['grower', 'builder', 'maven']}
      keyFeatures={keyFeatures}
      howItWorks={howItWorks}
      bestPractices={bestPractices}
      faqs={pageFAQs['troubleshooting']}
      callToAction={{
        primary: {
          text: 'Getting Started Guide',
          href: '/getting-started'
        }
      }}
      overview={{
        title: 'Quick Solutions for Common Issues',
        content: <>
            <p className="text-white/90 text-lg mb-6 text-center">
              Most technical issues can be resolved quickly with the right approach.
              Our troubleshooting guide covers the most common problems and provides
              step-by-step solutions to get you back on track.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">Quick Search</h3>
                <p className="text-white/80 text-sm">
                  Find solutions to your specific problems instantly
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">Step-by-Step</h3>
                <p className="text-white/80 text-sm">
                  Clear, actionable solutions with detailed instructions
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">Expert Support</h3>
                <p className="text-white/80 text-sm">
                  Get personalized help when you need it most
                </p>
              </div>
            </div>
          </>
      }}
    />
  )
}
