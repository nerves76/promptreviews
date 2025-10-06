import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import StandardOverviewLayout from '../../../components/StandardOverviewLayout'
import MarkdownRenderer from '../../../components/MarkdownRenderer'
import { getArticleBySlug } from '@/lib/docs/articles'
const {
  Building2,
  MapPin,
  Phone,
  Globe,
  Clock,
} = Icons

const fallbackDescription = 'Manage your core business information to ensure customers can find and contact you accurately.'

const defaultKeyFeatures = [
  {
    icon: Building2,
    title: 'Business name',
    description: 'Your official business name as registered. Should match your signage and legal documents. Avoid keyword stuffing or adding extra information.',
  },
  {
    icon: MapPin,
    title: 'Address',
    description: 'Your physical business location. Must be accurate for Google Maps. For service-area businesses, you can set a service area instead of showing your address.',
  },
  {
    icon: Phone,
    title: 'Phone number',
    description: 'Primary phone number for customer contact. Use a local number when possible. Consider using a tracking number to measure calls from Google.',
  },
  {
    icon: Globe,
    title: 'Website',
    description: 'Your business website URL. Should link to your homepage or a landing page specific to this location.',
  },
  {
    icon: Clock,
    title: 'Business hours',
    description: 'Regular operating hours for each day of the week. Keep these updated, especially during holidays or special events. You can set special hours for holidays.',
  }
]

const defaultHowItWorks = [
  {
    number: 1,
    icon: Building2,
    title: 'Review current information',
    description: 'Check all your business information for accuracy',
  },
  {
    number: 2,
    icon: MapPin,
    title: 'Update details',
    description: 'Make necessary changes to your business information',
  },
  {
    number: 3,
    icon: Clock,
    title: 'Set business hours',
    description: 'Configure regular hours and special holiday hours',
  },
  {
    number: 4,
    icon: Globe,
    title: 'Verify and save',
    description: 'Review all changes and save to your profile',
  }
]

const defaultBestPractices = [
  {
    icon: Building2,
    title: 'Keep information consistent',
    description: 'Match your NAP (Name, Address, Phone) across all online directories',
  },
  {
    icon: Clock,
    title: 'Update hours promptly',
    description: 'Set special hours for holidays at least 2 weeks in advance',
  },
  {
    icon: Phone,
    title: 'Use local phone numbers',
    description: 'Local numbers build trust and may improve local search ranking',
  },
  {
    icon: MapPin,
    title: 'Add service areas',
    description: 'For service-area businesses, specify all areas you serve',
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
    const article = await getArticleBySlug('google-business/business-info')
    if (!article) {
      return {
        title: 'Business Info - Google Business Profile | Prompt Reviews Help',
        description: fallbackDescription,
        alternates: {
          canonical: 'https://docs.promptreviews.app/google-business/business-info',
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
        canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/google-business/business-info',
      },
    }
  } catch (error) {
    console.error('generateMetadata google-business/business-info error:', error)
    return {
      title: 'Business Info | Prompt Reviews',
      description: fallbackDescription,
      alternates: {
        canonical: 'https://docs.promptreviews.app/google-business/business-info',
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

export default async function BusinessInfoPage() {
  let article = null

  try {
    article = await getArticleBySlug('google-business/business-info')
  } catch (error) {
    console.error('Error fetching google-business/business-info article:', error)
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
        icon: resolveIcon(feature.icon, Building2),
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
        icon: resolveIcon(step.icon, Building2),
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
      : 'Building2',
    Building2,
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
      text: 'Categories & Services',
      href: '/google-business/categories-services',
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
      title={article.title || 'Business information'}
      description={metadata.description ?? fallbackDescription}
      categoryLabel={metadata.category_label || 'Google Business Profile'}
      categoryIcon={CategoryIcon}
      categoryColor={metadata.category_color || 'red'}
      currentPage="Business Info"
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
