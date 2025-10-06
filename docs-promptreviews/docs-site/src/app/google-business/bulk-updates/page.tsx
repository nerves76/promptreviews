import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import StandardOverviewLayout from '../../../components/StandardOverviewLayout'
import MarkdownRenderer from '../../../components/MarkdownRenderer'
import { getArticleBySlug } from '@/lib/docs/articles'

const {
  Layers,
  Building2,
  MapPin,
} = Icons

const fallbackDescription = 'Efficiently manage multiple Google Business Profile locations with bulk editing capabilities.'

const defaultKeyFeatures = [
  {
    icon: Layers,
    title: 'Bulk post creation',
    description: 'Create Google Business Profile posts and publish them to multiple locations at once. Perfect for announcing sales, events, or new products across all your locations.',
  },
  {
    icon: MapPin,
    title: 'Location selection',
    description: 'Easily switch between locations or select multiple locations at once. The system remembers your last selected location for convenience.',
  },
  {
    icon: Building2,
    title: 'Photo management',
    description: 'Upload photos to multiple locations simultaneously. Great for chain businesses that want to maintain consistent branding across all locations.',
  }
]

const defaultHowItWorks = [
  {
    number: 1,
    title: 'Connect locations',
    description: 'Connect all your Google Business Profile locations using OAuth',
  },
  {
    number: 2,
    title: 'Select locations',
    description: 'In the Google Business dashboard, select the locations you want to update',
  },
  {
    number: 3,
    title: 'Create content',
    description: 'Create your post, upload photos, or update information',
  },
  {
    number: 4,
    title: 'Publish',
    description: 'Review your selections and publish to all chosen locations at once',
  }
]

const defaultBestPractices = [
  {
    icon: Building2,
    title: 'Maintain consistency',
    description: 'Use bulk updates to ensure all locations have the same branding and messaging',
  },
  {
    icon: MapPin,
    title: 'Customize when needed',
    description: 'Some updates (like location-specific events) should only go to certain locations',
  },
  {
    icon: Layers,
    title: 'Schedule posts strategically',
    description: 'Use bulk scheduling to plan campaigns across all locations in advance',
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
    const article = await getArticleBySlug('google-business/bulk-updates')
    if (!article) {
      return {
        title: 'Bulk Updates - Google Business Profile | Prompt Reviews Help',
        description: fallbackDescription,
        alternates: {
          canonical: 'https://docs.promptreviews.app/google-business/bulk-updates',
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
        canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/google-business/bulk-updates',
      },
    }
  } catch (error) {
    console.error('generateMetadata google-business/bulk-updates error:', error)
    return {
      title: 'Bulk Updates | Prompt Reviews',
      description: fallbackDescription,
      alternates: {
        canonical: 'https://docs.promptreviews.app/google-business/bulk-updates',
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

export default async function BulkUpdatesPage() {
  let article = null

  try {
    article = await getArticleBySlug('google-business/bulk-updates')
  } catch (error) {
    console.error('Error fetching google-business/bulk-updates article:', error)
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
        icon: resolveIcon(feature.icon, Layers),
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
        icon: resolveIcon(step.icon, Layers),
      }))
    : defaultHowItWorks

  const mappedBestPractices = Array.isArray(metadata.best_practices) && metadata.best_practices.length
    ? (metadata.best_practices as MetadataBestPractice[]).map((practice) => ({
        icon: resolveIcon(practice.icon, Building2),
        title: practice.title,
        description: practice.description,
      }))
    : defaultBestPractices

  const CategoryIcon = resolveIcon(
    typeof metadata.category_icon === 'string' && metadata.category_icon.trim().length
      ? metadata.category_icon
      : 'Layers',
    Layers,
  )

  const overviewMarkdown = getString((metadata as Record<string, unknown>).overview_markdown)
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
      title={article.title || 'Bulk updates'}
      description={metadata.description ?? fallbackDescription}
      categoryLabel={metadata.category_label || 'Google Business Profile'}
      categoryIcon={CategoryIcon}
      categoryColor={metadata.category_color || 'purple'}
      currentPage="Bulk Updates"
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
