import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import StandardOverviewLayout from '../../../components/StandardOverviewLayout'
import MarkdownRenderer from '../../../components/MarkdownRenderer'
import { getArticleBySlug } from '@/lib/docs/articles'

const {
  Calendar,
  Clock,
  Building2,
} = Icons

const fallbackDescription = 'Enable online booking and appointment scheduling directly from your Google Business Profile.'

const defaultKeyFeatures = [
  {
    icon: Calendar,
    title: 'Booking button integration',
    description: 'Connect your existing scheduling platform (like Square, Booksy, or StyleSeat) to display a "Book Online" button on your Google Business Profile. When customers click it, they\'re taken to your scheduling system.',
  },
  {
    icon: Clock,
    title: 'Reserve with Google',
    description: 'For eligible businesses, Reserve with Google allows customers to book appointments without leaving Google Search or Maps. This seamless integration can increase bookings significantly.',
  }
]

const defaultHowItWorks = [
  {
    number: 1,
    icon: Calendar,
    title: 'Choose platform',
    description: 'Choose a compatible scheduling platform that integrates with Google Business Profile',
  },
  {
    number: 2,
    icon: Clock,
    title: 'Set availability',
    description: 'Set up your appointment availability, services, and pricing in the scheduling platform',
  },
  {
    number: 3,
    icon: Building2,
    title: 'Connect',
    description: 'Connect your scheduling platform to your Google Business Profile through the platform\'s settings',
  },
  {
    number: 4,
    icon: Calendar,
    title: 'Verify',
    description: 'Verify the "Book Online" button appears on your Google Business Profile',
  }
]

const defaultBestPractices = [
  {
    icon: Clock,
    title: 'Keep availability updated',
    description: 'Sync your scheduling system in real-time to avoid double bookings',
  },
  {
    icon: Calendar,
    title: 'Show accurate hours',
    description: 'Make sure your business hours match your booking availability',
  },
  {
    icon: Building2,
    title: 'Request reviews after appointments',
    description: 'Use Prompt Reviews to automatically request feedback from customers who booked through Google',
  },
  {
    icon: Calendar,
    title: 'Monitor booking analytics',
    description: 'Track how many customers book through Google to measure ROI',
  }
]

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
    const article = await getArticleBySlug('google-business/scheduling')
    if (!article) {
      return {
        title: 'Scheduling - Google Business Profile | Prompt Reviews Help',
        description: fallbackDescription,
        alternates: {
          canonical: 'https://docs.promptreviews.app/google-business/scheduling',
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
        canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/google-business/scheduling',
      },
    }
  } catch (error) {
    console.error('generateMetadata google-business/scheduling error:', error)
    return {
      title: 'Scheduling | Prompt Reviews',
      description: fallbackDescription,
      alternates: {
        canonical: 'https://docs.promptreviews.app/google-business/scheduling',
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

export default async function SchedulingPage() {
  let article = null

  try {
    article = await getArticleBySlug('google-business/scheduling')
  } catch (error) {
    console.error('Error fetching google-business/scheduling article:', error)
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
      : ['builder', 'maven']

  const mappedKeyFeatures = Array.isArray(metadata.key_features) && metadata.key_features.length
    ? (metadata.key_features as MetadataFeature[]).map((feature) => ({
        icon: resolveIcon(feature.icon, Calendar),
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
        icon: resolveIcon(step.icon, Calendar),
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
      : 'Calendar',
    Calendar,
  )

  const overviewMarkdown = article.content || ''
  const overviewTitle = getString((metadata as Record<string, unknown>).overview_title) || 'Overview'

  const overviewNode = overviewMarkdown ? <MarkdownRenderer content={overviewMarkdown} /> : undefined

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
      text: 'Business Info',
      href: '/google-business/business-info',
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
      title={article.title || 'Scheduling'}
      description={metadata.description ?? fallbackDescription}
      categoryLabel={metadata.category_label || 'Google Business Profile'}
      categoryIcon={CategoryIcon}
      categoryColor={metadata.category_color || 'green'}
      currentPage="Scheduling"
      availablePlans={availablePlans}
      keyFeatures={mappedKeyFeatures}
      keyFeaturesTitle={keyFeaturesTitle}
      howItWorks={mappedHowItWorks}
      howItWorksTitle={howItWorksTitle}
      bestPractices={mappedBestPractices}
      bestPracticesTitle={bestPracticesTitle}
      faqs={faqMetadata && faqMetadata.length ? faqMetadata : []}
      faqsTitle={faqsTitle}
      callToAction={callToAction}
      overview={overviewNode ? {
        title: overviewTitle,
        content: overviewNode,
      } : undefined}
    />
  )
}
