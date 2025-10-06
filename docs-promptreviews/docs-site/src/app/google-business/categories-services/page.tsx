import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import StandardOverviewLayout from '../../../components/StandardOverviewLayout'
import MarkdownRenderer from '../../../components/MarkdownRenderer'
import { getArticleBySlug } from '@/lib/docs/articles'

const {
  Tag,
  List,
  Building2,
} = Icons

const fallbackDescription = 'Define your business categories and services to help customers find exactly what you offer.'

const defaultKeyFeatures = [
  {
    icon: Tag,
    title: 'Primary category',
    description: 'Your main business category determines which Google Business Profile features are available and how you appear in search results. Choose the most specific category that accurately describes your core business.',
  },
  {
    icon: List,
    title: 'Additional categories',
    description: 'Add up to 9 additional categories (10 total including primary) to describe other aspects of your business. These help you appear in more search results.',
  },
  {
    icon: Building2,
    title: 'Services',
    description: 'Service items help customers understand exactly what you offer. Each service can include a description to provide more detail.',
  }
]

const defaultHowItWorks = [
  {
    number: 1,
    icon: Tag,
    title: 'Select primary category',
    description: 'Choose the most specific category that describes your core business',
  },
  {
    number: 2,
    icon: List,
    title: 'Add additional categories',
    description: 'Select up to 9 more categories to cover all aspects of your business',
  },
  {
    number: 3,
    icon: Building2,
    title: 'Define services',
    description: 'List all services with detailed descriptions',
  },
  {
    number: 4,
    icon: Tag,
    title: 'Save and verify',
    description: 'Review your selections and save to your profile',
  }
]

const defaultBestPractices = [
  {
    icon: Tag,
    title: 'Choose accurate categories',
    description: 'Incorrect categories can hurt your search ranking',
  },
  {
    icon: List,
    title: 'Research competitors',
    description: 'See what categories successful competitors use',
  },
  {
    icon: Building2,
    title: 'Be comprehensive with services',
    description: 'List all services you offer to capture more searches',
  },
  {
    icon: Tag,
    title: 'Use AI-generated descriptions',
    description: 'Let Prompt Reviews write professional service descriptions that include relevant keywords',
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
    const article = await getArticleBySlug('google-business/categories-services')
    if (!article) {
      return {
        title: 'Categories & Services - Google Business Profile | Prompt Reviews Help',
        description: fallbackDescription,
        alternates: {
          canonical: 'https://docs.promptreviews.app/google-business/categories-services',
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
        canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/google-business/categories-services',
      },
    }
  } catch (error) {
    console.error('generateMetadata google-business/categories-services error:', error)
    return {
      title: 'Categories & Services | Prompt Reviews',
      description: fallbackDescription,
      alternates: {
        canonical: 'https://docs.promptreviews.app/google-business/categories-services',
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

export default async function CategoriesServicesPage() {
  let article = null

  try {
    article = await getArticleBySlug('google-business/categories-services')
  } catch (error) {
    console.error('Error fetching google-business/categories-services article:', error)
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
        icon: resolveIcon(feature.icon, Tag),
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
        icon: resolveIcon(step.icon, Tag),
      }))
    : defaultHowItWorks

  const mappedBestPractices = Array.isArray(metadata.best_practices) && metadata.best_practices.length
    ? (metadata.best_practices as MetadataBestPractice[]).map((practice) => ({
        icon: resolveIcon(practice.icon, Tag),
        title: practice.title,
        description: practice.description,
      }))
    : defaultBestPractices

  const CategoryIcon = resolveIcon(
    typeof metadata.category_icon === 'string' && metadata.category_icon.trim().length
      ? metadata.category_icon
      : 'Tag',
    Tag,
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
      title={article.title || 'Categories & services'}
      description={metadata.description ?? fallbackDescription}
      categoryLabel={metadata.category_label || 'Google Business Profile'}
      categoryIcon={CategoryIcon}
      categoryColor={metadata.category_color || 'blue'}
      currentPage="Categories & Services"
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
