import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import StandardOverviewLayout from '../../components/StandardOverviewLayout'
import MarkdownRenderer from '../../components/MarkdownRenderer'
import { pageFAQs } from '../utils/faqData'
import { getArticleBySlug } from '@/lib/docs/articles'

// Revalidate every 60 seconds - allows CMS updates to show without redeployment
export const revalidate = 60


const {
  CheckCircle,
  Star,
  Users,
  Zap,
  Clock,
  Settings,
  MessageCircle,
  Globe,
  Target,
  Sparkles
} = Icons

const fallbackDescription = 'Welcome to Prompt Reviews! This comprehensive guide will help you set up your account and start collecting customer reviews in under 30 minutes.'

const defaultKeyFeatures = [
  {
    icon: CheckCircle,
    title: 'Quick Setup Process',
    description: 'Get your account set up and collecting reviews in under 30 minutes with our streamlined onboarding process.'
  },
  {
    icon: Settings,
    title: 'Business Profile Configuration',
    description: 'Complete your business information to unlock all features and personalize your review requests.'
  },
  {
    icon: MessageCircle,
    title: 'First Prompt Page Creation',
    description: 'Create your first personalized review request page with AI-powered content generation.'
  },
  {
    icon: Users,
    title: 'Contact Management Setup',
    description: 'Import your existing customer database or manually add contacts to start requesting reviews.'
  },
  {
    icon: Star,
    title: 'Review Collection Launch',
    description: 'Send your first review requests and start collecting authentic customer feedback immediately.'
  },
  {
    icon: Globe,
    title: 'Website Integration',
    description: 'Embed review widgets on your website to showcase positive reviews and build trust.'
  }
]

const defaultHowItWorks = [
  {
    number: 1,
    title: 'Create Your Account',
    description: 'Sign up for Prompt Reviews and complete your business profile information including name, address, and contact details.',
    icon: Settings
  },
  {
    number: 2,
    title: 'Choose Your Plan',
    description: 'Select the subscription plan that best fits your business needs and review collection goals.',
    icon: Target
  },
  {
    number: 3,
    title: 'Build Your First Prompt Page',
    description: 'Create a personalized review request page using our AI-powered content generation tools.',
    icon: MessageCircle
  },
  {
    number: 4,
    title: 'Add Contacts & Start Collecting',
    description: 'Import your customers and send your first review requests via email, SMS, or QR codes.',
    icon: Users
  }
]

const defaultBestPractices = [
  {
    icon: Clock,
    title: 'Start with Recent Customers',
    description: 'Focus on customers who recently had positive experiences. They\'re more likely to leave glowing reviews and remember details clearly.'
  },
  {
    icon: Sparkles,
    title: 'Use AI Content Generation',
    description: 'Take advantage of AI-powered content creation to personalize your review requests and improve response rates.'
  },
  {
    icon: Target,
    title: 'Test Different Approaches',
    description: 'Try various prompt page types and messaging strategies to see what works best for your business and customers.'
  },
  {
    icon: Zap,
    title: 'Keep It Simple',
    description: 'Make the review process as easy as possible. The fewer clicks and steps required, the more reviews you\'ll collect.'
  }
]

const defaultOverviewContent = (
  <>
    <p className="text-white/90 text-lg mb-6 text-center">
      Most businesses are fully set up and collecting their first reviews within 30 minutes.
      Our streamlined onboarding process makes it easy to get started, even if you've never
      used a review collection platform before.
    </p>

    <div className="grid md:grid-cols-3 gap-6">
      <div className="text-center">
        <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Clock className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-semibold text-white mb-2">30 Minutes Total</h3>
        <p className="text-white/80 text-sm">
          Complete setup from account creation to first review request
        </p>
      </div>

      <div className="text-center">
        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-semibold text-white mb-2">AI-Powered</h3>
        <p className="text-white/80 text-sm">
          Let AI help you create personalized content and optimize requests
        </p>
      </div>

      <div className="text-center">
        <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Users className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-semibold text-white mb-2">All Skill Levels</h3>
        <p className="text-white/80 text-sm">
          No technical skills required - intuitive interface for everyone
        </p>
      </div>
    </div>
  </>
)

function resolveIcon(iconName: string | undefined, fallback: LucideIcon): LucideIcon {
  if (!iconName) return fallback
  const normalized = iconName.trim()
  const lookup = Icons as Record<string, unknown>
  const candidates = [
    normalized,
    normalized.toLowerCase(),
    normalized.toUpperCase(),
    normalized.charAt(0).toUpperCase() + normalized.slice(1),
    normalized.replace(/[-_\s]+/g, ''),
  ]

  for (const key of candidates) {
    const maybeIcon = lookup[key]
    if (typeof maybeIcon === 'function') {
      return maybeIcon as LucideIcon
    }
  }

  return fallback
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const article = await getArticleBySlug('getting-started')
    if (!article) {
      return {
        title: 'Getting Started with Prompt Reviews - Complete Setup Guide',
        description: fallbackDescription,
        alternates: {
          canonical: 'https://docs.promptreviews.app/getting-started',
        },
      }
    }

    const seoTitle = article.metadata?.seo_title || article.title
    const seoDescription = article.metadata?.seo_description || article.metadata?.description || fallbackDescription

    return {
      title: `${seoTitle} | Prompt Reviews`,
      description: seoDescription,
      keywords: article.metadata?.keywords ?? [],
      alternates: {
        canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/getting-started',
      },
    }
  } catch (error) {
    console.error('generateMetadata getting-started error:', error)
    return {
      title: 'Getting Started with Prompt Reviews - Complete Setup Guide',
      description: fallbackDescription,
      alternates: {
        canonical: 'https://docs.promptreviews.app/getting-started',
      },
    }
  }
}

interface MetadataFeature {
  icon?: string
  title: string
  description: string
  href?: string
}

interface MetadataStep {
  number?: number
  icon?: string
  title: string
  description: string
}

interface MetadataBestPractice {
  icon?: string
  title: string
  description: string
}

export default async function GettingStartedPage() {
  let article = null

  try {
    article = await getArticleBySlug('getting-started')
  } catch (error) {
    console.error('Error fetching getting-started article:', error)
  }

  if (!article) {
    notFound()
  }

  const metadata = article.metadata ?? {}

  const getString = (value: unknown): string | undefined => {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim()
    }
    return undefined
  }

  const availablePlans: ('grower' | 'builder' | 'maven' | 'enterprise')[] =
    Array.isArray(metadata.available_plans) && metadata.available_plans.length
      ? (metadata.available_plans as ('grower' | 'builder' | 'maven' | 'enterprise')[])
      : ['grower', 'builder', 'maven']

  const mappedKeyFeatures = Array.isArray(metadata.key_features) && metadata.key_features.length
    ? (metadata.key_features as MetadataFeature[]).map((feature) => ({
        icon: resolveIcon(feature.icon, CheckCircle),
        title: feature.title,
        description: feature.description,
        href: feature.href,
      }))
    : defaultKeyFeatures

  const mappedHowItWorks = Array.isArray(metadata.how_it_works) && metadata.how_it_works.length
    ? (metadata.how_it_works as MetadataStep[]).map((step, index) => ({
        number: step.number ?? index + 1,
        title: step.title,
        description: step.description,
        icon: resolveIcon(step.icon, Settings),
      }))
    : defaultHowItWorks

  const mappedBestPractices = Array.isArray(metadata.best_practices) && metadata.best_practices.length
    ? (metadata.best_practices as MetadataBestPractice[]).map((practice) => ({
        icon: resolveIcon(practice.icon, Clock),
        title: practice.title,
        description: practice.description,
      }))
    : defaultBestPractices

  const CategoryIcon = resolveIcon(
    typeof metadata.category_icon === 'string' && metadata.category_icon.trim().length
      ? metadata.category_icon
      : 'CheckCircle',
    CheckCircle,
  )

  const overviewMarkdown = article.content || ''
  const overviewTitle = getString((metadata as Record<string, unknown>).overview_title) || 'Everything You Need to Get Started'

  const overviewNode = overviewMarkdown
    ? <MarkdownRenderer content={overviewMarkdown} />
    : defaultOverviewContent

  const callToActionMeta = (metadata as Record<string, unknown>).call_to_action
  const parseCTAButton = (value: any) => {
    const text = getString(value?.text)
    const href = getString(value?.href)
    if (!text || !href) return undefined
    return {
      text,
      href,
      external: Boolean(value?.external),
    }
  }

  const fallbackCTA = {
    primary: {
      text: 'View Setup Guides',
      href: '/getting-started/account-setup',
    },
  } as const

  const callToAction = (callToActionMeta && typeof callToActionMeta === 'object')
    ? {
        primary: parseCTAButton((callToActionMeta as any).primary) || fallbackCTA.primary,
        secondary: parseCTAButton((callToActionMeta as any).secondary),
      }
    : fallbackCTA

  const faqMetadata = Array.isArray((metadata as Record<string, unknown>).faqs)
    ? ((metadata as Record<string, unknown>).faqs as { question: string; answer: string }[])
    : null

  const faqsTitle = getString((metadata as Record<string, unknown>).faqs_title)
  const keyFeaturesTitle = getString((metadata as Record<string, unknown>).key_features_title)
  const howItWorksTitle = getString((metadata as Record<string, unknown>).how_it_works_title)
  const bestPracticesTitle = getString((metadata as Record<string, unknown>).best_practices_title)

  return (
    <StandardOverviewLayout
      title={article.title || 'Getting started with Prompt Reviews'}
      description={metadata.description ?? fallbackDescription}
      categoryLabel={metadata.category_label || 'Quick Start Guide'}
      categoryIcon={CategoryIcon}
      categoryColor={metadata.category_color || 'green'}
      currentPage="Getting Started"
      availablePlans={availablePlans}
      keyFeatures={mappedKeyFeatures}
      keyFeaturesTitle={keyFeaturesTitle}
      howItWorks={mappedHowItWorks}
      howItWorksTitle={howItWorksTitle}
      bestPractices={mappedBestPractices}
      bestPracticesTitle={bestPracticesTitle}
      faqs={faqMetadata && faqMetadata.length ? faqMetadata : pageFAQs['getting-started']}
      faqsTitle={faqsTitle}
      callToAction={callToAction}
      overview={{
        title: overviewTitle,
        content: overviewNode,
      }}
    />
  )
}
